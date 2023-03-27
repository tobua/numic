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

const scriptToMethod = {
  plugin,
  patch,
  apply,
  lint,
}

export const prompt = async () => {
  let response = await prompts({
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

  const { script } = response
  let deviceId: string

  if (!script) {
    return
  }

  if (script !== 'ios' && script !== 'android') {
    await scriptToMethod[script]()
  }

  if (script === 'ios' || script === 'android') {
    response = await prompts({
      type: 'select',
      name: 'location',
      message: 'Where do you want to run the app?',
      choices: [
        { title: script === 'ios' ? 'Simulator' : 'Emulator', value: 'local' },
        { title: 'Device', value: 'device' },
      ],
    })

    const { location } = response

    if (script === 'android' && location === 'device') {
      if (!commandExists('adb')) {
        log(
          'adb command required, install the Android SDK and make sure to add binaries to the PATH variable',
          'error'
        )
      }

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

      if (!devices.length) {
        log('No attached devices found', 'error')
      }

      response = await prompts({
        type: 'select',
        name: 'device',
        message: 'Which device do you want to run the app on?',
        choices: devices.map((device) => ({ title: device, value: device })),
      })

      deviceId = response.device
    }

    response = await prompts({
      type: 'select',
      name: 'mode',
      message: 'Which configuration do you want to use?',
      choices: [
        { title: 'Development', value: 'development' },
        { title: 'Production', value: 'production' },
      ],
    })

    const { mode } = response

    if (script === 'ios') {
      if (location === 'device') {
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
      android({ location, mode, deviceId })
    }
  }
}
