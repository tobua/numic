import { join, sep } from 'path'
import { options } from '../options'

export const packageJson = () => {
  const pkg: any = {
    scripts: options().pkg.scripts,
    prettier: `.${sep}${join('node_modules/numic/configuration', '.prettierrc.json')}`,
    eslintConfig: {
      extends: `.${sep}${join('node_modules/numic/configuration', '.eslintrc.json')}`,
    },
  }

  if (!options().pkg.scripts) {
    pkg.scripts = {}
  }

  // Existing scripts will not be overriden.
  pkg.scripts = Object.assign(
    { native: 'numic native', patch: 'numic patch', apply: 'numic apply', lint: 'numic lint' },
    pkg.scripts
  )

  return pkg
}
