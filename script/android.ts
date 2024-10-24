import { existsSync } from 'fs'
import { execSync } from 'child_process'
import { log, getFolders, additionalCliArguments, hasRejectedHunks } from '../helper'
import { native } from './native'
import { patch } from './patch'
import { plugin } from './plugin'
import { RunInputs, RunMode } from '../types'

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

  if (
    typeof inputs === 'object' &&
    typeof inputs.mode === 'number' &&
    typeof inputs.location === 'number'
  ) {
    runInputArguments += ` --mode=${inputs.mode === RunMode.debug ? 'debug' : 'release'}`
    if (inputs.device) {
      if (inputs.emulator) {
        // --deviceId is deprecated, but --device will not work.
        runInputArguments += ` --deviceId ${inputs.device}`
      } else {
        runInputArguments += ` --device ${inputs.device}`
      }
    }
    if (inputs.emulator) {
      runInputArguments += ' --active-arch-only' // Speeds up build.
    }
  }
  log('Starting native build')
  execSync(`react-native run-android${runInputArguments} ${additionalCliArguments()}`, {
    stdio: 'inherit',
  })
  log('Build done')
}
