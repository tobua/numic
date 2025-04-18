import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import merge from 'deepmerge'
import json5 from 'json5'
import { formatPackageJson } from 'pakag'
import parse from 'parse-gitignore'
import { filterPluginIgnores, userGitignore } from './configuration/gitignore'
import { packageJson } from './configuration/package'
import { basePath, options } from './helper'

export const configureTsConfig = () => {
  const tsconfigPath = join(basePath(), 'tsconfig.json')
  const rnTsconfigPath = join(basePath(), 'node_modules/@react-native/typescript-config/tsconfig.json')

  if (!options().typescript) {
    return
  }

  let configuration: any = {}

  if (existsSync(tsconfigPath)) {
    try {
      configuration = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    } catch (_error) {
      // Ignored
    }
  }

  // Properties from package.json tsconfig property.
  const tsconfig = options().tsconfig
  if (tsconfig) {
    configuration = merge(configuration, tsconfig, {
      clone: false,
      // Assumes all arrays in tsconfig.json are arrays of strings.
      arrayMerge: (target, source) => {
        const merged = target.concat(source)
        return [...new Set(merged)]
      },
    })
  }

  // Always extend RN config.
  configuration.extends = '@react-native/typescript-config/tsconfig.json'

  if (typeof configuration.compilerOptions !== 'object') {
    configuration.compilerOptions = {}
  }

  // Make sure extended properties aren't duplicated.
  try {
    const extendedProperties = json5.parse(readFileSync(rnTsconfigPath, 'utf-8'))

    // Avoid duplicate values.
    for (const key of Object.keys(configuration.compilerOptions)) {
      if (key !== 'skipLibCheck' && configuration.compilerOptions[key] === extendedProperties.compilerOptions[key]) {
        delete configuration.compilerOptions[key]
      }
    }

    if (Array.isArray(configuration.exclude)) {
      configuration.exclude = configuration.exclude.filter((item: string) => !extendedProperties.exclude.includes(item))

      if (configuration.exclude.length === 0) {
        configuration.exclude = undefined
      }
    }
  } catch (_error) {
    // Ignored
  }

  if (typeof configuration.compilerOptions.module === 'undefined') {
    configuration.compilerOptions.module = 'ESNext' // RN default is ES2015??
  }

  writeFileSync(tsconfigPath, JSON.stringify(configuration, null, 2))
}

export const configureGitignore = () => {
  const gitIgnorePath = join(basePath(), '.gitignore')
  let entries: string[] = []

  if (existsSync(gitIgnorePath)) {
    // @ts-ignore Types published in @types/parse-gitignore are wrong.
    entries = filterPluginIgnores(entries.concat(parse(readFileSync(gitIgnorePath, 'utf8')).patterns))
  }

  entries = entries.concat(userGitignore())

  // Remove duplicates, add empty line at the end.
  entries = Array.from(new Set(entries)).concat('')

  writeFileSync(gitIgnorePath, entries.join('\r\n'))
}

const configurePackageJson = async (isFirstInstall: boolean) => {
  const packageJsonContents = options().pkg
  let generatedPackageJson = packageJson(isFirstInstall)

  // Merge existing configuration with additional required attributes.
  // Existing properties override generated configuration to allow
  // the user to configure it their way.
  generatedPackageJson = merge(packageJsonContents, generatedPackageJson, {
    clone: false,
  })

  // Format with prettier and sort before writing.
  writeFileSync(join(basePath(), './package.json'), await formatPackageJson(JSON.stringify(generatedPackageJson)))

  options().pkg = generatedPackageJson

  return packageJsonContents.dependencies?.['zero-configuration'] || packageJsonContents.devDependencies?.['zero-configuration']
}

export const configure = async () => {
  const isFirstInstall = !existsSync(join(basePath(), 'patch/current.patch'))

  const separateConfiguration = await configurePackageJson(isFirstInstall)

  if (!separateConfiguration) {
    configureGitignore()
    configureTsConfig()
  }
}
