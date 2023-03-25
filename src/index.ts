import * as core from "@actions/core";
import * as github from "@actions/github";
import fs from "fs/promises";
import fetch from 'node-fetch';
import FormData from "form-data";

const HOST = 'https://sdzerobot.toolforge.org/gitsync'

export async function run(): Promise<void> {
  try {
    const apiUrl = core.getInput('apiUrl', {required: true})
    const username = core.getInput('username')
    const password = core.getInput('password')
    const OAuth2AccessToken = core.getInput('oauth2Token')

    const usingBotPassword = !!username && !!password
    const usingOAuth = !!OAuth2AccessToken

    if (!usingBotPassword && !usingOAuth) {
      core.error(
        'No authentication credentials specified. Please specify either OAuth (oauth2AccessToken) or the BotPassword (username and password) credentials.'
      )
    }

    const context = github.context
    const paths = await processPaths(core.getMultilineInput('paths'))
    const editSummary = core.getInput('editSummary') ||
      `Updating from repo at ${context.ref}`

    const baseRequestParams = {apiUrl, username, password, OAuth2AccessToken}

    await Promise.all(requestEdits(baseRequestParams, paths, editSummary))

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

export async function processPaths(pathsInput: string[]): Promise<Array<[string, string]>> {
  return (await Promise.all(pathsInput.map(path => processPath(path)))).flat()
}

export async function processPath(path: string): Promise<Array<[string, string]>> {
  let [source, dest] = path.split(' ')
  if (path.includes('**')) {
    throw new Error('glob pattern ** is not allowed in paths')
  }
  if (!path.includes('*')) {
    return [ [source, dest] ]
  }
  throw new Error('* pattern not supported at the moment, check back later!')
  // const files = await glob(source, { ignore: 'node_modules/**' })
  // const destinations = files.map(file => {
  //   const globMatch = file.match('*')
  // })

}

export function requestEdits(baseParams: Record<string, string>, paths: Array<[string, string]>, editSummary: string) {
  return paths.map(async path => {
    let [sourceFile, wikiPage] = path
    let requestParams = {
      ...baseParams,
      page: wikiPage,
      // XXX: should we stream this instead, or send the file directly?
      content: (await fs.readFile(sourceFile)).toString(),
      editSummary
    }
    const formData = new FormData();
    for (let [key, val] of Object.entries(requestParams)) {
      formData.append(key, val);
    }
    const response = await fetch(`${HOST}/savepage`, {
      method: 'POST',
      headers: {
        "Content-Type": "multipart/form-data"
      },
      body: formData
    })
    // 3xx-5xx responses are not thrown
    const result = await response.json() as {edit?: string, error?: string}
    if (result.error) {
      core.error(`Failed to update ${wikiPage}: ${result.error}`)
      core.setFailed('Failed to update one or more pages')
    } else {
      if (result.edit === 'successful') {
        core.info(`Successfully edited ${wikiPage}`)
      } else {
        core.info(`No change from edit to ${wikiPage}`)
      }
    }
  })
}
