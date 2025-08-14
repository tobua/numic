import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface Options {
  oldArchitecture?: boolean
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
  const { oldArchitecture } = options
  const gradlePropertiesFilePath = join(nativePath, 'android/gradle.properties')
  let gradlePropertiesContents = readFileSync(gradlePropertiesFilePath, 'utf-8')

  // Android requires gradle flag to be set, while iOS requires flag to be set during "pod install".
  if (oldArchitecture) {
    log('Using old architecture')
    gradlePropertiesContents = gradlePropertiesContents.replaceAll('newArchEnabled=true', 'newArchEnabled=false')
  } else {
    log('Using new architecture')
    gradlePropertiesContents = gradlePropertiesContents.replaceAll('newArchEnabled=false', 'newArchEnabled=true')
  }
  writeFileSync(gradlePropertiesFilePath, gradlePropertiesContents)
}
