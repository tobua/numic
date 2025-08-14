import { afterEach, beforeEach, expect, spyOn, test } from 'bun:test'
import { join } from 'node:path'
import process from 'node:process'
import { environment, file, packageJson, prepare, readFile, registerVitest } from 'jest-fixture'
import { replaceVersions } from '../replace-versions'

registerVitest(beforeEach, afterEach, { spyOn })

const initialBuildGradleContents = readFile('test/build.gradle')

environment('replace')

test('Extracts the correct versions for various script outputs.', () => {
  prepare([packageJson('sdk'), file('android/build.gradle', initialBuildGradleContents)])

  const androidPath = join(process.cwd(), 'android')

  const newBuildToolsVersion = '63.12.923'
  const newMinSdkVersion = 398
  const newCompileSdkVersion = '4'
  const newTargetSdkVersion = 12
  const newNdkVersion = '123.456.789'

  replaceVersions(
    {
      buildToolsVersion: newBuildToolsVersion,
      minSdkVersion: newMinSdkVersion,
      compileSdkVersion: newCompileSdkVersion,
      targetSdkVersion: newTargetSdkVersion,
      ndkVersion: newNdkVersion,
    },
    androidPath,
  )

  const modifiedBuildGradleContents = readFile('android/build.gradle')

  expect(modifiedBuildGradleContents).toContain(`buildToolsVersion = "${newBuildToolsVersion}"`)
  expect(modifiedBuildGradleContents).toContain(`minSdkVersion = ${newMinSdkVersion}`)
  expect(modifiedBuildGradleContents).toContain(`compileSdkVersion = ${newCompileSdkVersion}`)
  expect(modifiedBuildGradleContents).toContain(`targetSdkVersion = ${newTargetSdkVersion}`)
  expect(modifiedBuildGradleContents).toContain(`ndkVersion = "${newNdkVersion}"`)
})
