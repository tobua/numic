import { existsSync, cpSync } from 'fs'
import { createPatch } from '../git'
import { log, getFolders } from '../helper'

export const patch = () => {
  const folders = getFolders()

  if (!existsSync(folders.user.android) || !existsSync(folders.user.ios)) {
    log('Missing native folders, run "numic native" to initialize', 'error')
  }

  try {
    cpSync(folders.user.android, folders.plugin.android, { recursive: true })
    cpSync(folders.user.ios, folders.plugin.ios, {
      recursive: true,
      filter: (source) => {
        if (source.includes('/ios/Pods')) {
          return false
        }
        return true
      },
    })
  } catch (error) {
    log('Failed to copy native files', 'error')
  }

  createPatch()

  log('Patch created in patch/current.patch')
}
