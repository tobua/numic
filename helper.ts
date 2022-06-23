import { join } from 'path'
import { create } from 'logua'

export const log = create('numic', 'green')

export const basePath = () => {
  // CWD during postinstall is in package, otherwise in project.
  const currentWorkingDirectory = process.cwd()

  // Required for pnpm as modules are nested deeper.
  if (currentWorkingDirectory.includes('node_modules') && process.env.INIT_CWD) {
    return process.env.INIT_CWD
  }

  if (
    currentWorkingDirectory.includes('node_modules/numic') ||
    currentWorkingDirectory.includes('node_modules\\numic')
  ) {
    return join(currentWorkingDirectory, '../..')
  }

  return currentWorkingDirectory
}

export const hashPath = (options) => join('node_modules', 'numic', options().hash)
