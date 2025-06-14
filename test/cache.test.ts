import { afterEach, beforeEach, expect, spyOn, test } from 'bun:test'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { environment, file, packageJson, prepare, readFile, registerVitest } from 'jest-fixture'
import { defaultNativeOptions, resetOptions } from '../helper'
import { cacheDirectory, cacheTemplate, clearTemplateCache } from '../template-cache'

registerVitest(beforeEach, afterEach, { spyOn })
beforeEach(resetOptions)
environment('native')

const rnVersion = readFile('package.json').devDependencies['react-native'].replace('^', '')
const olderRnVersion = '0.69.0'
const reactNativePkg = file('node_modules/react-native/package.json', `{ "version": "${olderRnVersion}" }`)

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

  const templatePath = cacheTemplate(options)

  expect(existsSync(templatePath)).toBe(true)
  expect(templatePath).toContain(`${rnVersion}/${appName}`)
  expect(existsSync(join(templatePath, 'android'))).toBe(true)
  expect(existsSync(join(templatePath, 'ios'))).toBe(true)
  expect(existsSync(join(templatePath, `ios/${appName}.xcodeproj`))).toBe(true)

  expect(readdirSync(cacheDirectory).length).toBe(1)
}, 10000)

test('Downloads and caches another template.', () => {
  const appName = 'ThisReact'
  prepare([packageJson('native'), reactNativePkg, file('app.json', `{ "name": "${appName}" }`)])

  const options = defaultNativeOptions({
    // Version read from package.
    // appName read from app.json.
    debug: true,
    version: '',
    appName: '',
  })

  expect(options.version).toBe(olderRnVersion)
  expect(options.appName).toBe(appName)
  expect(options.debug).toBe(true)

  const templatePath = cacheTemplate(options)

  expect(existsSync(templatePath)).toBe(true)
  expect(templatePath).toContain(`${olderRnVersion}/${appName}`)
  expect(existsSync(join(templatePath, 'android'))).toBe(true)
  expect(existsSync(join(templatePath, `ios/${appName}.xcodeproj`))).toBe(true)

  expect(readdirSync(cacheDirectory).length).toBe(2)
}, 10000)

const sortVersions = (versions: string[]): string[] => {
  return versions.sort(sortVersionsPrereleaseFirst)
}

const sortVersionsPrereleaseFirst = (a, b) => {
  const baseA = a.split('-')[0];
  const baseB = b.split('-')[0];
  if (baseA === baseB) {
    const aIsPre = a.includes('-');
    const bIsPre = b.includes('-');
    if (aIsPre && !bIsPre) return -1;
    if (!aIsPre && bIsPre) return 1;
    return a.localeCompare(b);
  }
  return baseA.localeCompare(baseB, undefined, { numeric: true });
}

test('Removes expired templates added manually and adds new appName template.', () => {
  mkdirSync(join(cacheDirectory, '0.1.2', 'oldest-app', 'android'), {
    recursive: true,
  })
  mkdirSync(join(cacheDirectory, '0.7.3', 'hello-app', 'android'), {
    recursive: true,
  })
  mkdirSync(join(cacheDirectory, '0.68.5', 'another-app', 'ios'), {
    recursive: true,
  })

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

  const templatePath = cacheTemplate(options)

  expect(existsSync(templatePath)).toBe(true)
  expect(templatePath).toContain(`${rnVersion}/${appName}`)
  expect(existsSync(join(cacheDirectory, rnVersion, appName, 'android'))).toBe(true)
  expect(existsSync(join(templatePath, 'android'))).toBe(true)
  expect(existsSync(join(templatePath, `ios/${appName}.xcodeproj`))).toBe(true)

  expect(sortVersions(readdirSync(cacheDirectory))).toEqual(['0.68.5', '0.69.0', rnVersion])
})

test('Version sorting also works with prereleases.', () => {
  const prereleaseVersion = `${rnVersion}-rc.6`
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
  expect(sortVersions(readdirSync(cacheDirectory))).toEqual([olderRnVersion, prereleaseVersion, rnVersion])
})
