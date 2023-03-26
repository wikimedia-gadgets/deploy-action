import * as core from '@actions/core'
import * as github from '@actions/github'
import fs from 'fs/promises'
import fetch from 'node-fetch'
import FormData from 'form-data'
import glob from 'glob'
import escapeStringRegexp from 'escape-string-regexp'

const HOST = 'https://sdzerobot.toolforge.org/gitsync'

export async function run(): Promise<void> {
  try {
    const apiUrl = core.getInput('apiUrl', {required: true})
    const username = core.getInput('username')
    const password = core.getInput('password')
    const oauth2Token = core.getInput('oauth2Token')

    const usingBotPassword = !!username && !!password
    const usingOAuth = !!oauth2Token

    if (!usingBotPassword && !usingOAuth) {
      return core.setFailed(
        'No authentication credentials specified. Please specify either OAuth (oauth2AccessToken) or the BotPassword (username and password) credentials.'
      )
    }

    const context = github.context
    const paths = await processPaths(core.getMultilineInput('paths'))
    const editSummary =
      core.getInput('editSummary') || `Updating from repo at ${context.ref}`

    const baseRequestParams = {apiUrl, username, password, oauth2Token}

    await requestEdits(baseRequestParams, paths, editSummary)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

export async function processPaths(
  pathsInput: string[]
): Promise<Array<[string, string]>> {
  return (await Promise.all(pathsInput.map(path => processPath(path)))).flat()
}

export async function processPath(
  path: string
): Promise<Array<[string, string]>> {
  let [source, dest] = path.split(' ')
  if (path.includes('**')) {
    throw new Error('glob pattern ** is not allowed in paths')
  }
  if (!source.includes('*')) {
    return [[source, dest]]
  }
  const sourceFiles = await glob(source, {ignore: 'node_modules/**'})
  const rgx = new RegExp(escapeStringRegexp(source).replace('\\*', '(.*)'))
  return sourceFiles.map(file => {
    const matchedPart = file.match(rgx)?.[1]
    if (matchedPart) {
      return [file, dest.replace('*', matchedPart)]
    } else {
      return [file, dest]
    }
  })
}

export function requestEdits(
  baseParams: Record<string, string>,
  paths: Array<[string, string]>,
  editSummary: string
) {
  return Promise.all(
    paths.map(async path => {
      let [sourceFile, wikiPage] = path
      let requestParams = {
        ...baseParams,
        page: wikiPage,
        // XXX: should we stream this instead, or send the file directly?
        content: (await fs.readFile(sourceFile)).toString(),
        editSummary
      }
      const formData = new FormData()
      for (let [key, val] of Object.entries(requestParams)) {
        formData.append(key, val)
      }
      core.info(`Syncing ${sourceFile} with ${wikiPage}`)
      try {
        const response = await fetch(`${HOST}/savepage`, {
          method: 'POST',
          body: formData
        })
        // 3xx-5xx responses are not thrown
        const result = (await response.json()) as {
          edit?: string
          error?: string
        }
        if (result.error) {
          core.setFailed(`Failed to update ${wikiPage}: ${result.error}`)
        } else {
          if (result.edit === 'successful') {
            core.info(`Successfully edited ${wikiPage}`)
          } else {
            core.info(`No change from edit to ${wikiPage}`)
          }
        }
      } catch (e) {
        core.setFailed(`Failed to update ${wikiPage}: ${e}`)
      }
    })
  )
}
