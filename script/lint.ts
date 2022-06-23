import { execSync } from 'child_process'
import { log } from '../helper'

export const lint = () => {
  log('Linting')
  execSync(`eslint . --ext .js,.ts,.tsx`, { stdio: 'inherit' })
  log('Formatting')
  execSync('prettier "{,!(android|ios)/**/}*.{ts,tsx}" --write', { stdio: 'inherit' })
}
