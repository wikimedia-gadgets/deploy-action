import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect, test} from '@jest/globals'
import { processPaths } from '../src';

test('processPaths', async () => {
  const paths = [
    'src/GAR-helper.js User:SD0001/GAR-helper.js',
    'src/GAN-helper.js User:SD0001/GAN-helper.js'
  ]
  expect(await processPaths(paths)).toEqual([
    ['src/GAR-helper.js', 'User:SD0001/GAR-helper.js'],
    ['src/GAN-helper.js', 'User:SD0001/GAN-helper.js']
  ])
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
