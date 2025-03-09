import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { initializeRepository } from '../git'
import { defaultNativeOptions, filterAndroid, filterIos, getFolders, log } from '../helper'
import { cacheTemplate } from '../template-cache'
import type { NativeOptions } from '../types'
import { plugin } from './plugin'

export const native = async (nativeOptions: NativeOptions = { appName: '', version: '' }) => {
  const folders = getFolders()
  // biome-ignore lint/style/noParameterAssign: Much easier in this case.
  nativeOptions = defaultNativeOptions(nativeOptions)

  if (existsSync(folders.numic)) {
    // Remove existing repository and installation.
    rmSync(folders.numic, { recursive: true })
  }

  mkdirSync(folders.numic, { recursive: true })

  log('⚠️  Removing existing /android and /ios folders')

  if (existsSync(folders.user.android)) {
    rmSync(folders.user.android, { recursive: true })
  }
  if (existsSync(folders.user.ios)) {
    rmSync(folders.user.ios, { recursive: true })
  }

  log('⌛ Initializing a fresh RN project...')

  const templateCacheLocation = cacheTemplate(nativeOptions)
  const androidCache = join(templateCacheLocation, 'android')
  const iosCache = join(templateCacheLocation, 'ios')

  cpSync(androidCache, folders.user.android, { recursive: true, filter: filterAndroid })
  cpSync(iosCache, folders.user.ios, {
    recursive: true,
    filter: filterIos,
  })

  cpSync(androidCache, folders.plugin.android, { recursive: true, filter: filterAndroid })
  cpSync(iosCache, folders.plugin.ios, {
    recursive: true,
    filter: filterIos,
  })

  // Install plugins (will not be included in patches).
  await plugin()

  // Initialize bare repository to later diff for changes.
  initializeRepository()
}
