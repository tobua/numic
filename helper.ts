import { execSync } from 'node:child_process'
import { resolve } from 'node:dns/promises'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import arg from 'arg'
import merge from 'deepmerge'
import { create } from 'logua'
import semver from 'semver'
import type { NativeOptions, Options, Package } from './types'

export const log = create('numic', 'green')

export const basePath = () => {
  // CWD during postinstall is in package, otherwise in project.
  const currentWorkingDirectory = process.cwd()

  // Required for pnpm as modules are nested deeper.
  if (currentWorkingDirectory.includes('node_modules') && process.env.INIT_CWD) {
    return process.env.INIT_CWD
  }

  if (currentWorkingDirectory.includes('node_modules/numic') || currentWorkingDirectory.includes('node_modules\\numic')) {
    return join(currentWorkingDirectory, '../..')
  }

  return currentWorkingDirectory
}

const optionsSpecificationByScript = {
  native: {
    '--version': String,
    '--debug': Boolean,
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
  const result: Record<string, string> = {}

  if (script === 'ios' || script === 'android' || script === 'prompt') {
    return result
  }

  const parsed = arg(optionsSpecificationByScript[script as keyof typeof optionsSpecificationByScript], {
    permissive: false,
    argv: process.argv.slice(3),
  })
  for (const option of Object.keys(parsed)) {
    // @ts-ignore
    result[option.replace('--', '')] = parsed[option]
  }
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

export const filterIos = (source: string) => {
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

export const checkCommandVersion = (command: string, version: string) => {
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

const isTypeScript = (pkg: Package) => Boolean(pkg.devDependencies?.typescript || existsSync(join(basePath(), 'tsconfig.json')))

// Default options.
const defaultOptions = (pkg: Package) => ({
  pkg,
  typescript: isTypeScript(pkg),
})

let cache: Options | undefined

export const resetOptions = () => {
  cache = undefined
}

export const options: () => Options = () => {
  if (cache) {
    return cache
  }

  let packageContents: Package = { name: '' }

  try {
    const packageContentsFile = readFileSync(join(basePath(), 'package.json'), 'utf8')
    packageContents = JSON.parse(packageContentsFile)
  } catch (_error) {
    log('Unable to load package.json', 'error')
  }

  if (typeof packageContents.name !== 'string') {
    log('Missing "name" field in package.json', 'error')
  }

  let result: Options = defaultOptions(packageContents)

  try {
    result.reactNativeVersion = JSON.parse(readFileSync(join(basePath(), 'node_modules/react-native/package.json'), 'utf8')).version
  } catch (_error) {
    log('React native installation not found', 'warning')
  }

  if (typeof packageContents.numic === 'object') {
    // Include project specific overrides
    result = merge(result, packageContents.numic, { clone: false })
  }

  if (typeof packageContents.tsconfig === 'object') {
    result.tsconfig = packageContents.tsconfig
  }

  cache = result

  return result
}

export const getAppJsonName = () => {
  const appJsonPath = join(basePath(), 'app.json')
  if (!existsSync(appJsonPath)) {
    return null
  }

  try {
    const contents = JSON.parse(readFileSync(appJsonPath, 'utf-8'))
    if (typeof contents.name === 'string' && contents.name.length > 0) {
      return contents.name
    }
  } catch (_error) {
    // Ignored
  }

  return null
}

export const getVersion = (nativeOptions: NativeOptions) => {
  if (nativeOptions.version) {
    return nativeOptions.version
  }

  const packageVersion = options().reactNativeVersion

  if (packageVersion) {
    return packageVersion
  }

  return ''
}

export const defaultNativeOptions = (nativeOptions: NativeOptions) => {
  nativeOptions.debug ??= false
  nativeOptions.appName ||= getAppJsonName() ?? 'NumicApp'
  nativeOptions.version ||= getVersion(nativeOptions)

  return nativeOptions
}

export const hasRejectedHunks = () => {
  const rejectedHunksPath = join(basePath(), 'patch/rejected-hunks.patch')

  if (existsSync(rejectedHunksPath)) {
    log(
      `Parts of your patch couldn't be applied and are now in patch/rejected-hunks.patch. Apply the rejected hunks manually to the native folders and then run "npx numic patch" to update the patch. After this remove the rejected-hunks.patch file and try this command again`,
      'warning',
    )
    return true
  }

  return false
}

// Remove lines like "index c9bc539..eaaabea 100644"
export const replaceIndexLinesFromPatch = (input: string) => input.replaceAll(/index\s[a-zA-Z0-9]{7}\.\.[a-zA-Z0-9]{7}\s\d{6}[\n\r]/g, '')
