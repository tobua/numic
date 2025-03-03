import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
// Alternative in Rust: https://github.com/silvia-odwyer/photon
import sharp from 'sharp'
import { generateAndroidAdaptiveIcons } from './adaptive-icon'
import { contentsWithLinks } from './ios'
import type { Log, Options } from './types'

type Input = {
  // Location of the project that has installed the plugin.
  projectPath?: string
  // Location of the /android and /ios folder where changes should be applied.
  nativePath?: string
  log?: Log
  options?: { icon: Options }
}

const iconSourcePaths = (projectPath: string) => [
  join(projectPath, 'icon.png'),
  join(projectPath, 'app-icon.png'),
  join(projectPath, 'asset/icon.png'),
  join(projectPath, 'logo.png'),
  join(projectPath, 'icon.svg'),
  join(projectPath, 'app-icon.svg'),
  join(projectPath, 'asset/icon.svg'),
  join(projectPath, 'logo.svg'),
]

const getInput = (projectPath: string, options: { icon?: string }) => {
  if (typeof options === 'object' && typeof options.icon === 'string' && existsSync(join(projectPath, options.icon))) {
    return join(projectPath, options.icon)
  }

  const paths = iconSourcePaths(projectPath)
  let match: string | undefined

  for (const path of paths) {
    if (!match && existsSync(path)) {
      match = path
    }
  }

  return match
}

const getAndroidFolders = () => [
  { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png', size: 48 },
  { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png', size: 72 },
  { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', size: 96 },
  { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', size: 144 },
  { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', size: 192 },
  // Round icons.
  { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', size: 48, round: true },
  { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', size: 72, round: true },
  { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', size: 96, round: true },
  { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', size: 144, round: true },
  { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', size: 192, round: true },
]

const getIosFolders = (iosImageDirectory?: string) => {
  if (!iosImageDirectory) {
    return []
  }

  return [
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-40.png`, size: 40 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-58.png`, size: 58 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-60.png`, size: 60 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-80.png`, size: 80 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-87.png`, size: 87 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-120.png`, size: 120 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-180.png`, size: 180 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-1024.png`, size: 1024 },
  ]
}

const getSizes = (nativePath: string, log: Log) => {
  const iosDirectories = readdirSync(join(nativePath, 'ios'), { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .filter((dirent) => existsSync(join(nativePath, 'ios', dirent.name, 'Images.xcassets')))
    .map((dirent) => dirent.name)
  const iosImageDirectory = iosDirectories.length > 0 ? join('ios', iosDirectories[0] ?? '', 'Images.xcassets') : undefined

  if (!iosImageDirectory) {
    log('iOS project directory with "Images.xcassets" not found', 'warning')
  }

  return {
    android: getAndroidFolders(),
    ios: getIosFolders(iosImageDirectory),
    iosDirectory: iosImageDirectory,
  }
}

export default async ({
  projectPath = process.cwd(),
  nativePath = process.cwd(),
  // eslint-disable-next-line no-console
  log = console.log,
  options = { icon: {} },
}: Input) => {
  const iconOptions = options.icon ?? {}
  const inputFile = getInput(projectPath, iconOptions)
  const sizes = getSizes(nativePath, log)

  if (!inputFile) {
    return log(`No icon image found in ${join(projectPath, iconOptions.icon ?? 'icon.png')} or any other default path`, 'warning')
  }

  const androidPromises = sizes.android.map((icon) => {
    const destinationFile = join(nativePath, icon.path)
    const directory = dirname(destinationFile)
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true })
    }
    return sharp(inputFile).resize(icon.size, icon.size).toFile(destinationFile)
  })

  await Promise.all(androidPromises)

  await generateAndroidAdaptiveIcons(nativePath, projectPath, iconOptions, log)

  const iosPromises = sizes.ios.map((icon) => {
    const destinationFile = join(nativePath, icon.path)
    const directory = dirname(destinationFile)
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true })
    }
    // iOS doesn't support transparent icons and will add a black background, this plugin by default adds a white background.
    return sharp(inputFile)
      .flatten({ background: iconOptions.iOSBackground ?? '#FFFFFF' })
      .resize(icon.size, icon.size)
      .toFile(destinationFile)
  })

  await Promise.all(iosPromises)

  if (sizes.iosDirectory) {
    // Link ios icons in Contents.json.
    writeFileSync(join(nativePath, sizes.iosDirectory, 'AppIcon.appiconset/Contents.json'), JSON.stringify(contentsWithLinks, null, 2))
  }
}
