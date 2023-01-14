import { EOL } from 'node:os'
import { options } from '../helper'

const pluginGitignores = [
  // XCode
  'build/',
  '*.pbxuser',
  '!default.pbxuser',
  '*.mode1v3',
  '!default.mode1v3',
  '*.mode2v3',
  '!default.mode2v3',
  '*.perspectivev3',
  '!default.perspectivev3',
  'xcuserdata',
  '*.xccheckout',
  '*.moved-aside',
  'DerivedData',
  '*.hmap',
  '*.ipa',
  '*.xcuserstate',
  'ios/.xcode.env.local',
  // Android/IntelliJ
  'build/',
  '.idea',
  '.gradle',
  'local.properties',
  '*.iml',
  '*.hprof',
  '*.keystore',
  '!debug.keystore',
  // Cocoapods (generated with pod install / update)
  '/ios/Pods/',
  '/vendor/bundle/',
  // Automatically generated along with pods
  'Podfile.lock',
  // macOS cache files.
  '.DS_Store',
  // Various
  '*.jsbundle',
  // Warnings automatically generated when project opened in XCode.
  'IDEWorkspaceChecks.plist',
]

const userGitignores = ['android', 'ios', '.numic', 'node_modules', 'package-lock.json']

export const userGitignore = () => {
  let entries = [...userGitignores]

  if (options().typescript) {
    entries.push('/tsconfig.json')
  }

  const fromPackage = options().gitignore

  if (fromPackage && Array.isArray(fromPackage) && fromPackage.length > 0) {
    entries = entries.concat(fromPackage)
  }

  return entries
}

// Remove unnecessary RN default ignores that apply to native folders that are ignored anyways.
export const filterPluginIgnores = (input: string[]) =>
  input.filter((element) => !pluginGitignores.includes(element))

export const pluginGitignore = () => {
  let gitignoreEntries = pluginGitignores

  if (typeof options().nativeGitignore === 'string') {
    gitignoreEntries.push(options().nativeGitignore as string)
  } else if (Array.isArray(options().nativeGitignore)) {
    gitignoreEntries = gitignoreEntries.concat(options().nativeGitignore)
  }

  return gitignoreEntries.join(EOL)
}
