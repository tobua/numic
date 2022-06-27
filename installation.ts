import { log } from './helper'
import { configure } from './configure'
import { native } from './script/native'
import { apply } from './script/apply'

log('Setting up native installation')

configure()
await native()
apply()

log('Setup successful')
