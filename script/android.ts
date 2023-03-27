import { existsSync } from 'fs'
import { execSync } from 'child_process'
import { log, getFolders, additionalCliArguments, hasRejectedHunks } from '../helper'
import { native } from './native'
import { patch } from './patch'
import { plugin } from './plugin'
import { RunInputs } from '../types'

export const android = async (inputs: RunInputs) => {
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

  let runInputArguments = ''

  if (typeof inputs === 'object' && inputs.mode && inputs.location) {
    runInputArguments += ` --mode=${inputs.mode === 'development' ? 'debug' : 'release'}`
    if (inputs.location === 'device' && inputs.deviceId) {
      runInputArguments += ` --deviceId=${inputs.deviceId}`
    }
  }

  execSync(`react-native run-android${runInputArguments} ${additionalCliArguments()}`, {
    stdio: 'inherit',
  })
}
