import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import glob from 'fast-glob'
import semver from 'semver'

const searchForFileAndReplace = (
  filePathGlob: string | string[],
  matcher: RegExp,
  replacement: string,
  nativePath: string
) => {
  const files = glob.sync(filePathGlob, {
    cwd: nativePath,
  })

  if (!files || !files.length) {
    return
  }

  files.forEach((file) => {
    const filePath = join(nativePath, file)
    let contents = readFileSync(filePath, 'utf-8')

    contents = contents.replaceAll(matcher, replacement)

    writeFileSync(filePath, contents)
  })
}

interface Options {
  bundleId?: string
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
  version,
}: PluginInput) => {
  const { bundleId } = options
  // Bundle ID only adapted if configured in options.
  if (typeof bundleId !== 'string') {
    return
  }

  const cleanVersion = semver.coerce(version).version
  if (!cleanVersion || !semver.valid(cleanVersion) || !semver.gte(cleanVersion, '0.71.0')) {
    log(
      `bundleId can only be customized with React Native >= 0.71 while the current version is "${cleanVersion}"`
    )
    return
  }

  const appBuildGradleFilePath = join(nativePath, 'android/app/build.gradle')
  let appBuildGradleContents = readFileSync(appBuildGradleFilePath, 'utf-8')

  appBuildGradleContents = appBuildGradleContents.replaceAll(
    /namespace\s"[\w.]+"/g,
    `namespace "${bundleId}"`
  )

  appBuildGradleContents = appBuildGradleContents.replaceAll(
    /applicationId\s"[\w.]+"/g,
    `applicationId "${bundleId}"`
  )

  writeFileSync(appBuildGradleFilePath, appBuildGradleContents)

  searchForFileAndReplace(
    [
      'android/app/src/*/java/com/*/ReactNativeFlipper.java',
      'android/app/src/main/java/com/*/MainActivity.java',
      'android/app/src/main/java/com/*/MainApplication.java',
    ],
    /package\s[\w.]+;/g,
    `package ${bundleId};`,
    nativePath
  )

  searchForFileAndReplace(
    'ios/*.xcodeproj/project.pbxproj',
    /PRODUCT_BUNDLE_IDENTIFIER = "org\.reactjs\.native\.example\.\$\(PRODUCT_NAME:rfc1034identifier\)";/g,
    `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`,
    nativePath
  )
}
