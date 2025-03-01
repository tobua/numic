export interface Package {
  name: string
  numic?: object
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  devDependencies?: Record<string, string> & {
    typescript?: string
  }
  scripts?: object
  tsconfig?: object
}

export interface Options {
  pkg: Package
  tsconfig?: object
  gitignore?: string[]
  nativeGitignore?: string[] | string
  reactNativeVersion?: string
  typescript: boolean
  oldArchitecture?: boolean
}

export type NativeOptions = {
  appName: string
  debug?: boolean
  version: string
}

export interface PluginInput {
  projectPath?: string
  nativePath?: string
  log?: (message: string, type?: 'error' | 'warning') => void
  options?: object
  version?: string
}

export enum RunLocation {
  Local = 0,
  Device = 1,
}

export enum RunMode {
  Debug = 0,
  Release = 1,
}

export type RunInputs = {
  location: RunLocation
  mode: RunMode
  device?: string // iOS or Android device.
  simulator?: string
  emulator?: string
}
