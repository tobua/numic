import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { additionalCliArguments, basePath, checkCommandVersion, getFolders, hasRejectedHunks, isOnline, log, options } from '../helper'
import { type RunInputs, RunLocation, RunMode } from '../types'
import { native } from './native'
import { patch } from './patch'
import { plugin } from './plugin'

export const ios = async (inputs: RunInputs) => {
  const folders = getFolders()
  log('iOS')

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

  if (!checkCommandVersion('gem -v', '3.4.0')) {
    log('The "gem" executable version is outdated, make sure to update soon, by running "gem update --system"')
  }

  if (!checkCommandVersion('pod --version', '1.12.0')) {
    log('The "pod" (cocoapods) executable version is outdated, make sure to update soon, by running "gem update"')
  }

  log('Updating iOS Pods')
  if (await isOnline()) {
    try {
      execSync(`${options().oldArchitecture ? '' : 'RCT_NEW_ARCH_ENABLED=1 '}pod update`, {
        cwd: join(basePath(), 'ios'),
        encoding: 'utf8',
        stdio: 'pipe',
      })
    } catch (error: any) {
      log('Failed to run "pod update" in /ios', 'warning')
      console.log(error.stdout)
    }
  } else {
    log('Offline, skipping "pod update" in /ios')
  }

  let runInputArguments = ''

  if (typeof inputs === 'object' && typeof inputs.mode === 'number' && typeof inputs.location === 'number') {
    runInputArguments += ` --mode=${inputs.mode === RunMode.Debug ? 'Debug' : 'Release'}`
    if (inputs.location === RunLocation.Device) {
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
