import { readFileSync } from 'fs'
import { join } from 'path'
import merge from 'deepmerge'
import { basePath, log } from './helper'
import { Options, Package } from './types'

// Default options.
const defaultOptions = (pkg: Package) => ({
  pkg,
})

// TODO memoize
export const options: () => Options = () => {
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

  if (typeof packageContents.numic === 'object') {
    // Include project specific overrides
    result = merge(result, packageContents.numic, { clone: false })
  }

  return result
}
