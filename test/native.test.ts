import { existsSync, rmSync } from 'fs'
import { join } from 'path'
import { expect, test, beforeEach, afterEach, vi } from 'vitest'
import { prepare, environment, packageJson, readFile, writeFile, file } from 'jest-fixture'
import { native } from '../script/native'
import { patch } from '../script/patch'
import { apply } from '../script/apply'
import { resetOptions } from '../options'

// @ts-ignore
global.jest = { spyOn: vi.spyOn }
// @ts-ignore
global.beforeEach = beforeEach
// @ts-ignore
global.afterEach = afterEach

beforeEach(resetOptions)

environment('native')

const reactNativePkg = file('node_modules/react-native/package.json', '{ "version": "0.69.0" }')

test('Create native project for android and ios.', async () => {
  prepare([packageJson('native'), reactNativePkg])

  await native({ skipInstall: true })

  expect(existsSync(join(process.cwd(), '.numic'))).toBe(true)
  // Unmodified native folders.
  expect(existsSync(join(process.cwd(), '.numic/android'))).toBe(true)
  expect(existsSync(join(process.cwd(), '.numic/ios'))).toBe(true)
  // User native folders.
  expect(existsSync(join(process.cwd(), 'android'))).toBe(true)
  expect(existsSync(join(process.cwd(), 'ios'))).toBe(true)
  // Temporaray folder removed.
  expect(existsSync(join(process.cwd(), '.numic/NumicApp'))).toBe(false)
  // Git repository created.
  expect(existsSync(join(process.cwd(), '.numic/.git'))).toBe(true)
})

test('Removes existing native files.', async () => {
  prepare([
    packageJson('native-remove'),
    file('ios/hello.js', 'console.log("hello")'),
    reactNativePkg,
  ])

  expect(existsSync(join(process.cwd(), 'ios/hello.js'))).toBe(true)

  await native({ skipInstall: true })

  expect(existsSync(join(process.cwd(), 'ios/hello.js'))).toBe(false)
})

test('Creates patch for simple change in android and ios user folder.', async () => {
  prepare([packageJson('native'), reactNativePkg])

  await native({ skipInstall: true })

  const buildGradleContents = readFile('android/build.gradle')
  const changedContents = buildGradleContents.replace('mavenCentral()', 'navenUI()')

  writeFile('android/build.gradle', changedContents)

  const podfileContents = readFile('ios/Podfile')
  const changedPodfileContents = podfileContents.replace(
    ':deterministic_uuids => false',
    ':some_other_flag => true'
  )

  writeFile('ios/Podfile', changedPodfileContents)

  patch()

  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(true)

  const patchContents = readFile('patch/current.patch')

  expect(patchContents).toContain('mavenCentral()')
  expect(patchContents).toContain('navenUI()')

  expect(patchContents).toContain("-install! 'cocoapods', :deterministic_uuids => false")
  expect(patchContents).toContain("+install! 'cocoapods', :some_other_flag => true")

  // Restore initial native folder change.
  writeFile('android/build.gradle', buildGradleContents)
  writeFile('ios/Podfile', podfileContents)

  expect(readFile('android/build.gradle')).not.toContain('navenUI()')
  expect(readFile('android/build.gradle')).toContain('mavenCentral()')
  expect(readFile('ios/Podfile')).not.toContain(':some_other_flag => true')

  apply()

  const patchedBuildGradleContents = readFile('android/build.gradle')
  const patchedPodfileContents = readFile('ios/Podfile')

  expect(patchedBuildGradleContents).not.toContain('mavenCentral()')
  expect(patchedBuildGradleContents).toContain('navenUI()')

  expect(patchedPodfileContents).not.toContain(':deterministic_uuids => false')
  expect(patchedPodfileContents).toContain(':some_other_flag => true')
})

test('Patches nested changes as well as file additions and TODO removals.', async () => {
  prepare([packageJson('native'), reactNativePkg])

  await native({ skipInstall: true })

  const manifestPath = 'android/app/src/main/AndroidManifest.xml'
  const manifestContents = readFile(manifestPath)
  const changedContents = manifestContents.replace(
    'android:allowBackup="false"',
    'android:allowBackup="true"'
  )
  writeFile(manifestPath, changedContents)

  // Add new file
  writeFile('android/app/config.xml', changedContents)

  // TODO Remove file
  // Staging and patching removed files currently doesn't work.
  // const keystorePath = join(process.cwd(), 'android/app/debug.keystore')
  // const keystoreContents = readFile(keystorePath)
  // expect(existsSync(keystorePath)).toBe(true)
  // rmSync(keystorePath)
  // expect(existsSync(keystorePath)).toBe(false)

  // TODO rename file

  // expect(existsSync(keystorePath)).toBe(false)

  patch()

  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(true)

  const patchContents = readFile('patch/current.patch')

  expect(patchContents).toBeDefined()

  // Restore initial native folder change.
  writeFile(manifestPath, manifestContents)
  rmSync(join(process.cwd(), 'android/app/config.xml'))
  // TODO writeFile(keystorePath, keystoreContents)

  // Check if properly reverted to initial state.
  expect(readFile(manifestPath)).toContain('android:allowBackup="false"')
  expect(existsSync(join(process.cwd(), 'android/app/config.xml'))).toBe(false)
  // TODO expect(existsSync(keystorePath)).toBe(true)

  apply()

  expect(readFile(manifestPath)).toContain('android:allowBackup="true"')
  expect(existsSync(join(process.cwd(), 'android/app/config.xml'))).toBe(true)
  // TODO expect(existsSync(keystorePath)).toBe(false)
})

test('Reverted changes disappear from patch.', async () => {
  prepare([packageJson('native'), reactNativePkg])

  await native({ skipInstall: true })

  let buildGradleContents = readFile('android/build.gradle')
  const changedContents = buildGradleContents.replace('mavenCentral()', 'navenUI()')

  writeFile('android/build.gradle', changedContents)

  patch()
  apply()

  const patchedBuildGradleContents = readFile('android/build.gradle')

  expect(patchedBuildGradleContents).not.toContain('mavenCentral()')
  expect(patchedBuildGradleContents).toContain('navenUI()')

  const revertedButChangedContentChanges = buildGradleContents.replace(
    'buildToolsVersion',
    'customToolsVersion'
  )

  writeFile('android/build.gradle', revertedButChangedContentChanges)

  patch()
  apply()

  buildGradleContents = readFile('android/build.gradle')

  expect(buildGradleContents).toContain('mavenCentral()')
  expect(buildGradleContents).not.toContain('navenUI()')
  expect(buildGradleContents).toContain('customToolsVersion')
  expect(buildGradleContents).not.toContain('buildToolsVersion')
})
