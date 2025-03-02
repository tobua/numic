import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Options } from './types'

export const replaceVersions = (
  { compileSdkVersion, targetSdkVersion, minSdkVersion, buildToolsVersion, ndkVersion }: Options,
  androidFolder: string,
) => {
  const buildGradlePath = join(androidFolder, 'build.gradle')
  let buildGradleContents = readFileSync(buildGradlePath, 'utf-8')

  if (buildToolsVersion) {
    buildGradleContents = buildGradleContents.replace(
      /(buildToolsVersion\s*=\s*")(\d{1,3}\.\d{1,3}\.\d{1,10})(")/,
      `$1${buildToolsVersion}$3`,
    )
  }

  if (minSdkVersion) {
    buildGradleContents = buildGradleContents.replace(/(minSdkVersion\s*=\s*)(\d{1,3})/, `$1${minSdkVersion}`)
  }

  if (compileSdkVersion) {
    buildGradleContents = buildGradleContents.replace(/(compileSdkVersion\s*=\s*)(\d{1,3})/, `$1${compileSdkVersion}`)
  }

  if (targetSdkVersion) {
    buildGradleContents = buildGradleContents.replace(/(targetSdkVersion\s*=\s*)(\d{1,3})/, `$1${targetSdkVersion}`)
  }

  if (ndkVersion) {
    buildGradleContents = buildGradleContents.replace(/(ndkVersion\s*=\s*")(\d{1,3}\.\d{1,3}\.\d{1,10})(")/, `$1${ndkVersion}$3`)
  }

  writeFileSync(buildGradlePath, buildGradleContents)
}
