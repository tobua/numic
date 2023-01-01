export interface Package {
  name: string
  numic?: object
  dependencies?: object
  peerDependencies?: object
  devDependencies?: {
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
}

export type NativeOptions = {
  skipInstall?: boolean
  appName?: string
  debug?: boolean
  version?: string
}

export interface PluginInput {
  projectPath?: string
  nativePath?: string
  log?: (message: string, type?: 'error' | 'warning') => void
  options?: object
  version?: string
}
