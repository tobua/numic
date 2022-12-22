import { options } from '../helper'

// TODO up-to-date with current template?
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
  // Automatically generated along with pods
  'Podfile.lock',
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

export const pluginGitignore = () => pluginGitignores.join('\r\n')
