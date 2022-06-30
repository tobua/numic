import { execSync } from 'child_process'
import { log } from '../helper'

export const ios = () => {
  log('iOS')
  // TODO configure native folders properly.
  execSync(`react-native run-ios ${process.argv.slice(3)}`, { stdio: 'inherit' })
}
