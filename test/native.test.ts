import { existsSync, rmSync, cpSync, renameSync, mkdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
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
import { native } from '../script/native'
import { patch } from '../script/patch'
import { plugin } from '../script/plugin'
import { apply } from '../script/apply'
import { replaceIndexLinesFromPatch, resetOptions } from '../helper'

const initialCwd = process.cwd()

registerVitest(beforeEach, afterEach, vi)
beforeEach(resetOptions)
environment('native')

const reactNativePkg = file(
  'node_modules/react-native/package.json',
  `{ "version": "${readFile('package.json').devDependencies['react-native'].replace('^', '')}" }`,
)

test('Create native project for android and ios.', async () => {
  prepare([packageJson('native'), reactNativePkg])

  await native()

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

  await native()

  expect(existsSync(join(process.cwd(), 'ios/hello.js'))).toBe(false)
})

test('Creates patch for simple change in android and ios user folder.', async () => {
  prepare([packageJson('native-change'), reactNativePkg])

  await native()

  const buildGradleContents = readFile('android/build.gradle')
  const changedContents = buildGradleContents.replace('mavenCentral()', 'navenUI()')

  writeFile('android/build.gradle', changedContents)

  const podfileContents = readFile('ios/Podfile')
  const changedPodfileContents = podfileContents.replace(
    'config = use_native_modules!',
    'config = use_active_modules',
  )

  writeFile('ios/Podfile', changedPodfileContents)

  patch()

  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(true)

  const patchContents = readFile('patch/current.patch')

  expect(patchContents).toContain('mavenCentral()')
  expect(patchContents).toContain('navenUI()')
  expect(patchContents).toContain('-  config = use_native_modules!')
  expect(patchContents).toContain('+  config = use_active_modules')

  // Restore initial native folder change.
  writeFile('android/build.gradle', buildGradleContents)
  writeFile('ios/Podfile', podfileContents)

  expect(readFile('android/build.gradle')).not.toContain('navenUI()')
  expect(readFile('android/build.gradle')).toContain('mavenCentral()')
  expect(readFile('ios/Podfile')).not.toContain('config = use_active_modules')

  apply({})

  const patchedBuildGradleContents = readFile('android/build.gradle')
  const patchedPodfileContents = readFile('ios/Podfile')

  expect(patchedBuildGradleContents).not.toContain('mavenCentral()')
  expect(patchedBuildGradleContents).toContain('navenUI()')

  expect(patchedPodfileContents).not.toContain('config = use_native_modules!')
  expect(patchedPodfileContents).toContain('config = use_active_modules')
})

test('Patches nested changes as well as file additions, renames and removals.', async () => {
  prepare([packageJson('native-nested'), reactNativePkg])

  await native()

  const manifestPath = 'android/app/src/main/AndroidManifest.xml'
  const manifestContents = readFile(manifestPath)
  const changedContents = manifestContents.replace(
    'android:allowBackup="false"',
    'android:allowBackup="true"',
  )
  writeFile(manifestPath, changedContents)

  // Add new file
  writeFile('android/app/config.xml', changedContents)

  // Remove file
  const stringsXMLPath = join(process.cwd(), 'android/app/src/main/res/values/strings.xml')
  const stringsXMLContents = readFile(stringsXMLPath)

  expect(existsSync(stringsXMLPath)).toBe(true)

  rmSync(stringsXMLPath)

  expect(existsSync(stringsXMLPath)).toBe(false)

  // Rename file (git doesn't really do rename, will result in a remove and an add).
  const stylesXMLPath = join(process.cwd(), 'android/app/src/main/res/values/styles.xml')
  const stylesXMLRenamedPath = join(
    process.cwd(),
    'android/app/src/main/res/values/styles-renamed.xml',
  )

  renameSync(stylesXMLPath, stylesXMLRenamedPath)
  expect(existsSync(stylesXMLPath)).toBe(false)
  expect(existsSync(stylesXMLRenamedPath)).toBe(true)

  patch()

  // Files removed from internal repo.
  expect(existsSync(stylesXMLPath.replace('/android/', '.numic/android/'))).toBe(false)
  expect(existsSync(stringsXMLPath.replace('/android/', '.numic/android/'))).toBe(false)

  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(true)

  const patchContents = readFile('patch/current.patch')

  expect(patchContents).toBeDefined()

  // Restore initial native folder change.
  writeFile(manifestPath, manifestContents)
  rmSync(join(process.cwd(), 'android/app/config.xml'))
  writeFile(stringsXMLPath, stringsXMLContents)
  renameSync(stylesXMLRenamedPath, stylesXMLPath)

  // Check if properly reverted to initial state.
  expect(readFile(manifestPath)).toContain('android:allowBackup="false"')
  expect(existsSync(join(process.cwd(), 'android/app/config.xml'))).toBe(false)
  expect(existsSync(stringsXMLPath)).toBe(true)
  expect(existsSync(stylesXMLPath)).toBe(true)
  expect(existsSync(stylesXMLRenamedPath)).toBe(false)

  apply({})

  expect(readFile(manifestPath)).toContain('android:allowBackup="true"')
  expect(existsSync(join(process.cwd(), 'android/app/config.xml'))).toBe(true)
  expect(existsSync(stylesXMLPath)).toBe(false)
  expect(existsSync(stylesXMLRenamedPath)).toBe(true)
  expect(existsSync(stringsXMLPath)).toBe(false)
})

test('Reverted changes disappear from patch.', async () => {
  prepare([packageJson('native-revert'), reactNativePkg])

  await native()

  let buildGradleContents = readFile('android/build.gradle')
  const changedContents = buildGradleContents.replace('mavenCentral()', 'navenUI()')

  writeFile('android/build.gradle', changedContents)

  patch()
  apply({})

  const patchedBuildGradleContents = readFile('android/build.gradle')

  expect(patchedBuildGradleContents).not.toContain('mavenCentral()')
  expect(patchedBuildGradleContents).toContain('navenUI()')

  const revertedButChangedContentChanges = buildGradleContents.replace(
    'buildToolsVersion',
    'customToolsVersion',
  )

  writeFile('android/build.gradle', revertedButChangedContentChanges)

  patch()
  apply({})

  buildGradleContents = readFile('android/build.gradle')

  expect(buildGradleContents).toContain('mavenCentral()')
  expect(buildGradleContents).not.toContain('navenUI()')
  expect(buildGradleContents).toContain('customToolsVersion')
  expect(buildGradleContents).not.toContain('buildToolsVersion')
})

test('Patches binary files like images.', async () => {
  prepare([packageJson('native-binary'), reactNativePkg])

  await native()

  patch()

  // Initially nothing to patch.
  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(false)

  const logoPath = join(process.cwd(), 'ios/logo.png')

  cpSync(join(initialCwd, 'logo.png'), logoPath)

  patch()

  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(true)

  rmSync(logoPath)

  expect(existsSync(join(process.cwd(), 'ios'))).toBe(true)
  expect(existsSync(logoPath)).toBe(false)

  apply({})

  expect(existsSync(logoPath)).toBe(true)
})

test('Picks up existing appName from app.json.', async () => {
  prepare([
    packageJson('native-app-name'),
    file('app.json', '{ "name": "ThisReact" }'),
    reactNativePkg,
  ])

  await native()

  expect(existsSync(join(process.cwd(), 'ios/ThisReact'))).toBe(true)
  expect(existsSync(join(process.cwd(), 'ios/ThisReact.xcodeproj'))).toBe(true)

  const settingsGradleContents = readFile('android/settings.gradle')

  expect(settingsGradleContents).toContain(`rootProject.name = 'ThisReact'`)

  const buildGradleContents = readFile('android/app/build.gradle')

  expect(buildGradleContents).toContain('com.thisreact')
})

test('Patch not applied to repository during initialization.', async () => {
  prepare([packageJson('native-initial-patch'), reactNativePkg])

  cpSync(
    join(initialCwd, 'test/patch/build-gradle.patch'),
    join(process.cwd(), 'patch/current.patch'),
    { recursive: true },
  )

  // Installation commands.
  await native()
  apply({ skipEmpty: true }) // => applies existing patch to native root folders.
  // Run/build commands.
  await plugin()
  patch()

  // Patch is applied to regular native folders
  const buildGradleContents = readFile('android/build.gradle')
  // WARN fails if build.gradle dependency version in build-gradle.patch is out-of-date.
  expect(buildGradleContents).not.toContain('mavenCentral()')
  expect(buildGradleContents).toContain('navenUI()')

  // Patch is not applied to repository copy.
  const repositoryBuildGradleContents = readFile('.numic/android/build.gradle')
  expect(repositoryBuildGradleContents).toContain('mavenCentral()')
  expect(repositoryBuildGradleContents).not.toContain('navenUI()')
})

test("Invalid dependencies in root don't lead to failing native installation.", async () => {
  // ESM exports field without specific entry for package.json leads to validation error with CLI@8.0.3.
  prepare([packageJson('native-validation', { dependencies: { laier: '1.0.3' } }), reactNativePkg])

  execSync('npm i --legacy-peer-deps', { cwd: process.cwd() })

  mkdirSync(join(process.cwd(), 'node_modules/react-native'), { recursive: true })
  writeFile('node_modules/react-native/package.json', { version: '0.69.0' })

  expect(existsSync(join(process.cwd(), 'node_modules/laier'))).toBe(true)

  // @ts-ignore
  process.exit = vi.fn(() => {})

  await native()

  expect(process.exit).not.toHaveBeenCalled()
  expect(existsSync(join(process.cwd(), '.numic/android'))).toBe(true)
})

test(`Index annotations in patch aren't neccessary.`, async () => {
  prepare([packageJson('native-index-lines'), reactNativePkg])

  const withIndexLines = readFile(join(initialCwd, 'test/patch/build-gradle.patch'))
  writeFile(join(process.cwd(), 'patch/current.patch'), replaceIndexLinesFromPatch(withIndexLines))

  // Installation commands.
  await native()
  apply({ skipEmpty: true }) // => applies existing patch to native root folders.
  // Run/build commands.
  await plugin()
  patch()

  // Patch is applied to regular native folders
  const buildGradleContents = readFile('android/build.gradle')
  expect(buildGradleContents).not.toContain('mavenCentral()')
  expect(buildGradleContents).toContain('navenUI()')

  // Patch is not applied to repository copy.
  const repositoryBuildGradleContents = readFile('.numic/android/build.gradle')
  expect(repositoryBuildGradleContents).toContain('mavenCentral()')
  expect(repositoryBuildGradleContents).not.toContain('navenUI()')
})
