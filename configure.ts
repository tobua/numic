import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import formatJson from 'pakag'
import merge from 'deepmerge'
import parse from 'parse-gitignore'
import { basePath } from './helper'
import { options } from './options'
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
    configuration = merge(configuration, options().tsconfig, { clone: false })
  }

  // Always extend RN config.
  configuration.extends = '@tsconfig/react-native/tsconfig.json'

  if (typeof configuration.compilerOptions !== 'object') {
    configuration.compilerOptions = {}
  }

  // Make sure extended properties aren't duplicated.
  try {
    const extendedProperties = JSON.parse(readFileSync(rnTsconfigPath, 'utf-8'))

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
        (item: string) => !extendedProperties.exclude.includes(item)
      )

      if (configuration.exclude.length === 0) {
        delete configuration.exclude
      }
    }
  } catch (error) {
    // Ignored
  }

  // Enabled by default in template but not shared configuration, set to false can slow down checking a lot.
  if (typeof configuration.compilerOptions.skipLibCheck === 'undefined') {
    configuration.compilerOptions.skipLibCheck = true
  }

  writeFileSync(tsconfigPath, JSON.stringify(configuration, null, 2))
}

export const configureGitignore = () => {
  const gitIgnorePath = join(basePath(), '.gitignore')
  let entries: string[] = []

  if (existsSync(gitIgnorePath)) {
    entries = filterPluginIgnores(
      entries.concat(parse(readFileSync(gitIgnorePath, 'utf8')).patterns)
    )
  }

  entries = entries.concat(userGitignore())

  // Remove duplicates, add empty line at the end.
  entries = Array.from(new Set(entries)).concat('')

  writeFileSync(gitIgnorePath, entries.join('\r\n'))
}

export const configurePackageJson = () => {
  const packageJsonContents = options().pkg
  let generatedPackageJson = packageJson()

  // Merge existing configuration with additional required attributes.
  // Existing properties override generated configuration to allow
  // the user to configure it their way.
  generatedPackageJson = merge(packageJsonContents, generatedPackageJson, {
    clone: false,
  })

  // Format with prettier and sort before writing.
  writeFileSync(
    join(basePath(), './package.json'),
    formatJson(JSON.stringify(generatedPackageJson))
  )

  options().pkg = generatedPackageJson
}

export const configure = () => {
  configurePackageJson()
  configureGitignore()
  configureTsConfig()
}
