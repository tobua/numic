import { join, sep } from 'path'
import { options } from '../helper'

export const packageJson = (isFirstInstall: boolean) => {
  const pkg: any = {
    scripts: options().pkg.scripts,
    prettier: `.${sep}${join('node_modules/numic/configuration', '.prettierrc.json')}`,
    eslintConfig: {
      extends: `.${sep}${join('node_modules/numic/configuration', '.eslintrc.json')}`,
    },
  }

  // Existing scripts will not be overriden.
  if (isFirstInstall) {
    if (!options().pkg.scripts) {
      pkg.scripts = {}
    }

    pkg.scripts = Object.assign(
      {
        start: 'numic',
        ios: 'numic ios',
        android: 'numic android',
        lint: 'numic lint',
      },
      pkg.scripts
    )
  }

  // Essential to plugin lifecycle.
  if (pkg.scripts && !pkg.scripts.ios?.includes('numic')) {
    pkg.scripts.ios = 'numic ios'
  }

  if (pkg.scripts && !pkg.scripts.android?.includes('numic')) {
    pkg.scripts.android = 'numic android'
  }

  return pkg
}
