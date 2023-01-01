import { existsSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import { commitChanges, resetRepository } from '../git'
import { log, getFolders, basePath, options } from '../helper'
import type { PluginInput } from '../types'

type PluginFunction = (options?: PluginInput) => void
type Plugin = string

const runPluginsIn = async (plugins: Plugin[], location: string, silent = false) => {
  const promises = plugins.map(async (plugin) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let runner: PluginFunction = (..._args: any) => {}

    try {
      runner = await import(plugin)
      if ((runner as any).default) {
        runner = (runner as any).default
      }
    } catch (error) {
      log(`Failed to load plugin ${plugin}`)
    }

    return runner({
      projectPath: basePath(),
      nativePath: location,
      log: silent ? () => {} : log,
      options: options()[basename(plugin)] ?? {},
      version: options().reactNativeVersion,
    })
  })

  await Promise.all(promises)
}

export const plugin = async () => {
  const folders = getFolders()

  if (!existsSync(folders.user.android) || !existsSync(folders.user.ios)) {
    log('Missing native user folders, run "numic native" to initialize', 'error')
  }

  if (!existsSync(folders.plugin.android) || !existsSync(folders.plugin.ios)) {
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

  let installedPlugins = packages.filter((pkg) => pkg.endsWith('-numic-plugin'))

  // Local plugins from /plugin user folder.
  if (existsSync(folders.plugins)) {
    const pluginFiles = readdirSync(folders.plugins, { withFileTypes: true })
      .filter((dirent) => !dirent.isDirectory())
      .filter((dirent) => dirent.name.endsWith('.js'))
      .map((dirent) => join(folders.plugins, dirent.name))

    installedPlugins = installedPlugins.concat(pluginFiles)
  }

  if (installedPlugins.length > 0) {
    await runPluginsIn(installedPlugins, basePath())
    resetRepository()
    // Don't show output on second run (should be the same).
    await runPluginsIn(installedPlugins, join(basePath(), '.numic'), true)
    commitChanges()
    log(`Ran ${installedPlugins.length} plugins`)
  }
}
