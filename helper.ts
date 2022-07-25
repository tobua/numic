import { resolve } from 'dns/promises'
import { execSync } from 'child_process'
import { join } from 'path'
import { create } from 'logua'
import arg from 'arg'
import semver from 'semver'

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
  apply: {
    '--skipEmpty': Boolean,
  },
  plugin: {},
}

export const cliOptions = (script: string) => {
  const result = {}

  if (script === 'ios' || script === 'android') {
    return result
  }

  const parsed = arg(optionsSpecificationByScript[script], {
    permissive: false,
    argv: process.argv.slice(3),
  })
  Object.keys(parsed).forEach((option) => {
    result[option.replace('--', '')] = parsed[option]
  })
  return result
}

export const getFolders = () => ({
  numic: join(basePath(), '.numic'),
  user: {
    ios: join(basePath(), 'ios'),
    android: join(basePath(), 'android'),
  },
  plugin: {
    ios: join(basePath(), '.numic', 'ios'),
    android: join(basePath(), '.numic', 'android'),
  },
  plugins: join(basePath(), 'plugin'),
})

export const additionalCliArguments = () =>
  [...process.argv]
    .splice(3)
    .map((item) => `"${item}"`)
    .join(' ')

export const filterIOS = (source: string) => {
  if (source.includes('/ios/Pods/') || source.includes('/ios/build/')) {
    return false
  }
  return true
}

export const filterAndroid = (source: string) => {
  if (source.includes('/android/build/')) {
    return false
  }
  return true
}

export const isOnline = async () => {
  try {
    await resolve('www.google.com')
    return true
  } catch (_) {
    return false
  }
}

export const checkCommandVersion = (command, version) => {
  let commandOutput: string

  try {
    commandOutput = execSync(command, { encoding: 'utf8' }).trim()
  } catch (_) {
    // Ignore, probably missing executable and will fail later.
    return true
  }

  if (semver.valid(commandOutput)) {
    if (!semver.gt(commandOutput, version)) {
      // Outdated.
      return false
    }
  }

  return true
}
