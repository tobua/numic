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

    pkg.scripts = Object.assign({ start: 'numic' }, pkg.scripts)
  }

  // Essential to plugin lifecycle.
  if (pkg.scripts && !pkg.scripts.start?.includes('numic')) {
    pkg.scripts.start = 'numic'
  }

  return pkg
}
