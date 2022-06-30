import { execSync } from 'child_process'
import { log } from '../helper'

export const android = () => {
  log('Android')
  // TODO configure native folders properly.
  execSync(`react-native run-android ${process.argv.slice(3)}`, { stdio: 'inherit' })
}
