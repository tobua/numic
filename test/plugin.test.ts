import { cpSync, existsSync } from 'fs'
import { join } from 'path'
import { expect, test, beforeEach, afterEach, vi } from 'vitest'
import {
  registerVitest,
  prepare,
  environment,
  packageJson,
  readFile,
  file,
  writeFile,
} from 'jest-fixture'
import { native } from '../script/native'
import { plugin } from '../script/plugin'
import { patch } from '../script/patch'
import { resetOptions } from '../helper'

const initialCwd = process.cwd()

registerVitest(beforeEach, afterEach, vi)
beforeEach(resetOptions)
environment('plugin')

const reactNativePkg = file(
  'node_modules/react-native/package.json',
  `{ "version": "${readFile('package.json').devDependencies['react-native'].replace('^', '')}" }`,
)

test('Simple plugin modifies native files.', async () => {
  prepare([
    packageJson('plugin', { dependencies: { 'simple-numic-plugin': 'latest' } }),
    reactNativePkg,
  ])

  // Dynamic import happens in root modules.
  cpSync(
    join(initialCwd, 'test/simple-numic-plugin'),
    join(initialCwd, 'node_modules/simple-numic-plugin'),
    {
      recursive: true,
    },
  )

  await native()

  const buildGradleContents = readFile('android/build.gradle')

  expect(buildGradleContents).toContain('com.numic:plugin')
  // Plugin changes don't cause patch creation.
  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(false)
})

test('Asynchronous plugin modifies native files.', async () => {
  prepare([
    packageJson('async-plugin', { dependencies: { 'asynchronous-numic-plugin': 'latest' } }),
    reactNativePkg,
  ])

  // Dynamic import happens in root modules.
  cpSync(
    join(initialCwd, 'test/asynchronous-numic-plugin'),
    join(initialCwd, 'node_modules/asynchronous-numic-plugin'),
    {
      recursive: true,
    },
  )

  await native()

  const podfileContents = readFile('ios/Podfile')

  expect(podfileContents).toContain('numic_hash')
})

test('Local plugin modifies native files.', async () => {
  prepare([
    packageJson('local-plugin'),
    file('plugin/plugin.js', readFile(join(initialCwd, 'test/simple-numic-plugin/index.js'))),
    reactNativePkg,
  ])

  await native()

  const buildGradleContents = readFile('android/build.gradle')

  expect(buildGradleContents).toContain('com.numic:plugin')
})

test('Local plugin can be configured.', async () => {
  prepare([
    packageJson('modified-plugin', { numic: { 'plugin.js': { name: 'modified' } } }),
    file('plugin/plugin.js', readFile(join(initialCwd, 'test/simple-numic-plugin/index.js'))),
    reactNativePkg,
  ])

  await native()

  const buildGradleContents = readFile('android/build.gradle')

  expect(buildGradleContents).toContain('com.modified:plugin')
})

test('Npm plugin can be configured.', async () => {
  prepare([
    packageJson('plugin', {
      dependencies: { 'simple-numic-plugin': 'latest' },
      numic: { 'simple-numic-plugin': { name: 'modified' } },
    }),
    reactNativePkg,
  ])

  // Dynamic import happens in root modules.
  cpSync(
    join(initialCwd, 'test/simple-numic-plugin'),
    join(initialCwd, 'node_modules/simple-numic-plugin'),
    {
      recursive: true,
    },
  )

  await native()

  const buildGradleContents = readFile('android/build.gradle')

  expect(buildGradleContents).toContain('com.modified:plugin')
})

test("Plugin changes are staged and don't cause patch even after initial repository is set up.", async () => {
  prepare([packageJson('plugin'), reactNativePkg])

  await native()

  // No plugin & patch initially.
  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(false)
  let buildGradleContents = readFile('android/build.gradle')
  expect(buildGradleContents).not.toContain('com.numic:plugin')

  resetOptions()

  const pkg = readFile('package.json')
  pkg.dependencies = { 'simple-numic-plugin': '*' }
  writeFile('package.json', JSON.stringify(pkg))

  // Dynamic import happens in root modules.
  cpSync(
    join(initialCwd, 'test/simple-numic-plugin'),
    join(initialCwd, 'node_modules/simple-numic-plugin'),
    {
      recursive: true,
    },
  )

  // Same commands as iOS and Android commands would run.
  await plugin()
  patch()

  // Plugin changes, but still no patch created.
  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(false)
  buildGradleContents = readFile('android/build.gradle')
  expect(buildGradleContents).toContain('com.numic:plugin')

  // Can apply already applied plugins again.
  await plugin()
  patch()

  expect(existsSync(join(process.cwd(), 'patch/current.patch'))).toBe(false)
  buildGradleContents = readFile('android/build.gradle')
  expect(buildGradleContents).toContain('com.numic:plugin')
})

