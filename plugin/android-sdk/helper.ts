import { readdirSync } from 'node:fs'
import { join } from 'node:path'

export function latestSdkManagerPath(androidHome: string) {
  const toolsPath = join(androidHome.trim(), 'cmdline-tools')
  const versions = readdirSync(toolsPath).filter((dir) => dir.includes('latest') || /^\d+\.\d+(\.\d+)?$/.test(dir))

  if (versions.length === 0) {
    throw new Error('No SDK versions found')
  }

  // Sort versions and get the latest
  const latestVersion = versions.sort((a, b) => {
    const versionA = a.includes('latest') ? '9999.9999.9999' : a // Assign a high value to 'latest'
    const versionB = b.includes('latest') ? '9999.9999.9999' : b
    return versionB.localeCompare(versionA, undefined, { numeric: true })
  })[0]

  return join('cmdline-tools', latestVersion ?? 'latest', 'bin', 'sdkmanager')
}

export function latestNdkVersion(androidHome: string) {
  const ndkPath = join(androidHome.trim(), 'ndk')
  const versions = readdirSync(ndkPath).filter((dir) => /^\d+\.\d+(\.\d+)?$/.test(dir))

  if (versions.length === 0) {
    throw new Error('No NDK versions found')
  }

  const latestVersion = versions.sort((a, b) => {
    return b.localeCompare(a, undefined, { numeric: true })
  })[0]

  return latestVersion
}
