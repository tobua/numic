#!/usr/bin/env node
import isCI from 'is-ci'
import { log } from './helper'
import { configure } from './configure'
import { lint } from './script/lint'
import { native } from './script/native'
import { apply } from './script/apply'

const scripts = {
  lint,
  native,
  apply,
}

const script = process.argv.slice(2)[0]

if (!Object.keys(scripts).includes(script)) {
  log('Please provide a valid script', 'error')
}

// Configure package.json (again) before each script is run.
// Also copies over user made configuration possibly required
// for script to run properly.
configure()

try {
  scripts[script]()
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
