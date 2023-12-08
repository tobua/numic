import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { formatPackageJson } from 'pakag'
import merge from 'deepmerge'
import parse from 'parse-gitignore'
import { parse as parseJsonWithComments } from 'json5'
import { basePath, options } from './helper'
import { userGitignore, filterPluginIgnores } from './configuration/gitignore'
import { packageJson } from './configuration/package'

export const configureTsConfig = () => {
  const tsconfigPath = join(basePath(), 'tsconfig.json')
  const rnTsconfigPath = join(basePath(), 'node_modules/@tsconfig/react-native/tsconfig.json')

  if (!options().typescript) {
    return
  }

  let configuration: any = {}

  if (existsSync(tsconfigPath)) {
    try {
      configuration = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    } catch (error) {
      // Ignored
    }
  }

  // Properties from package.json tsconfig property.
  if (options().tsconfig) {
    configuration = merge(configuration, options().tsconfig, {
      clone: false,
      // Assumes all arrays in tsconfig.json are arrays of strings.
      arrayMerge: (target, source) => {
        const merged = target.concat(source)
        return [...new Set(merged)]
      },
    })
  }

  // Always extend RN config.
  configuration.extends = '@tsconfig/react-native/tsconfig.json'

  if (typeof configuration.compilerOptions !== 'object') {
    configuration.compilerOptions = {}
  }

  // Make sure extended properties aren't duplicated.
  try {
    const extendedProperties = parseJsonWithComments(readFileSync(rnTsconfigPath, 'utf-8'))

    // Avoid duplicate values.
    Object.keys(configuration.compilerOptions).forEach((key) => {
      if (
        key !== 'skipLibCheck' &&
        configuration.compilerOptions[key] === extendedProperties.compilerOptions[key]
      ) {
        delete configuration.compilerOptions[key]
      }
    })

    if (Array.isArray(configuration.exclude)) {
      configuration.exclude = configuration.exclude.filter(
        (item: string) => !extendedProperties.exclude.includes(item),
      )

      if (configuration.exclude.length === 0) {
        delete configuration.exclude
      }
    }
  } catch (error) {
    // Ignored
  }

  // Base package in our setup is ESM, type: module.
  if (typeof configuration.compilerOptions.module === 'undefined') {
    configuration.compilerOptions.module = 'NodeNext'
  }

  // Avoid the need to add (.js) file endings (already handled by Metro bundler).
  // Currently set to NodeNext in official React Native TypeScript Configuration.
  if (typeof configuration.compilerOptions.moduleResolution === 'undefined') {
    configuration.compilerOptions.moduleResolution = 'node'
  }

  writeFileSync(tsconfigPath, JSON.stringify(configuration, null, 2))
}

export const configureGitignore = () => {
  const gitIgnorePath = join(basePath(), '.gitignore')
  let entries: string[] = []

  if (existsSync(gitIgnorePath)) {
    entries = filterPluginIgnores(
      entries.concat(parse(readFileSync(gitIgnorePath, 'utf8')).patterns),
    )
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
  writeFileSync(
    join(basePath(), './package.json'),
    await formatPackageJson(JSON.stringify(generatedPackageJson)),
  )

  options().pkg = generatedPackageJson
}

export const configure = async () => {
  const isFirstInstall = !existsSync(join(basePath(), 'patch/current.patch'))

  await configurePackageJson(isFirstInstall)
  configureGitignore()
  configureTsConfig()
}
