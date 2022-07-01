import { existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { log, getFolders, basePath, additionalCliArguments } from '../helper'
import { native } from './native'
import { patch } from './patch'
import { plugin } from './plugin'

export const ios = async () => {
  const folders = getFolders()
  log('iOS')

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

  // Update patch.
  patch()

  log('Updating iOS Pods')
  execSync('pod update', { cwd: join(basePath(), 'ios'), stdio: 'pipe' })

  execSync(`react-native run-ios ${additionalCliArguments()}`, { stdio: 'inherit' })
}
