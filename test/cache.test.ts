import { existsSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'
import { expect, test, beforeEach, afterEach, vi } from 'vitest'
import { registerVitest, prepare, environment, packageJson, file } from 'jest-fixture'
import { cacheTemplate, cacheDirectory, clearTemplateCache } from '../template-cache'
import { resetOptions, defaultNativeOptions } from '../helper'

registerVitest(beforeEach, afterEach, vi)
beforeEach(resetOptions)
environment('native')

const rnVersion = '0.71.0'
const olderRNVersion = '0.69.0'
const reactNativePkg = file(
  'node_modules/react-native/package.json',
  `{ "version": "${olderRNVersion}" }`
)

test('Cache directory is emptied.', () => {
  clearTemplateCache()
  expect(readdirSync(cacheDirectory).length).toBe(0)
})

test('Downloads and caches new template.', () => {
  const appName = 'MyApp'
  prepare([packageJson('native'), reactNativePkg])

  const options = defaultNativeOptions({
    version: rnVersion,
    appName,
  })

  expect(options.version).toBe(rnVersion)
  expect(options.appName).toBe(appName)
  expect(options.debug).toBe(false)
  expect(options.skipInstall).toBe(true)

  const templatePath = cacheTemplate(options)

  expect(existsSync(templatePath)).toBe(true)
  expect(templatePath).toContain(`${rnVersion}/${appName}`)
  expect(existsSync(join(templatePath, 'android'))).toBe(true)
  expect(existsSync(join(templatePath, 'ios'))).toBe(true)
  expect(existsSync(join(templatePath, `ios/${appName}.xcodeproj`))).toBe(true)

  expect(readdirSync(cacheDirectory).length).toBe(1)
})

test('Downloads and caches another template.', () => {
  const appName = 'ThisReact'
  prepare([packageJson('native'), reactNativePkg, file('app.json', `{ "name": "${appName}" }`)])

  const options = defaultNativeOptions({
    // Version read from package.
    // appName read from app.json.
    debug: true,
    skipInstall: true,
  })

  expect(options.version).toBe(olderRNVersion)
  expect(options.appName).toBe(appName)
  expect(options.debug).toBe(true)
  expect(options.skipInstall).toBe(true)

  const templatePath = cacheTemplate(options)

  expect(existsSync(templatePath)).toBe(true)
  expect(templatePath).toContain(`${olderRNVersion}/${appName}`)
  expect(existsSync(join(templatePath, 'android'))).toBe(true)
  expect(existsSync(join(templatePath, `ios/${appName}.xcodeproj`))).toBe(true)

  expect(readdirSync(cacheDirectory).length).toBe(2)
})

test('Removes expired templates added manually and adds new appName template.', () => {
  mkdirSync(join(cacheDirectory, '0.1.2', 'oldest-app', 'android'), { recursive: true })
  mkdirSync(join(cacheDirectory, '0.7.3', 'hello-app', 'android'), { recursive: true })
  mkdirSync(join(cacheDirectory, '0.68.5', 'another-app', 'ios'), { recursive: true })

  const appName = 'NewApp'
  prepare([packageJson('native'), reactNativePkg])

  const options = defaultNativeOptions({
    version: rnVersion, // Existing version.
    appName,
    debug: false,
  })

  expect(options.version).toBe(rnVersion)
  expect(options.appName).toBe(appName)
  expect(options.debug).toBe(false)
  expect(options.skipInstall).toBe(true)

  const templatePath = cacheTemplate(options)

  expect(existsSync(templatePath)).toBe(true)
  expect(templatePath).toContain(`${rnVersion}/${appName}`)
  expect(existsSync(join(cacheDirectory, rnVersion, appName, 'android'))).toBe(true)
  expect(existsSync(join(templatePath, 'android'))).toBe(true)
  expect(existsSync(join(templatePath, `ios/${appName}.xcodeproj`))).toBe(true)

  expect(readdirSync(cacheDirectory)).toEqual(['0.68.5', '0.69.0', rnVersion])
})

test('Version sorting also works with prereleases.', () => {
  const prereleaseVersion = '0.71.0-rc.6'
  mkdirSync(join(cacheDirectory, prereleaseVersion, 'prerelease-app', 'android'), {
    recursive: true,
  })

  const appName = 'NewApp'
  prepare([packageJson('native'), reactNativePkg])

  const options = defaultNativeOptions({
    version: rnVersion, // Existing version.
    appName,
    debug: false,
  })

  const templatePath = cacheTemplate(options)

  expect(existsSync(templatePath)).toBe(true)
  expect(readdirSync(cacheDirectory)).toEqual(['0.69.0', rnVersion, prereleaseVersion])
})
