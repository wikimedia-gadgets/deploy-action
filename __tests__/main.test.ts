import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect, test} from '@jest/globals'
import {processPaths, requestEdits} from '../src'
import fs from 'fs/promises'

test('processPaths', async () => {
  const paths = [
    'src/GAR-helper.js User:SD0001/GAR-helper.js',
    'src/GAN-helper.js User:SD0001/GAN-helper.js',
    '__tests__/sample-* User:SD0001/sample-*'
  ]
  expect(await processPaths(paths)).toEqual([
    ['src/GAR-helper.js', 'User:SD0001/GAR-helper.js'],
    ['src/GAN-helper.js', 'User:SD0001/GAN-helper.js'],
    ['__tests__/sample-style.css', 'User:SD0001/sample-style.css'],
    ['__tests__/sample-script.js', 'User:SD0001/sample-script.js']
  ])
})

test.skip('requestEdits', async () => {
  const accessToken = (await fs.readFile('./__tests__/.oauth2token.txt'))
    .toString()
    .trim()
  await requestEdits(
    {
      apiUrl: 'https://test.wikipedia.org/w/api.php',
      oauth2Token: accessToken
    },
    [['__tests__/sample-script.js', 'User:SDZeroBot/deploy-test.js']],
    'Updating from ref ____'
  )
})

// shows how the runner will run a javascript action with env / stdout protocol
test.skip('test runs', () => {
  process.env['INPUT_MILLISECONDS'] = '500'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  console.log(cp.execFileSync(np, [ip], options).toString())
})
