import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { latestSdkManagerPath } from './helper'
import { matchVersion } from './match-version'
import { replaceVersions } from './replace-versions'
import type { Options } from './types'

interface PluginInput {
  projectPath?: string
  nativePath?: string
  log?: (message: string, type?: 'error' | 'warning') => void
  options?: Options
}

export default ({
  nativePath = process.cwd(),
  // eslint-disable-next-line no-console
  log = console.log,
  options = {},
}: PluginInput) => {
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
  options.buildToolsVersion ||= matchedInstalledVersions.buildToolsVersion ?? '35.0.0'
  options.compileSdkVersion ||= matchedInstalledVersions.compileSdkVersion ?? 35
  options.targetSdkVersion ||= matchedInstalledVersions.targetSdkVersion ?? 35
  options.minSdkVersion ||= 24

  replaceVersions(options, androidFolder)
}
