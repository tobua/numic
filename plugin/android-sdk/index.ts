import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { latestNdkVersion, latestSdkManagerPath } from './helper'
import { matchVersion } from './match-version'
import { replaceVersions } from './replace-versions'
import type { Options } from './types'

interface PluginInput {
  projectPath?: string
  nativePath?: string
  log?: (message: string, type?: 'error' | 'warning') => void
  options?: { 'android-sdk': Options }
}

export default ({
  nativePath = process.cwd(),
  // eslint-disable-next-line no-console
  log = console.log,
  options = { 'android-sdk': {} },
}: PluginInput) => {
  const androidSdk = options['android-sdk'] ?? {}
  const androidFolder = join(nativePath, 'android')
  const androidHome = execSync('echo $ANDROID_HOME').toString()

  if (!androidHome) {
    log('Missing $ANDROID_HOME variable in PATH', 'warning')
    return
  }

  let output: string

  try {
    const sdkManagerPath = latestSdkManagerPath(androidHome)
    output = execSync(`$ANDROID_HOME/${sdkManagerPath} --list_installed`, {
      stdio: 'pipe', // Do not print errors.
    }).toString()
  } catch (_error) {
    log(
      'Failed to run sdkmanager, make sure to install and update the Android SDK Command-line Tools and make sure Android Studio is up-to-date',
      'warning',
    )
    return
  }

  const matchedInstalledVersions = matchVersion(output)

  // Unless user explicitly specifies versions, use installed version or current defaults.
  androidSdk.buildToolsVersion ||= matchedInstalledVersions.buildToolsVersion ?? '35.0.0'
  androidSdk.compileSdkVersion ||= matchedInstalledVersions.compileSdkVersion ?? 35
  androidSdk.targetSdkVersion ||= matchedInstalledVersions.targetSdkVersion ?? 35
  androidSdk.minSdkVersion ||= 24

  if (androidSdk.ndkVersion === true || androidSdk.ndkVersion === undefined) {
    androidSdk.ndkVersion = latestNdkVersion(androidHome)
  }
  if (androidSdk.ndkVersion === false) {
    androidSdk.ndkVersion = undefined
  }

  replaceVersions(androidSdk, androidFolder)
}
