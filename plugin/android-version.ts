import { readFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'

interface Options {
  androidVersion?: number | [number, string]
}

interface PluginInput {
  // Root project path.
  projectPath?: string
  // Location of /android or /ios folders, either root or inside /.numic.
  nativePath?: string
  log?: (message: string, type?: 'error' | 'warning') => void
  options: Options
  // Currently installed React Native version.
  version?: string
}

export default async ({
  nativePath = process.cwd(),
  log = console.log,
  options = {},
}: PluginInput) => {
  // Android version only customized when explicitly configured by user.
  if (!options.androidVersion) {
    return
  }

  let versionCode
  let versionName

  if (typeof options.androidVersion === 'number') {
    versionCode = options.androidVersion
    versionName = `1.${options.androidVersion}`
  } else if (
    Array.isArray(options.androidVersion) &&
    options.androidVersion.length === 2 &&
    typeof options.androidVersion[0] === 'number' &&
    typeof options.androidVersion[1] === 'string'
  ) {
    ;[versionCode, versionName] = options.androidVersion
  } else {
    log(
      'Invalid "androidVersion" value provided, must be a number or and array of [number, string]',
      'warning'
    )
    return
  }

  const buildGradleFilePath = join(nativePath, 'android/app/build.gradle')

  if (!existsSync(buildGradleFilePath)) {
    return
  }

  let buildGradleContents = readFileSync(buildGradleFilePath, 'utf-8')

  buildGradleContents = buildGradleContents.replace(
    /versionCode\s\d+/,
    `versionCode ${versionCode}`
  )
  buildGradleContents = buildGradleContents.replace(
    /versionName\s"[^"]*"/,
    `versionName "${versionName}"`
  )

  writeFileSync(buildGradleFilePath, buildGradleContents)
}
