import { existsSync } from 'fs'
import { join } from 'path'
import { expect, test, beforeEach, afterEach, vi } from 'vitest'
import {
  registerVitest,
  prepare,
  environment,
  packageJson,
  readFile,
  writeFile,
  file,
} from 'jest-fixture'
import { initializeRepository } from '../git'
import { patch } from '../script/patch'
import { apply } from '../script/apply'
import { resetOptions } from '../helper'

registerVitest(beforeEach, afterEach, vi)
beforeEach(resetOptions)
environment('patch')

const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

const reactNativePkg = file('node_modules/react-native/package.json', '{ "version": "0.70.6" }')

let singleLinePatchContents: string

test(`Doesn't create a patch when there are no changes.`, () => {
  prepare([
    packageJson('patch'),
    reactNativePkg,
    file('.numic/ios/first.txt', 'one\ntwo\nthree'),
    file('.numic/android/first.txt', 'one\ntwo\nthree'),
    file('ios/first.txt', 'one\ntwo\nthree'),
    file('android/first.txt', 'one\ntwo\nthree'),
  ])

  expect(existsSync(join(process.cwd(), '.numic/ios/first.txt'))).toBe(true)
  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(false)

  const nextLog = consoleLogSpy.mock.calls.length

  initializeRepository()
  patch()

  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain('No changes to patch found')

  expect(existsSync(join(process.cwd(), '.numic/ios/first.txt'))).toBe(true)
  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(false)
  expect(readFile('.numic/ios/first.txt')).toBe('one\ntwo\nthree\n') // Backslash added, probably when writing.
})

test('Changes made will appear in patch and can be reapplied.', () => {
  prepare([
    packageJson('patch'),
    reactNativePkg,
    file('.numic/ios/first.txt', 'one\ntwo\nthree'),
    file('.numic/ios/second.txt', 'one\ntwo\nthree'),
    file('.numic/android/first.txt', 'one\ntwo\nthree'),
    file('ios/first.txt', 'one\nfour\nthree'), // Change: two => four
    file('ios/second.txt', 'one\ntwo\nthree'),
    file('android/first.txt', 'one\ntwo\nthree'),
  ])

  initializeRepository()

  // writeFile('ios/first.txt', 'one\nfour\nthree')
  patch()

  expect(existsSync(join(process.cwd(), '.numic/ios/first.txt'))).toBe(true)
  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(true)

  singleLinePatchContents = readFile('patch/current.patch')
  expect(singleLinePatchContents).toContain('ios/first.txt')
  expect(singleLinePatchContents).toContain('-two')
  expect(singleLinePatchContents).toContain('+four')
  expect(singleLinePatchContents).not.toContain('second.txt')
  expect(singleLinePatchContents).not.toContain('android')

  // Git changes are reset.
  expect(readFile('.numic/ios/first.txt')).toBe('one\ntwo\nthree\n')

  // Local changes are kept.
  expect(readFile('ios/first.txt')).toBe('one\nfour\nthree\n')

  writeFile('ios/first.txt', 'one\ntwo\nthree')

  expect(readFile('ios/first.txt')).toBe('one\ntwo\nthree\n')

  apply({})

  expect(readFile('ios/first.txt')).toBe('one\nfour\nthree\n')
})

test('Corrupt patch parts will be rejected.', () => {
  prepare([
    packageJson('patch'),
    reactNativePkg,
    // .numic contains the initial state without any changes made.
    file('.numic/ios/first.txt', 'one\ntwo\nthree'),
    // file('.numic/ios/second.txt', 'one\ntwo\nthree'),
    // file('.numic/ios/third.txt', 'one\ntwo\nthree'),
    file('.numic/android/first.txt', 'one\ntwo\nthree'),
    // Patch will be applied to local folders which are used to build the application.
    file('ios/first.txt', 'one\ntwo\nthree'), // Change: two => four
    // file('ios/second.txt', 'one\ntwo\nthree'),
    // file('ios/third.txt', 'one\ntwo\nthree'),
    file('android/first.txt', 'one\ntwo\nthree'),
    file('patch/current.patch', singleLinePatchContents),
  ])

  initializeRepository()

  expect(readFile('ios/first.txt')).toBe('one\ntwo\nthree\n')

  let nextLog = consoleLogSpy.mock.calls.length

  apply({}) // Patch cannot be applied multiple times without reset.

  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain('Patch successfully applied')

  expect(readFile('ios/first.txt')).toBe('one\nfour\nthree\n')

  writeFile('ios/first.txt', 'one\ntwo\nthree') // Reset local contents.

  const corruptPatch = singleLinePatchContents
    .replace('-two', '-five') // Line not found in source file.
    .replace('+four', '+six')

  writeFile('patch/current.patch', corruptPatch)

  nextLog = consoleLogSpy.mock.calls.length

  apply({ reject: true })

  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain('Unable to apply patch')

  expect(readFile('ios/first.txt')).toBe('one\ntwo\nthree\n')
  expect(existsSync(join(process.cwd(), 'ios/first.txt.rej'))).toBe(true)
})
