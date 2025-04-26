import { existsSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { commitChanges, resetRepository } from '../git'
import { basePath, getAppJsonName, getFolders, log, options } from '../helper'
import androidSdk from '../plugin/android-sdk/index'
import androidVersion from '../plugin/android-version'
import icon from '../plugin/icon/index'
import launchscreen from '../plugin/launchscreen'
import newArchitecture from '../plugin/new-architecture'
import various from '../plugin/various'
import xcode from '../plugin/xcode'
import type { PluginInput } from '../types'

const builtInPlugins = [androidVersion, various, newArchitecture, xcode, launchscreen, androidSdk, icon]

type PluginFunction = (options?: PluginInput) => void
type Plugin = string | PluginFunction

const runPluginsIn = async (plugins: Plugin[], location: string, silent = false) => {
  const promises = plugins.map(async (plugin) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let runner: PluginFunction = (..._args: any) => undefined

    if (typeof plugin === 'function') {
      runner = plugin
    } else {
      try {
        runner = await import(plugin)
        if ((runner as any).default) {
          runner = (runner as any).default
        }
      } catch (_error) {
        log(`Failed to load plugin ${plugin}`)
      }
    }

    return runner({
      projectPath: basePath(),
      nativePath: location,
      log: silent ? () => undefined : log,
      // @ts-ignore
      options: typeof plugin === 'function' ? options() : (options()[basename(plugin)] ?? {}),
      version: options().reactNativeVersion,
      name: getAppJsonName() ?? options().pkg.name,
    })
  })

  await Promise.all(promises)
}

export const plugin = async () => {
  const folders = getFolders()

  if (!(existsSync(folders.user.android) && existsSync(folders.user.ios))) {
    log('Missing native user folders, run "numic native" to initialize', 'error')
  }

  if (!(existsSync(folders.plugin.android) && existsSync(folders.plugin.ios))) {
    log('Missing native plugin folders, run "numic native" to initialize', 'error')
  }

  let packages: string[] = []
  const { dependencies, devDependencies } = options().pkg

  if (typeof dependencies === 'object') {
    packages = packages.concat(Object.keys(dependencies))
  }

  if (typeof devDependencies === 'object') {
    packages = packages.concat(Object.keys(devDependencies))
  }

  let installedPlugins: Plugin[] = packages.filter((pkg) => pkg.endsWith('-numic-plugin'))

  // Local plugins from /plugin user folder.
  if (existsSync(folders.plugins)) {
    const pluginFiles = readdirSync(folders.plugins, { withFileTypes: true })
      .filter((dirent) => !dirent.isDirectory())
      .filter((dirent) => dirent.name.endsWith('.js'))
      .map((dirent) => join(folders.plugins, dirent.name))

    installedPlugins = installedPlugins.concat(pluginFiles)
  }

  // Always run all built-in plugins.
  // @ts-ignore
  installedPlugins = installedPlugins.concat(builtInPlugins)

  if (installedPlugins.length > 0) {
    await runPluginsIn(installedPlugins, basePath())
    resetRepository()
    // Don't show output on second run (should be the same).
    await runPluginsIn(installedPlugins, join(basePath(), '.numic'), true)
    commitChanges()
    log(`Ran ${installedPlugins.length} plugins`)
  }
}
