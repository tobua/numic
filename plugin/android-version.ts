import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { EOL } from 'node:os'
import { join } from 'node:path'

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

// biome-ignore lint/suspicious/noConsole: For plugin to print logs.
export default ({ nativePath = process.cwd(), log = console.log, options = {} }: PluginInput) => {
  // Android version only customized when explicitly configured by user.
  if (!options.androidVersion) {
    return
  }

  let versionCode: number
  let versionName: string

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
    log('Invalid "androidVersion" value provided, must be a number or and array of [number, string]', 'warning')
    return
  }

  const appBuildGradleFilePath = join(nativePath, 'android/app/build.gradle')
  const buildGradleFilePath = join(nativePath, 'android/build.gradle')

  if (!(existsSync(appBuildGradleFilePath) && existsSync(buildGradleFilePath))) {
    log('build.gradle or app/build.gradle file missing', 'warning')
    return
  }

  let buildGradleContents = readFileSync(buildGradleFilePath, 'utf-8')
  const buildGradleLines = buildGradleContents.split(EOL)

  const hasVersionCodeVariable = buildGradleContents.includes('versionCode =')
  const hasVersionNameVariable = buildGradleContents.includes('versionName =')

  // Insert variables into build.gradle
  if (!(hasVersionCodeVariable && hasVersionNameVariable)) {
    let extensionStartLine = buildGradleLines.findIndex((content) => content.includes('ext {'))

    if (extensionStartLine !== -1) {
      if (!hasVersionCodeVariable) {
        buildGradleLines.splice(extensionStartLine + 1, 0, `        versionCode = ${versionCode}`)
        extensionStartLine += 1
      }
      if (!hasVersionCodeVariable) {
        buildGradleLines.splice(extensionStartLine + 1, 0, `        versionName = "${versionName}"`)
      }

      writeFileSync(buildGradleFilePath, buildGradleLines.join(EOL))
    } else {
      log('Unable to parse build.gradle file', 'warning')
    }
  }

  buildGradleContents = readFileSync(buildGradleFilePath, 'utf-8')

  // Update variables in build.gradle.
  buildGradleContents = buildGradleContents.replace(/versionCode\s=\s\d+/, `versionCode = ${versionCode}`)

  buildGradleContents = buildGradleContents.replace(/versionName\s=\s"[^"]*"/, `versionName = "${versionName}"`)

  writeFileSync(buildGradleFilePath, buildGradleContents)

  // Ensure variables are used in app/build.gradle
  let appBuildGradleContents = readFileSync(appBuildGradleFilePath, 'utf-8')

  if (!appBuildGradleContents.includes('rootProject.ext.versionCode')) {
    appBuildGradleContents = appBuildGradleContents.replace(/versionCode\s\d+/, 'versionCode rootProject.ext.versionCode')
  }

  if (!appBuildGradleContents.includes('rootProject.ext.versionName')) {
    appBuildGradleContents = appBuildGradleContents.replace(/versionName\s"[^"]*"/, 'versionName rootProject.ext.versionName')
  }

  writeFileSync(appBuildGradleFilePath, appBuildGradleContents)
}
