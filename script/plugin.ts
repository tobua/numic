import { existsSync } from 'fs'
import { log, getFolders, basePath } from '../helper'
import { options } from '../options'

export interface PluginInput {
  cwd?: string
  log?: (message: string, type?: 'error' | 'warning') => void
}

type PluginFunction = (options?: PluginInput) => void
type Plugin = string | PluginFunction

const runPluginsIn = async (plugins: Plugin[], location: string) => {
  const promises = plugins.map(async (plugin) => {
    let runner = plugin

    if (typeof plugin === 'string') {
      try {
        runner = await import(plugin)
        if ((runner as any).default) {
          runner = (runner as any).default
        }
      } catch (error) {
        log(`Failed to load plugin ${plugin}`)
      }
    }

    return (runner as PluginFunction)({
      cwd: location,
      log,
    })
  })

  await Promise.all(promises)
}

export const plugin = async () => {
  const folders = getFolders()

  if (!existsSync(folders.user.android) || !existsSync(folders.user.ios)) {
    log('Missing native folders, run "numic native" to initialize', 'error')
  }

  let packages: string[] = []
  const { dependencies, devDependencies } = options().pkg

  if (typeof dependencies === 'object') {
    packages = packages.concat(Object.keys(dependencies))
  }

  if (typeof devDependencies === 'object') {
    packages = packages.concat(Object.keys(devDependencies))
  }

  const installedPlugins = packages.filter((pkg) => pkg.endsWith('-numic-plugin'))

  if (installedPlugins.length > 0) {
    await runPluginsIn(installedPlugins, basePath())
    log(`Ran ${installedPlugins.length} plugins`)
  }
}
