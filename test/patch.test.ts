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

const reactNativePkg = file(
  'node_modules/react-native/package.json',
  `{ "version": "${readFile('package.json').devDependencies['react-native'].replace('^', '')}" }`
)

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

test('Corrupt patch parts will be rejected and patch can be reapplied.', () => {
  prepare([
    packageJson('patch'),
    reactNativePkg,
    // .numic contains the initial state without any changes made.
    file('.numic/ios/first.txt', 'one\ntwo\nthree'),
    file('.numic/android/first.txt', 'one\ntwo\nthree'),
    // Patch will be applied to local folders which are used to build the application.
    file('ios/first.txt', 'one\ntwo\nthree'), // Change: two => four
    file('android/first.txt', 'one\ntwo\nthree'),
    file('patch/current.patch', singleLinePatchContents),
  ])

  initializeRepository()

  expect(readFile('ios/first.txt')).toBe('one\ntwo\nthree\n')

  let nextLog = consoleLogSpy.mock.calls.length

  apply({})

  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain('Patch successfully applied')

  expect(readFile('ios/first.txt')).toBe('one\nfour\nthree\n')
  expect(readFile('android/first.txt')).toBe('one\ntwo\nthree\n')

  nextLog = consoleLogSpy.mock.calls.length

  // Patch can be reapplied.
  apply({})

  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain('Patch successfully applied')

  expect(readFile('ios/first.txt')).toBe('one\nfour\nthree\n')

  writeFile('ios/first.txt', 'one\ntwo\nthree') // Reset local contents.

  const corruptPatch = singleLinePatchContents
    .replace('-two', '-five') // Line not found in source file.
    .replace('+four', '+six')

  writeFile('patch/current.patch', corruptPatch)

  nextLog = consoleLogSpy.mock.calls.length

  apply({})

  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain(
    'Unable to apply some changes in the patch'
  )

  expect(readFile('ios/first.txt')).toBe('one\ntwo\nthree\n')
  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(true)
})

