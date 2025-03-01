import { configure } from './configure'
import { log } from './helper'
import { apply } from './script/apply'
import { native } from './script/native'

const { INIT_CWD, PWD = process.cwd() } = process.env

if (!INIT_CWD || INIT_CWD === PWD || INIT_CWD.indexOf(PWD) === 0) {
  log(`Skipping 'postinstall' on local install`)
  process.exit(0)
}

log('Setting up native installation')

await configure()
await native()
apply({ skipEmpty: true })

log('Setup successful')
