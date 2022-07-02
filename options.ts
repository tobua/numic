import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import merge from 'deepmerge'
import { basePath, log } from './helper'
import { Options, Package } from './types'

const isTypeScript = (pkg: Package) =>
  Boolean(pkg.devDependencies?.typescript || existsSync(join(basePath(), 'tsconfig.json')))

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

  let packageContents: Package

  try {
    const packageContentsFile = readFileSync(join(basePath(), 'package.json'), 'utf8')
    packageContents = JSON.parse(packageContentsFile)
  } catch (error) {
    log('Unable to load package.json', 'error')
  }

  if (typeof packageContents.name !== 'string') {
    log('Missing "name" field in package.json', 'error')
  }

  let result: Options = defaultOptions(packageContents)

  try {
    result.reactNativeVersion = JSON.parse(
      readFileSync(join(basePath(), 'node_modules/react-native/package.json'), 'utf8')
    ).version
  } catch (error) {
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
