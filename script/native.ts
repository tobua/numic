import { join } from 'path'
import { existsSync, mkdirSync, rmSync, cpSync } from 'fs'
import { getFolders, filterAndroid, filterIOS, defaultNativeOptions, log } from '../helper'
import { initializeRepository } from '../git'
import { plugin } from './plugin'
import { NativeOptions } from '../types'
import { cacheTemplate } from '../template-cache'

export const native = async (nativeOptions: NativeOptions = {}) => {
  const folders = getFolders()
  // eslint-disable-next-line no-param-reassign
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

  // TODO check if iOS stays intact, previously issues caused by copying, crash on build.
  cpSync(androidCache, folders.user.android, { recursive: true, filter: filterAndroid })
  cpSync(iosCache, folders.user.ios, {
    recursive: true,
    filter: filterIOS,
  })

  cpSync(androidCache, folders.plugin.android, { recursive: true, filter: filterAndroid })
  cpSync(iosCache, folders.plugin.ios, {
    recursive: true,
    filter: filterIOS,
  })

  // Install plugins (will not be included in patches).
  await plugin()

  // Initialize bare repository to later diff for changes.
  initializeRepository()
}
