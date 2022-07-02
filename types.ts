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
  reactNativeVersion?: string
  typescript: boolean
}