test('Patching also works with nested files and multiple changes.', () => {
  const firstFileName = 'ios/first.txt'
  const secondFileName = 'ios/nested/deep/second.txt'
  const thirdFileName = 'android/further-down/third.txt'

  const firstInitialContents = 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\n'
  const secondThirdInitialContents = 'one\ntwo\nthree\n'
  const firstChangedContents = 'one\ntwwo\nthree\nfour\nfive\nsix\nseven\neiight\nnine\n'
  const secondThirdChangedContents = 'one\ntwwo\nthree\n'

  prepare([
    packageJson('patch'),
    reactNativePkg,
    file(`.numic/${firstFileName}`, firstInitialContents),
    file(`.numic/${secondFileName}`, secondThirdInitialContents),
    file(`.numic/${thirdFileName}`, secondThirdInitialContents),
    file(firstFileName, firstChangedContents),
    file(secondFileName, secondThirdChangedContents),
    file(thirdFileName, secondThirdChangedContents),
  ])

  const patchPath = join(process.cwd(), 'patch/current.patch')
  const rejectedHunksPath = join(process.cwd(), 'patch/rejected-hunks.patch')
  let nextLog = consoleLogSpy.mock.calls.length

  // Create patch.
  initializeRepository()
  patch()

  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain('Patch create')
  expect(existsSync(patchPath)).toBe(true)
  expect(existsSync(rejectedHunksPath)).toBe(false)

  const patchContents = readFile(patchPath)
  expect(patchContents).toContain(firstFileName)
  expect(patchContents).toContain(secondFileName)
  expect(patchContents).toContain(thirdFileName)
  expect(patchContents).toContain('twwo')
  expect(patchContents).toContain('eiight')

  expect(readFile(join('.numic', firstFileName))).toEqual(firstInitialContents)
  expect(readFile(firstFileName)).toEqual(firstChangedContents)

  nextLog = consoleLogSpy.mock.calls.length
  apply({}) // Patch can be reapplied.
  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain('Patch successfully applied')

  expect(existsSync(rejectedHunksPath)).toBe(false)
  expect(readFile(join('.numic', firstFileName))).toEqual(firstInitialContents)
  expect(readFile(firstFileName)).toEqual(firstChangedContents)

  writeFile(firstFileName, firstInitialContents)
  writeFile(secondFileName, secondThirdInitialContents)
  writeFile(thirdFileName, secondThirdInitialContents)

  nextLog = consoleLogSpy.mock.calls.length
  apply({}) // Patch fully applied.
  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain('Patch successfully applied')

  expect(existsSync(rejectedHunksPath)).toBe(false)
  expect(readFile(join('.numic', firstFileName))).toEqual(firstInitialContents)
  expect(readFile(firstFileName)).toEqual(firstChangedContents)

  writeFile(firstFileName, firstInitialContents)
  writeFile(secondFileName, 'one\nmissing\nthree\n')
  writeFile(thirdFileName, secondThirdInitialContents)

  nextLog = consoleLogSpy.mock.calls.length
  apply({}) // Second change is rejected.
  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain(
    'Unable to apply some changes in the patch'
  )

  expect(existsSync(rejectedHunksPath)).toBe(true)
  expect(readFile(join('.numic', firstFileName))).toEqual(firstInitialContents)
  expect(readFile(firstFileName)).toEqual(firstChangedContents)
  let rejectedHunkContents = readFile(rejectedHunksPath)
  expect(rejectedHunkContents).not.toContain(firstFileName)
  expect(rejectedHunkContents).toContain(secondFileName)
  expect(rejectedHunkContents).not.toContain(thirdFileName)
  expect(rejectedHunkContents).toContain('-two')
  expect(rejectedHunkContents).toContain('+twwo')

  writeFile(secondFileName, 'one\ntwwo\nthree\n')

  nextLog = consoleLogSpy.mock.calls.length
  apply({}) // Hunk already applied, but cannot be reversed.
  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain('Removing patch/rejected-hunks.patch')
  expect(consoleLogSpy.mock.calls[nextLog + 1][0]).toContain('Patch successfully applied')

  expect(existsSync(rejectedHunksPath)).toBe(false)
  expect(readFile(secondFileName)).toContain('twwo')

  // First change (twwo) is already applied, second eeight matches neiter and is rejected.
  writeFile(firstFileName, 'one\ntwwo\nthree\nfour\nfive\nsix\nseven\neeight\nnine\n')
  writeFile(secondFileName, secondThirdInitialContents)
  writeFile(thirdFileName, secondThirdInitialContents)

  nextLog = consoleLogSpy.mock.calls.length
  apply({})
  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain(
    'Unable to apply some changes in the patch'
  )

  expect(existsSync(rejectedHunksPath)).toBe(true)
  expect(readFile(secondFileName)).toEqual(secondThirdChangedContents)
  rejectedHunkContents = readFile(rejectedHunksPath)
  expect(rejectedHunkContents).toContain(firstFileName)
  expect(rejectedHunkContents).not.toContain(secondFileName)
  expect(rejectedHunkContents).not.toContain(thirdFileName)
  expect(rejectedHunkContents).toContain('-eight')
  expect(rejectedHunkContents).toContain('+eiight')
})

test('Changes can be excluded from patch with nativeGitignore option.', () => {
  prepare([
    packageJson('patch', { numic: { nativeGitignore: ['first.txt', 'second.txt'] } }),
    reactNativePkg,
    file('.numic/ios/first.txt', 'one\ntwo\nthree'),
    file('.numic/android/second.txt', 'one\ntwo\nthree'),
    file('ios/first.txt', 'one\nfour\nthree'),
    file('android/second.txt', 'one\nfour\nthree'),
  ])

  const nextLog = consoleLogSpy.mock.calls.length

  initializeRepository()
  patch()

  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain('No changes to patch found')

  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(false)
})

test('nativeGitignore option can be used to include otherwise ignored files.', () => {
  prepare([
    packageJson('patch', { numic: { nativeGitignore: '!IDEWorkspaceChecks.plist' } }),
    reactNativePkg,
    file(
      '.numic/ios/numic.xcodeproj/project.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist',
      'one\ntwo\nthree'
    ),
    file('.numic/android/second.txt', 'one\ntwo\nthree'),
    file(
      'ios/numic.xcodeproj/project.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist',
      'one\nfour\nthree'
    ),
    file('android/second.txt', 'one\ntwo\nthree'),
  ])

  const nextLog = consoleLogSpy.mock.calls.length

  initializeRepository()
  patch()

  expect(consoleLogSpy.mock.calls[nextLog][0]).toContain('Patch created')

  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(true)
})
