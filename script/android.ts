import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { additionalCliArguments, getFolders, hasRejectedHunks, log } from '../helper'
import { type RunInputs, RunMode } from '../types'
import { native } from './native'
import { patch } from './patch'
import { plugin } from './plugin'

export const android = async (inputs: RunInputs) => {
  const folders = getFolders()
  log('Android')

  if (
    existsSync(folders.user.android) &&
    existsSync(folders.user.ios) &&
    existsSync(folders.plugin.android) &&
    existsSync(folders.plugin.ios)
  ) {
    // Apply plugins in case new plugins installed.
    await plugin()
  } else {
    await native()
  }

  if (hasRejectedHunks()) {
    return
  }

  // Update patch.
  patch()

  let runInputArguments = ''

  if (typeof inputs === 'object' && typeof inputs.mode === 'number' && typeof inputs.location === 'number') {
    runInputArguments += ` --mode=${inputs.mode === RunMode.Debug ? 'debug' : 'release'}`
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
