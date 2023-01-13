import { existsSync } from 'fs'
import { execSync } from 'child_process'
import { log, getFolders, additionalCliArguments, hasRejectedHunks } from '../helper'
import { native } from './native'
import { patch } from './patch'
import { plugin } from './plugin'

export const android = async () => {
  const folders = getFolders()
  log('Android')

  if (
    !existsSync(folders.user.android) ||
    !existsSync(folders.user.ios) ||
    !existsSync(folders.plugin.android) ||
    !existsSync(folders.plugin.ios)
  ) {
    await native({})
  } else {
    // Apply plugins in case new plugins installed.
    await plugin()
  }

  if (hasRejectedHunks()) {
    return
  }

  // Update patch.
  patch()

  execSync(`react-native run-android ${additionalCliArguments()}`, { stdio: 'inherit' })
}
