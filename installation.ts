import { log } from './helper'
import { configure } from './configure'
import { native } from './script/native'
import { apply } from './script/apply'

log('Setting up native installation')

await configure()
await native()
apply({ skipEmpty: true })

log('Setup successful')
