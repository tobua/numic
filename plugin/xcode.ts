import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import glob from 'fast-glob'
import type { PluginLog } from '../types'

function readDevelopmentTeam(log: PluginLog) {
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

function getDevelopmentTeam(options: Options, log: PluginLog) {
  let developmentTeam: false | string = false

  if (options.xcode === true) {
    developmentTeam = readDevelopmentTeam(log) ?? false
  }

  if (typeof options.xcode === 'object') {
    if (typeof options.xcode.developmentTeam === 'string') {
      developmentTeam = options.xcode.developmentTeam
    }
    if (options.xcode.developmentTeam === true) {
      developmentTeam = readDevelopmentTeam(log) ?? false
    }
  }

  return developmentTeam
}

function readAppJsonDisplayName(projectPath: string) {
  const appJsonPath = join(projectPath, 'app.json')
  try {
    const appJson = JSON.parse(readFileSync(appJsonPath, 'utf-8'))
    return appJson.displayName
  } catch (_error) {
    return
  }
}

interface Options {
  xcode?: boolean | { developmentTeam?: boolean | string; displayName?: string; category?: string }
}

interface PluginInput {
  // Root project path.
  projectPath?: string
  // Location of /android or /ios folders, either root or inside /.numic.
  nativePath?: string
  log?: PluginLog
  options: Options
  // Currently installed React Native version.
  version?: string
}

export default ({ projectPath = process.cwd(), nativePath = process.cwd(), log = console.log, options = {} }: PluginInput) => {
  const { xcode } = options
  // Needs to be set to true or explicitly configured.
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

  const removeLines = (content: string) => {
    xcodeProject = xcodeProject
      .split('\n')
      .filter((line) => !line.includes(content))
      .join('\n')
    writeFileSync(xcodeProjectFilePath, xcodeProject, 'utf-8')
  }

  // Remove content from previous plugin runs.
  removeLines('DEVELOPMENT_TEAM =')
  removeLines('INFOPLIST_KEY_CFBundleDisplayName =')
  removeLines('INFOPLIST_KEY_LSApplicationCategoryType =')

  const developmentTeam = getDevelopmentTeam(options, log)

  if (developmentTeam) {
    addLine(`DEVELOPMENT_TEAM = ${developmentTeam};`, 'CURRENT_PROJECT_VERSION')
  } else {
    log('No development team configured or found', 'warning')
  }

  if (typeof xcode === 'object' || xcode === true) {
    const displayName = (typeof xcode === 'object' && xcode.displayName) || readAppJsonDisplayName(projectPath)
    if (displayName) {
      addLine(`INFOPLIST_KEY_CFBundleDisplayName = ${displayName};`, 'INFOPLIST_FILE')
    }
  }

  if (typeof xcode === 'object' || xcode === true) {
    const category = (typeof xcode === 'object' && xcode.category) || 'public.app-category.productivity'
    if (category) {
      addLine(`INFOPLIST_KEY_LSApplicationCategoryType = ${category};`, 'INFOPLIST_FILE')
    }
  }
}
