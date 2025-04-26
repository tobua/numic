import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import glob from 'fast-glob'
import semver from 'semver'

const searchForFileAndReplace = (filePathGlob: string | string[], matcher: RegExp, replacement: string, nativePath: string) => {
  const files = glob.sync(filePathGlob, {
    cwd: nativePath,
  })

  if (files?.length === 0) {
    return
  }

  for (const file of files) {
    const filePath = join(nativePath, file)
    let contents = readFileSync(filePath, 'utf-8')

    contents = contents.replaceAll(matcher, replacement)

    writeFileSync(filePath, contents)
  }
}

function escapeSelectedChars(text: string) {
  return text.replace(/['"\\]/g, '\\$&')
}

interface Options {
  bundleId?: string
  displayName?: string
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

export default ({ nativePath = process.cwd(), log = console.log, options = {}, version }: PluginInput) => {
  const { bundleId, displayName } = options

  // Bundle ID only adapted if configured in options.
  if (typeof bundleId === 'string') {
    const cleanVersion = semver.coerce(version)?.version
    if (!(cleanVersion && semver.valid(cleanVersion) && semver.gte(cleanVersion, '0.71.0'))) {
      log(`bundleId can only be customized with React Native >= 0.71 while the current version is "${cleanVersion}"`)
      return
    }

    const appBuildGradleFilePath = join(nativePath, 'android/app/build.gradle')
    let appBuildGradleContents = readFileSync(appBuildGradleFilePath, 'utf-8')

    appBuildGradleContents = appBuildGradleContents.replaceAll(/namespace\s"[\w.]+"/g, `namespace "${bundleId}"`)

    appBuildGradleContents = appBuildGradleContents.replaceAll(/applicationId\s"[\w.]+"/g, `applicationId "${bundleId}"`)

    writeFileSync(appBuildGradleFilePath, appBuildGradleContents)

    searchForFileAndReplace(
      ['android/app/src/main/java/com/*/MainActivity.kt', 'android/app/src/main/java/com/*/MainApplication.kt'],
      /package\s[\w.]+/g,
      `package ${bundleId}`,
      nativePath,
    )

    searchForFileAndReplace(
      'ios/*.xcodeproj/project.pbxproj',
      /PRODUCT_BUNDLE_IDENTIFIER = "org\.reactjs\.native\.example\.\$\(PRODUCT_NAME:rfc1034identifier\)";/g,
      `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`,
      nativePath,
    )
  }

  if (typeof displayName === 'string') {
    const stringsXmlPath = join(nativePath, 'android/app/src/main/res/values/strings.xml')
    let stringsXmlContents = readFileSync(stringsXmlPath, 'utf-8')

    stringsXmlContents = stringsXmlContents.replaceAll(
      /<string name="app_name">[^<]+<\/string>/g,
      `<string name="app_name">${escapeSelectedChars(displayName)}</string>`,
    )

    writeFileSync(stringsXmlPath, stringsXmlContents)

    searchForFileAndReplace(
      'ios/*/Info.plist',
      /<key>CFBundleDisplayName<\/key>\s*<string>[\w\s\-']+<\/string>/g,
      `<key>CFBundleDisplayName</key>\n\t<string>${escapeSelectedChars(displayName)}</string>`,
      nativePath,
    )
  }
}
