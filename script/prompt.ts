import { existsSync, renameSync } from 'fs'
import { EOL } from 'os'
import { join } from 'path'
import { execSync, spawn } from 'child_process'
import prompts from 'prompts'
import { sync as commandExists } from 'command-exists'
import { basePath, hasRejectedHunks, log } from '../helper'
import { patch } from './patch'
import { plugin } from './plugin'
import { apply } from './apply'
import { lint } from './lint'
import { ios } from './ios'
import { android } from './android'
import { RunLocation, RunMode } from '../types'
import { clearTemplateCache } from '../template-cache'

const scriptToMethod = {
  plugin,
  patch,
  apply,
  lint,
}

const getAdbDevices = () => {
  let adbDevicesOutput = ''

  try {
    adbDevicesOutput = execSync('adb devices', { encoding: 'utf8' }).trim()
  } catch (_) {
    log('Failed to get devices by running "adb devices"', 'error')
  }

  const devices: string[] = []
  const lines = adbDevicesOutput.split(EOL)
  lines.shift() // skip the help line

  lines.forEach((line) => {
    // eslint-disable-next-line no-param-reassign
    line = line.trim()
    const match = line.match(/^([^ \t]+)(\t| )/)
    if (match) {
      devices.push(match[1])
    }
  })

  return devices
}

interface SimctlOutput {
  devices: { [key: string]: [] }
}

const getIOSSimulators = () => {
  let simctlOutput: SimctlOutput = { devices: {} }

  try {
    simctlOutput = JSON.parse(
      execSync('xcrun simctl list --json devices available', {
        encoding: 'utf8',
      }).trim(),
    ).devices
  } catch (_) {
    log('Failed to get a list of available iOS simulators', 'error')
  }

  const allDevices: { name: string; state: 'Booted' | 'Shutdown' }[] = []

  Object.keys(simctlOutput).forEach((runtime) => {
    allDevices.push(
      ...simctlOutput[runtime].map((device) => ({ name: device.name, state: device.state })),
    )
  })

  // Display booted simulators first.
  allDevices.sort((first) => (first.state === 'Shutdown' ? 1 : -1))

  return allDevices
}

const getAndroidEmulators = () => {
  let emulatorOutput = ''
  let runningDevicesOutput = ''

  try {
    emulatorOutput = execSync('emulator -list-avds', {
      encoding: 'utf8',
    })
  } catch (_) {
    log('Failed to get a list of available Android emulators', 'error')
  }

  const emulators = emulatorOutput
    .split('\n')
    .filter((line) => !line.includes('|'))
    .filter(Boolean)

  try {
    runningDevicesOutput = execSync('adb devices', {
      encoding: 'utf8',
    })
  } catch (_) {
    log('Failed to get a list of available Android emulators', 'error')
  }

  const emulatorRegex = /^emulator-\d+/gm
  const runningEmulators = [...runningDevicesOutput.matchAll(emulatorRegex)].map(
    (match) => match[0],
  )

  // Running emulator name functions as a device.
  const emulatorNameToDevice: Record<string, string> = {}

  const runningEmulatorNames = runningEmulators
    .map((runningEmulator) => {
      let detailsOutput = ''

      try {
        detailsOutput = execSync(`adb -s ${runningEmulator} shell getprop`, {
          encoding: 'utf8',
        })
      } catch (_) {
        log(`Failed to emulator name for ${runningEmulator}`, 'warning')
      }

      const avdNameRegex = /\[ro\.boot\.qemu\.avd_name\]: \[(.+?)\]/

      const match = detailsOutput.match(avdNameRegex)
      const avdName = match ? match[1] : null

      if (avdName) {
        emulatorNameToDevice[avdName] = runningEmulator
      }

      return avdName
    })
    .filter(Boolean)

  const allDevices = emulators.map((emulator) => ({
    name: emulator,
    state: runningEmulatorNames.includes(emulator) ? 'Booted' : 'Shutdown',
    device: emulatorNameToDevice[emulator],
  }))

  return allDevices
}

const getIOSDevices = () => {
  let output = ''

  try {
    output = execSync('ios-deploy --detect', {
      encoding: 'utf8',
    }).trim()
  } catch (_) {
    log('Failed to get iOS devices by running "ios-deploy --detect"', 'error')
  }

  return [...output.matchAll(/'(.+?)'/g)].map((match) => match[1])
}

const createAndroidBundle = async () => {
  await plugin() // Run plugins (to update Android version etc.)

  if (hasRejectedHunks()) {
    return
  }

  patch() // Update patch.

  const base = basePath()

  try {
    execSync('./gradlew bundleRelease', {
      cwd: join(base, 'android'),
      stdio: 'inherit',
    })
  } catch (_) {
    log('Failed to run "./gradlew bundleRelease" inside /android', 'error')
  }

  const bundlePath = join(base, 'android/app/build/outputs/bundle/release/app-release.aab')
  const destinationPath = join(base, 'android-bundle.aab')

  // Copy to root for easy upload.
  if (existsSync(bundlePath)) {
    renameSync(bundlePath, destinationPath)
    log(`Bundle in "${destinationPath}" is ready to be uploaded to the Google Play Console`)
  }
}

