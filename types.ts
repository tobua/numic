export interface Package {
  name: string
  numic?: Object
  dependencies?: Object
  peerDependencies?: Object
  devDependencies?: Object
  scripts?: Object
}

export interface Options {
  pkg: Package
  tsconfig?: Object
  gitignore?: string[]
  reactNativeVersion?: string
}
