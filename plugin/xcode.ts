import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import glob from 'fast-glob'

function readDevelopmentTeam(log: (message: string, type?: 'error' | 'warning') => void) {
  try {
    const output = execSync('security find-identity -p codesigning')
    const developmentTeamId = output.toString().match(/Apple Distribution:.*\(([^)]+)\)/)
    if (developmentTeamId?.[1]) {
      return developmentTeamId[1]
    }
  } catch (_error) {
    // Ignored
  }

  log('No valid Apple Distribution team ID found, please configure manually', 'warning')
}

interface Options {
  xcode?: true | { developmentTeam?: string; displayName?: string; category?: string }
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

export default ({ nativePath = process.cwd(), log = console.log, options = {} }: PluginInput) => {
  const { xcode } = options
  // Bundle ID only adapted if configured in options.
  if (typeof xcode === 'undefined') {
    return
  }

  const xcodeProjectFilePath = glob.sync(join(nativePath, 'ios/*.xcodeproj/project.pbxproj'), {
    cwd: nativePath,
  })[0]

  if (!xcodeProjectFilePath) {
    return log('XCode project file not found', 'warning')
  }
  let xcodeProject = readFileSync(xcodeProjectFilePath, 'utf-8')
  const developmentTeam = typeof options.xcode === 'object' ? options.xcode.developmentTeam : readDevelopmentTeam(log)

  const addLine = (newLine: string, previousLine: string) => {
    const currentProjectVersionIndices = xcodeProject.split('\n').reduce((indices, line, index) => {
      if (line.includes(previousLine)) {
        indices.push(index)
      }
      return indices
    }, [] as number[])

    if (currentProjectVersionIndices.length > 0) {
      let writes = 0
      for (const index of currentProjectVersionIndices) {
        const lines = xcodeProject.split('\n')
        lines.splice(index + 1 + writes, 0, `				${newLine}`)
        xcodeProject = lines.join('\n')
        writes += 1
      }
      writeFileSync(xcodeProjectFilePath, xcodeProject, 'utf-8')
    } else {
      log(`Couldn't add development team to XCode file`)
    }
  }

  if (developmentTeam) {
    addLine(`DEVELOPMENT_TEAM = ${developmentTeam};`, 'CURRENT_PROJECT_VERSION')
  } else {
    log('No development team configured or found', 'warning')
  }

  if (typeof xcode === 'object' && xcode.displayName) {
    addLine(`INFOPLIST_KEY_CFBundleDisplayName = ${xcode.displayName};`, 'INFOPLIST_FILE')
  }

  if (typeof xcode === 'object' && xcode.category) {
    addLine(`INFOPLIST_KEY_LSApplicationCategoryType = ${xcode.category};`, 'INFOPLIST_FILE')
  }
}
