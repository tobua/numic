import { existsSync, cpSync, rmSync } from 'fs'
import { createPatch } from '../git'
import { log, getFolders, filterIOS, filterAndroid } from '../helper'

export const patch = () => {
  const folders = getFolders()

  if (!existsSync(folders.user.android) || !existsSync(folders.user.ios)) {
    log('Missing native folders, run "numic native" to initialize', 'error')
  }

  try {
    // First remove android and ios folders in order for removals to disappear.
    rmSync(folders.plugin.android, { recursive: true })
    rmSync(folders.plugin.ios, { recursive: true })
    cpSync(folders.user.android, folders.plugin.android, { recursive: true, filter: filterAndroid })
    cpSync(folders.user.ios, folders.plugin.ios, {
      recursive: true,
      filter: filterIOS,
    })
  } catch (error) {
    log('Failed to copy native files', 'error')
  }

  createPatch()
}
