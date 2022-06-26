import { join } from 'path'
import { create } from 'logua'
import arg from 'arg'

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

const optionsSpecificationByScript = {
  native: {
    '--version': String,
    '--debug': Boolean,
    '--skipInstall': Boolean,
    '--appName': String,
  },
  lint: {},
  patch: {},
  apply: {},
}

export const cliOptions = (script: string) =>
  arg(optionsSpecificationByScript[script], { permissive: false, argv: process.argv.slice(2) })
