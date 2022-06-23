import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import formatJson from 'pakag'
import merge from 'deepmerge'
import parse from 'parse-gitignore'
import { basePath } from './helper'
import { options } from './options'
import { gitignore } from './configuration/gitignore'
import { packageJson } from './configuration/package'

export const configureGitignore = () => {
  const gitIgnorePath = join(basePath(), '.gitignore')
  let entries: string[] = []

  if (existsSync(gitIgnorePath)) {
    // TODO apply in squak!
    entries = entries.concat(parse(readFileSync(gitIgnorePath, 'utf8')).patterns)
  }

  entries = entries.concat(gitignore())

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
  generatedPackageJson = merge(generatedPackageJson, packageJsonContents, {
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
}
