#!/usr/bin/env bun
import isCi from 'is-ci'
import { configure } from './configure'
import { cliOptions, log } from './helper'
import { android } from './script/android'
import { apply } from './script/apply'
import { ios } from './script/ios'
import { lint } from './script/lint'
import { native } from './script/native'
import { patch } from './script/patch'
import { plugin } from './script/plugin'
import { prompt } from './script/prompt'

export type { PluginInput, PluginLog } from './types'

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

const script = (process.argv.slice(2)[0] ?? 'prompt') as keyof typeof scripts

if (!Object.keys(scripts).includes(script)) {
  log('Please provide a valid script', 'error')
}

// Configure package.json (again) before each script is run.
// Also copies over user made configuration possibly required
// for script to run properly.
await configure()

try {
  scripts[script](cliOptions(script) as any)
} catch (error: any) {
  log(`Script ${script} exited with an error`)

  if (!isCi) {
    log(error, 'warning')
  }

  if (isCi) {
    throw new Error(error)
  }
}
