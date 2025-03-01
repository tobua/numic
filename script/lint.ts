import { execSync } from 'node:child_process'
import { log } from '../helper'

export const lint = () => {
  log('Linting')
  try {
    execSync('eslint . --ext .js,.ts,.tsx --fix', { stdio: 'inherit' })
  } catch (_error) {
    // Ignored, will not lead to CI fail.
  }
  log('Formatting')
  execSync('prettier "{,!(android|ios)/**/}*.{ts,tsx}" --write', { stdio: 'inherit' })
}
