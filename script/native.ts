import { join } from 'path'
import { existsSync, mkdirSync, renameSync, rmSync, cpSync, readFileSync } from 'fs'
import { execSync } from 'child_process'
import { log, basePath, getFolders } from '../helper'
import { initializeRepository } from '../git'
import { options } from '../options'
import { plugin } from './plugin'

type NativeOptions = { skipInstall?: boolean; appName?: string; debug?: boolean; version?: string }

const getAppJsonName = () => {
  const appJsonPath = join(basePath(), 'app.json')
  if (!existsSync(appJsonPath)) {
    return null
  }

  try {
    const contents = JSON.parse(readFileSync(appJsonPath, 'utf-8'))
    if (typeof contents.name === 'string' && contents.name.length > 0) {
      return contents.name
    }
  } catch (error) {
    // Ignored
  }

  return null
}

const getVersion = (nativeOptions: NativeOptions) => {
  if (nativeOptions.version) {
    return ` --version ${nativeOptions.version}`
  }

  const packageVersion = options().reactNativeVersion

  if (packageVersion) {
    return ` --version ${packageVersion}`
  }

  return ''
}

export const native = async (nativeOptions: NativeOptions = {}) => {
  const folders = getFolders()

  if (existsSync(folders.numic)) {
    // Remove existing repository and installation.
    rmSync(folders.numic, { recursive: true })
  }

  mkdirSync(folders.numic, { recursive: true })

  log('⚠️  Removing existing /android and /ios folders')

  if (existsSync(folders.user.android)) {
    rmSync(folders.user.android, { recursive: true })
  }
  if (existsSync(folders.user.ios)) {
    rmSync(folders.user.ios, { recursive: true })
  }

  log('⌛ Initializing a fresh RN project...')

  // TODO is this user relevant? (appName property in pkg.json or inferring from name + App)
  const appName = nativeOptions.appName ?? getAppJsonName() ?? 'NumicApp'
  const skip = nativeOptions.skipInstall ? ' --skip-install' : ''
  const version = getVersion(nativeOptions)

  // DOC https://github.com/react-native-community/cli/blob/master/packages/cli/src/commands/init/index.ts
  execSync(`npx react-native init ${appName}${skip}${version}`, {
    cwd: folders.numic,
    // Write output to cnosole if in debug mode.
    stdio: nativeOptions.debug ? 'inherit' : 'pipe',
  })

  renameSync(join(basePath(), `.numic/${appName}/android`), folders.plugin.android)
  renameSync(join(basePath(), `.numic/${appName}/ios`), folders.plugin.ios)

  cpSync(folders.plugin.android, folders.user.android, { recursive: true })
  cpSync(folders.plugin.ios, folders.user.ios, { recursive: true })

  // Remove temporary project directory.
  rmSync(join(folders.numic, appName), { recursive: true })

  // Install plugins (will not be included in patches).
  await plugin()

  // Initialize bare repository to later diff for changes.
  initializeRepository()
}
