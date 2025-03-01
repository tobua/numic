import semverSort from 'semver-sort'

// NOTE No longer used, can differ from compile and target SDK version.
const findPlatformTools = (sdkManagerListOutput: string) => {
  const matches = [...sdkManagerListOutput.matchAll(/platform-tools\s*\|\s(\d{1,3})/g)]

  if (!(matches && Array.isArray(matches))) {
    return undefined
  }

  // Newest version first.
  const sortedVersions = matches
    .map((match) => Number(match[1]))
    .sort()
    .reverse()

  // Only major version required.
  return sortedVersions[0]
}

const currentMajorAndroidVersion = '35'

const findNewestBuildToolsVersion = (sdkManagerListOutput: string) => {
  const matches = [...sdkManagerListOutput.matchAll(/build-tools;(\d{1,3}\.\d{1,3}\.\d{1,10})/g)]

  if (!(matches && Array.isArray(matches))) {
    return currentMajorAndroidVersion
  }

  const availableVersions = matches.map((match) => match[1]).filter((match) => typeof match === 'string')

  // Newest version first.
  const sortedVersions = semverSort.desc(availableVersions)

  return sortedVersions[0] ?? currentMajorAndroidVersion
}

const getMajorFromVersion = (version: string) => {
  const [major] = version.split('.')
  return Number.parseInt(major ?? '0', 10)
}

export const matchVersion = (sdkManagerListOutput: string) => {
  const buildToolsVersion = findNewestBuildToolsVersion(sdkManagerListOutput)
  const majorSdkVersion = getMajorFromVersion(buildToolsVersion)

  return {
    buildToolsVersion: buildToolsVersion,
    compileSdkVersion: majorSdkVersion,
    targetSdkVersion: majorSdkVersion,
  }
}
