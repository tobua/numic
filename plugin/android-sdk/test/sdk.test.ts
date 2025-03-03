import { afterEach, beforeEach, expect, spyOn, test } from 'bun:test'
import { cpSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { environment, packageJson, prepare, readFile, registerVitest } from 'jest-fixture'
import plugin from '../index'

const initialCwd = process.cwd()
registerVitest(beforeEach, afterEach, { spyOn })

environment('sdk')

test('Creates logos in various sizes.', () => {
  prepare([packageJson('sdk')])

  const buildGradlePath = join(process.cwd(), 'android/build.gradle')

  mkdirSync(join(process.cwd(), 'android'))
  cpSync(join(initialCwd, 'test/build.gradle'), buildGradlePath)

  const initialBuildGradleContents = readFile(buildGradlePath)
  const currentNdkVersion = initialBuildGradleContents.match(/(ndkVersion\s*=\s*")(\d{1,3}\.\d{1,3}\.\d{1,10})(")/)[2]
  expect(initialBuildGradleContents).toContain(`ndkVersion = "${currentNdkVersion}"`)

  plugin({
    options: {
      'android-sdk': {
        buildToolsVersion: '123.456.789',
        compileSdkVersion: 456,
        ndkVersion: false, // Do not replace ndk.
      },
    },
  })

  const buildGradleContents = readFile(buildGradlePath)

  expect(buildGradleContents).toContain('buildToolsVersion = "123.456.789"')
  expect(buildGradleContents).toContain('compileSdkVersion = 456')
  expect(buildGradleContents).toContain(`ndkVersion = "${currentNdkVersion}"`) // Stays the same.
})

test('Uses newest available ndk version.', () => {
  prepare([packageJson('sdk')])

  const buildGradlePath = join(process.cwd(), 'android/build.gradle')

  mkdirSync(join(process.cwd(), 'android'))
  cpSync(join(initialCwd, 'test/build.gradle'), buildGradlePath)

  const initialBuildGradleContents = readFile(buildGradlePath)
  const currentNdkVersion = initialBuildGradleContents.match(/(ndkVersion\s*=\s*")(\d{1,3}\.\d{1,3}\.\d{1,10})(")/)[2]
  expect(initialBuildGradleContents).toContain(`ndkVersion = "${currentNdkVersion}"`)

  plugin({
    options: {
      'android-sdk': {
        buildToolsVersion: '123.456.789',
        compileSdkVersion: 456,
        // ndkVersion: true, same as default.
      },
    },
  })

  const buildGradleContents = readFile(buildGradlePath)

  expect(buildGradleContents).not.toContain(`ndkVersion = "${currentNdkVersion}"`)
  const updatedNdkVersion = buildGradleContents.match(/(ndkVersion\s*=\s*")(\d{1,3}\.\d{1,3}\.\d{1,10})(")/)[2]

  expect(Number.parseInt(updatedNdkVersion.split('.')[0])).toBeGreaterThan(27)
})
