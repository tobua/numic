import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import globalCacheDirectory from 'global-cache-dir'
import semverSort from 'semver-sort'
import { log } from './helper'
import type { NativeOptions } from './types'

export const cacheDirectory = await globalCacheDirectory('numic')

const removeExpiredTemplates = (version: string) => {
  let templateVersions = readdirSync(cacheDirectory)

  // Don't remove requested version.
  templateVersions = templateVersions.filter((template) => template !== version)
  // Filter dotfiles like .DS_Store
  templateVersions = templateVersions.filter((item) => !/(^|\/)\.[^/.]/g.test(item))
  templateVersions = semverSort.asc(templateVersions)
  // Keep only the newest two versions, plus the one being installed.
  templateVersions = templateVersions.slice(0, -2)

  // TODO Remove appNames if more than 10, by statSync => atimeMs (access time)

  for (const templateVersion of templateVersions) {
    rmSync(join(cacheDirectory, templateVersion), { recursive: true })
  }
}

export const cacheTemplate = (nativeOptions: NativeOptions) => {
  const directory = join(cacheDirectory, nativeOptions.version, nativeOptions.appName)

  removeExpiredTemplates(nativeOptions.version)

  if (existsSync(directory)) {
    return directory
  }

  // When using --directory option ini init, the directory itself cannot already exist.
  mkdirSync(join(directory, '..'), { recursive: true })

  // Empty package.json to bypass React Native CLI dependencies validation.
  // TODO necessary? writeFileSync(join(folders.numic, 'package.json'), '{ "name": "numic-native" }')

  // DOC https://github.com/react-native-community/cli/blob/master/packages/cli/src/commands/init/index.ts
  try {
    execSync(
      `bunx @react-native-community/cli init ${nativeOptions.appName} --skip-install --install-pods false --skip-git-init true --version ${
        nativeOptions.version
      } --directory "${join(directory, nativeOptions.appName)}" --pm bun`,
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        // Write output to console if in debug mode.
        stdio: nativeOptions.debug ? 'inherit' : 'pipe',
      },
    )
  } catch (error: any) {
    log(`Failed to install React Native template.\n\n${error.stdout}`, 'warning')
  }

  // Only keep native assets.
  renameSync(join(directory, nativeOptions.appName, 'android'), join(directory, 'android'))
  renameSync(join(directory, nativeOptions.appName, 'ios'), join(directory, 'ios'))

  // Remove temporary project directory.
  rmSync(join(directory, nativeOptions.appName), { recursive: true })

  return directory
}

export const clearTemplateCache = () => {
  const templates = readdirSync(cacheDirectory)
  for (const template of templates) {
    rmSync(join(cacheDirectory, template), { recursive: true })
  }
  return cacheDirectory
}
