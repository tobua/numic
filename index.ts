#!/usr/bin/env node
import isCI from 'is-ci'
import { log, cliOptions } from './helper'
import { configure } from './configure'
import { lint } from './script/lint'
import { native } from './script/native'
import { apply } from './script/apply'
import { patch } from './script/patch'
import { plugin } from './script/plugin'
import { android } from './script/android'
import { ios } from './script/ios'
import { prompt } from './script/prompt'

export type { PluginInput } from './types'

const scripts = {
  lint,
  native,
  apply,
  patch,
  plugin,
  android,
  ios,
  prompt,
}

const script = process.argv.slice(2)[0] ?? 'prompt'

if (!Object.keys(scripts).includes(script)) {
  log('Please provide a valid script', 'error')
}

// Configure package.json (again) before each script is run.
// Also copies over user made configuration possibly required
// for script to run properly.
configure()

try {
  scripts[script](cliOptions(script))
} catch (error) {
  log(`Script ${script} exited with an error`)

  if (script !== 'test' && !isCI) {
    // eslint-disable-next-line no-console
    console.error(error)
  }

  if (isCI) {
    throw new Error(error)
  }
}
