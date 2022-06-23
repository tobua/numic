import { options } from '../options'

export const gitignore = () => {
  let entries = ['node_modules', 'package-lock.json', 'tsconfig.json', '.numic', 'android', 'ios']

  const fromPackage = options().gitignore

  if (fromPackage && Array.isArray(fromPackage) && fromPackage.length > 0) {
    // TODO this bug exists in squak!
    entries = entries.concat(fromPackage)
  }

  return entries
}