test('Built-in plugins always run when proper options are set.', async () => {
  prepare([packageJson('plugin-built-in', { numic: { androidVersion: 9 } }), reactNativePkg])

  await native()

  const buildGradleContents = readFile('android/build.gradle')
  const appBuildGradleContents = readFile('android/app/build.gradle')

  expect(buildGradleContents).toContain('versionCode = 9')
  expect(buildGradleContents).toContain('versionName = "1.9"')
  expect(buildGradleContents).not.toContain('versionCode rootProject.ext.versionCode')
  expect(buildGradleContents).not.toContain('versionName rootProject.ext.versionName')

  expect(appBuildGradleContents).toContain('versionCode rootProject.ext.versionCode')
  expect(appBuildGradleContents).toContain('versionName rootProject.ext.versionName')
  expect(appBuildGradleContents).not.toContain('versionCode = 9')
  expect(appBuildGradleContents).not.toContain('versionName = "1.9"')

  const setAndroidVersionAndRunPlugin = async (androidVersion: any) => {
    const pkg = readFile('package.json')

    pkg.numic.androidVersion = androidVersion

    writeFile('package.json', pkg, { json: true })

    resetOptions()
    await plugin()

    return {
      variables: readFile('android/build.gradle'),
      app: readFile('android/app/build.gradle'),
    }
  }

  let contents = await setAndroidVersionAndRunPlugin([3333, '123.456.789'])

  expect(contents.variables).toContain('versionCode = 3333')
  expect(contents.variables).toContain('versionName = "123.456.789"')
  expect(contents.variables).not.toContain('versionCode rootProject.ext.versionCode')
  expect(contents.variables).not.toContain('versionName rootProject.ext.versionName')

  expect(contents.app).toContain('versionCode rootProject.ext.versionCode')
  expect(contents.app).toContain('versionName rootProject.ext.versionName')
  expect(contents.app).not.toContain('versionCode = 3333')
  expect(contents.app).not.toContain('versionName = "123.456.789"')

  contents = await setAndroidVersionAndRunPlugin(123456)

  expect(contents.variables).toContain('versionCode = 123456')
  expect(contents.variables).toContain('versionName = "1.123456"')

  contents = await setAndroidVersionAndRunPlugin([2, 'flappy-bird'])

  expect(contents.variables).toContain('versionCode = 2')
  expect(contents.variables).toContain('versionName = "flappy-bird"')

  contents = await setAndroidVersionAndRunPlugin(1)

  expect(contents.variables).toContain('versionCode = 1')
  expect(contents.variables).toContain('versionName = "1.1"')

  // Remains unchanged for invalid values.
  contents = await setAndroidVersionAndRunPlugin('test')

  expect(contents.variables).toContain('versionCode = 1')
  expect(contents.variables).toContain('versionName = "1.1"')
})

test('Bundle ID will be adapted when configured.', async () => {
  prepare([
    packageJson('plugin-bundle-id', { numic: { bundleId: 'com.tobua.numic' } }),
    reactNativePkg,
  ])

  await native()

  const appBuildGradleContents = readFile('android/app/build.gradle')

  expect(appBuildGradleContents).toContain('com.tobua.numic')
  expect(appBuildGradleContents).toContain('namespace "com.tobua.numic"')
  expect(appBuildGradleContents).toContain('applicationId "com.tobua.numic"')

  const mainActivityContents = readFile('android/app/src/main/java/com/numicapp/MainActivity.kt')

  expect(mainActivityContents).toContain('package com.tobua.numic')

  const mainApplicationContents = readFile(
    'android/app/src/main/java/com/numicapp/MainApplication.kt',
  )

  expect(mainApplicationContents).toContain('package com.tobua.numic')

  const iosProject = readFile('ios/NumicApp.xcodeproj/project.pbxproj')

  expect(iosProject).toContain('PRODUCT_BUNDLE_IDENTIFIER = com.tobua.numic;')
  expect(iosProject).not.toContain('org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)')

  const gradlePropertiesContents = readFile('android/gradle.properties')
  // New architecture enabled by default.
  expect(gradlePropertiesContents).toContain('newArchEnabled=true')
})

test('New architecture can optionally be disabled.', async () => {
  prepare([
    packageJson('plugin-new-architecture', { numic: { oldArchitecture: true } }),
    reactNativePkg,
  ])

  await native()

  const gradlePropertiesContents = readFile('android/gradle.properties')
  expect(gradlePropertiesContents).toContain('newArchEnabled=false')
})