export const prompt = async () => {
  const { script } = await prompts({
    type: 'select',
    name: 'script',
    message: 'Which command do you want to run?',
    choices: [
      { title: 'iOS', value: 'ios' },
      { title: 'Android', value: 'android' },
      { title: 'Distribute', value: 'distribute' },
      { title: 'Run plugins', value: 'plugin' },
      { title: 'Create or update patch', value: 'patch' },
      { title: 'Apply existing patch', value: 'apply' },
      { title: 'Lint project', value: 'lint' },
      { title: 'Clear native cache', value: 'clear' },
    ],
  })

  let simulator: string | undefined
  let emulator: string | undefined
  let isEmulatorRunning = false
  let device: string | undefined

  if (!script) {
    return
  }

  if (script in scriptToMethod) {
    await scriptToMethod[script]()
  }

  if (script === 'distribute') {
    const { platform } = await prompts({
      type: 'select',
      name: 'platform',
      message: 'For which platform to you want to publish?',
      choices: [
        { title: 'Android', value: 'android' },
        { title: 'iOS (Coming Soon)', value: 'ios' },
      ],
    })

    if (platform === 'android') {
      await createAndroidBundle()
    }

    if (platform === 'ios') {
      // TODO
    }
  }

  if (script === 'ios' || script === 'android') {
    const { location } = await prompts({
      type: 'select',
      name: 'location',
      message: 'Where do you want to run the app?',
      choices: [
        { title: script === 'ios' ? 'Simulator' : 'Emulator', value: RunLocation.local },
        { title: 'Device', value: RunLocation.device },
      ],
    })

    if (script === 'ios' && location === RunLocation.local) {
      const simulators = getIOSSimulators()

      simulator = (
        await prompts({
          type: 'select',
          name: 'simulator',
          message: 'Which simulator do you want to run the app on?',
          choices: simulators.map((item) => ({
            title: `${item.name}${item.state === 'Booted' ? ' (Running)' : ''}`,
            value: item.name,
          })),
        })
      ).simulator
    }

    if (script === 'android' && location === RunLocation.local) {
      const emulators = getAndroidEmulators()

      emulator = (
        await prompts({
          type: 'select',
          name: 'emulator',
          message: 'Which emulator do you want to run the app on?',
          choices: emulators.map((item) => ({
            title: `${item.name}${item.state === 'Booted' ? ' (Running)' : ''}`,
            value: item.name,
          })),
        })
      ).emulator

      // Device is required to select the emulator in the RN CLI.
      emulators.forEach((currentEmulator) => {
        if (currentEmulator.name === emulator) {
          device = currentEmulator.device
        }
      })

      isEmulatorRunning = emulators.some(
        (currentEmulator) =>
          currentEmulator.name === emulator && currentEmulator.state === 'Booted',
      )
    }

    if (script === 'android' && location === RunLocation.device) {
      if (!commandExists('adb')) {
        log(
          'adb command required, install the Android SDK and make sure to add binaries to the PATH variable',
          'error',
        )
      }

      const devices = getAdbDevices()

      if (!devices.length) {
        log('No attached devices found', 'error')
      }

      device = (
        await prompts({
          type: 'select',
          name: 'device',
          message: 'Which device do you want to run the app on?',
          choices: devices.map((item) => ({ title: item, value: item })),
        })
      ).device
    }

    const { mode } = await prompts({
      type: 'select',
      name: 'mode',
      message: 'Which configuration do you want to use?',
      choices: [
        { title: 'Debug (Development)', value: RunMode.debug },
        { title: 'Release (Production)', value: RunMode.release },
      ],
    })

    if (script === 'ios') {
      if (location === RunLocation.device) {
        if (!commandExists('ios-deploy')) {
          log(
            'ios-deploy required to run on device, install with "sudo npm install -g ios-deploy", "bun pm trust ios-deploy && bun install -g ios-deploy" or "brew install ios-deploy"',
            'error',
          )
        }

        const devices = getIOSDevices()

        device = (
          await prompts({
            type: 'select',
            name: 'device',
            message: 'Which device do you want to run the app on?',
            choices: devices.map((item) => ({
              title: item,
              value: item,
            })),
          })
        ).device
      }

      ios({ location, mode, device, simulator })
    }

    if (script === 'android') {
      if (emulator && !isEmulatorRunning) {
        log(`Launching emulator ${emulator} in the background`)
        spawn('emulator', ['-avd', emulator], { shell: true, detached: true })
      }

      android({ location, mode, device, simulator, emulator })
    }
  }

  if (script === 'clear') {
    const directory = clearTemplateCache()
    log(`Template cache in ${directory} successfully cleared`)
  }
}
