import { existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import {
  log,
  getFolders,
  basePath,
  additionalCliArguments,
  isOnline,
  checkCommandVersion,
  hasRejectedHunks,
} from '../helper'
import { native } from './native'
import { patch } from './patch'
import { plugin } from './plugin'
import { RunInputs, RunLocation, RunMode } from '../types'

export const ios = async (inputs: RunInputs) => {
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

  if (hasRejectedHunks()) {
    return
  }

  // Update patch.
  patch()

  if (!checkCommandVersion('gem -v', '3.4.0')) {
    log(
      'The "gem" executable version is outdated, make sure to update soon, by running "gem update --system"',
    )
  }

  if (!checkCommandVersion('pod --version', '1.12.0')) {
    log(
      'The "pod" (cocoapods) executable version is outdated, make sure to update soon, by running "gem update"',
    )
  }

  log('Updating iOS Pods')
  if (await isOnline()) {
    try {
      execSync('pod update', { cwd: join(basePath(), 'ios'), encoding: 'utf8', stdio: 'pipe' })
    } catch (error) {
      log('Failed to run "pod update" in /ios', 'warning')
      console.log(error.stdout)
    }
  } else {
    log('Offline, skipping "pod update" in /ios')
  }

  let runInputArguments = ''

  if (
    typeof inputs === 'object' &&
    typeof inputs.mode === 'number' &&
    typeof inputs.location === 'number'
  ) {
    runInputArguments += ` --mode=${inputs.mode === RunMode.debug ? 'Debug' : 'Release'}`
    if (inputs.location === RunLocation.device) {
      runInputArguments += ` --device "${inputs.device}"`
    } else {
      runInputArguments += ` --simulator "${inputs.simulator}"`
    }
  }
  log('Starting native build')
  execSync(`react-native run-ios${runInputArguments} ${additionalCliArguments()}`, {
    stdio: 'inherit',
  })
  log('Build done')
}
