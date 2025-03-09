import { cpSync, existsSync, rmSync } from 'node:fs'
import { createPatch } from '../git'
import { filterAndroid, filterIos, getFolders, log } from '../helper'

export const patch = () => {
  const folders = getFolders()

  if (!(existsSync(folders.user.android) && existsSync(folders.user.ios))) {
    log('Missing native folders, run "numic native" to initialize', 'error')
  }

  try {
    // First remove android and ios folders in order for removals to disappear.
    rmSync(folders.plugin.android, { recursive: true })
    rmSync(folders.plugin.ios, { recursive: true })
    cpSync(folders.user.android, folders.plugin.android, { recursive: true, filter: filterAndroid })
    cpSync(folders.user.ios, folders.plugin.ios, {
      recursive: true,
      filter: filterIos,
    })
  } catch (_error) {
    log('Failed to copy native files', 'error')
  }

  createPatch()
}
