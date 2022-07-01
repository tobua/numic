import { cpSync } from 'fs'
import { join } from 'path'
import { expect, test, beforeEach, afterEach, vi } from 'vitest'
import { prepare, environment, packageJson, readFile, file } from 'jest-fixture'
import { native } from '../script/native'
import { resetOptions } from '../options'

const initialCwd = process.cwd()

// @ts-ignore
global.jest = { spyOn: vi.spyOn }
// @ts-ignore
global.beforeEach = beforeEach
// @ts-ignore
global.afterEach = afterEach

beforeEach(resetOptions)

environment('plugin')

const reactNativePkg = file('node_modules/react-native/package.json', '{ "version": "0.69.0" }')

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
    }
  )

  await native({ skipInstall: true })

  const buildGradleContents = readFile('android/build.gradle')

  expect(buildGradleContents).toContain('com.numic:plugin')
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
    }
  )

  await native({ skipInstall: true })

  const podfileContents = readFile('ios/Podfile')

  expect(podfileContents).toContain('numic_hash')
})

test('Local plugin modifies native files.', async () => {
  prepare([
    packageJson('local-plugin'),
    file('plugin/plugin.js', readFile(join(initialCwd, 'test/simple-numic-plugin/index.js'))),
    reactNativePkg,
  ])

  await native({ skipInstall: true })

  const buildGradleContents = readFile('android/build.gradle')

  expect(buildGradleContents).toContain('com.numic:plugin')
})

test('Local plugin can be configured.', async () => {
  prepare([
    packageJson('modified-plugin', { numic: { 'plugin.js': { name: 'modified' } } }),
    file('plugin/plugin.js', readFile(join(initialCwd, 'test/simple-numic-plugin/index.js'))),
    reactNativePkg,
  ])

  await native({ skipInstall: true })

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
    }
  )

  await native({ skipInstall: true })

  const buildGradleContents = readFile('android/build.gradle')

  expect(buildGradleContents).toContain('com.modified:plugin')
})
