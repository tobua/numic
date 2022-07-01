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

export const nativeGitignore = `# Xcode
build/
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata
*.xccheckout
*.moved-aside
DerivedData
*.hmap
*.ipa
*.xcuserstate

# Android/IntelliJ
build/
.idea
.gradle
local.properties
*.iml

# CocoaPods
/ios/Pods/
# Automatically generated
Podfile.lock`
