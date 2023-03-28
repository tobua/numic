import { execSync } from 'child_process'
import prompts from 'prompts'
import { sync as commandExists } from 'command-exists'
import { log } from '../helper'
import { patch } from './patch'
import { plugin } from './plugin'
import { apply } from './apply'
import { lint } from './lint'
import { ios } from './ios'
import { android } from './android'
import { RunLocation, RunMode } from '../types'

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
  const lines = adbDevicesOutput.replace('\r', '').split('\n')
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
      }).trim()
    ).devices
  } catch (_) {
    log('Failed to get a list of available iOS simulators', 'error')
  }

  const allDevices = []

  Object.keys(simctlOutput).forEach((runtime) => {
    allDevices.push(
      ...simctlOutput[runtime].map((device) => ({ name: device.name, state: device.state }))
    )
  })

  // Display booted simulators first.
  allDevices.sort((first) => (first.state === 'Shutdown' ? 1 : -1))

  return allDevices as { name: string; state: 'Booted' | 'Shutdown' }[]
}

export const prompt = async () => {
  const { script } = await prompts({
    type: 'select',
    name: 'script',
    message: 'Which command do you want to run?',
    choices: [
      { title: 'iOS', value: 'ios' },
      { title: 'Android', value: 'android' },
      { title: 'Run plugins', value: 'plugin' },
      { title: 'Create or update patch', value: 'patch' },
      { title: 'Apply existing patch', value: 'apply' },
      { title: 'Lint project', value: 'lint' },
    ],
  })

  let deviceId: string
  let simulator: string

  if (!script) {
    return
  }

  if (script !== 'ios' && script !== 'android') {
    await scriptToMethod[script]()
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

    if (script === 'android' && location === RunLocation.device) {
      if (!commandExists('adb')) {
        log(
          'adb command required, install the Android SDK and make sure to add binaries to the PATH variable',
          'error'
        )
      }

      const devices = getAdbDevices()

      if (!devices.length) {
        log('No attached devices found', 'error')
      }

      const { device } = await prompts({
        type: 'select',
        name: 'device',
        message: 'Which device do you want to run the app on?',
        choices: devices.map((item) => ({ title: item, value: item })),
      })

      deviceId = device
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
            'ios-deploy required to run on device, install with "sudo npm install -g ios-deploy" or "brew install ios-deploy"',
            'error'
          )
        }
      }
      ios({ location, mode })
    }

    if (script === 'android') {
      android({ location, mode, deviceId, simulator })
    }
  }
}
