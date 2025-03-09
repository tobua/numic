import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import svg2vectordrawable from 'svg2vectordrawable'
import type { Log, Options } from './types'

const androidXmlFiles = () => [
  {
    path: 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    contents: `<?xml version="1.0" encoding="utf-8"?>
  <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
      <background android:drawable="@drawable/ic_launcher_background" />
      <foreground android:drawable="@drawable/ic_launcher_foreground" />
  </adaptive-icon>`,
  },
  {
    path: 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    contents: `<?xml version="1.0" encoding="utf-8"?>
  <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
      <background android:drawable="@drawable/ic_launcher_background" />
      <foreground android:drawable="@drawable/ic_launcher_foreground" />
  </adaptive-icon>`,
  },
]

const solidBackgroundVector = (color: string) => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FF${color}"
        android:pathData="M0 0h108v108H0z"/>
</vector>`

// Options see https://www.npmjs.com/package/svg2vectordrawable
const convertSvg = (svgContents: string) => svg2vectordrawable(svgContents, { xmlTag: true })

export const getFileType = (fileName?: string) => extname(fileName ?? '').replace('.', '')

const writeResFile = (nativePath: string, path: string, contents: string) => {
  const destinationFile = join(nativePath, 'android/app/src/main/res', path)
  const directory = dirname(destinationFile)
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true })
  }
  writeFileSync(destinationFile, contents)
}

export const generateAndroidAdaptiveIcons = async (nativePath: string, projectPath: string, options: Options, log: Log) => {
  const xmlFiles = androidXmlFiles()

  if (!(options.androidForeground && (options.androidBackground || options.androidBackgroundColor))) {
    log('Not creating adaptive icons for Android')
    return
  }

  const foregroundType = getFileType(options.androidForeground)
  const backgroundType = !options.androidBackgroundColor && getFileType(options.androidBackground)

  if (foregroundType !== 'svg' && foregroundType !== 'xml') {
    log('"androidForeground" invalid, .svg or .xml file required')
  }

  if (!options.androidBackgroundColor && backgroundType !== 'svg' && backgroundType !== 'xml') {
    log('"androidBackground" invalid, .svg or .xml file required')
  }

  // Create importing files.
  for (const file of xmlFiles) {
    const destinationFile = join(nativePath, file.path)
    const directory = dirname(destinationFile)
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true })
    }
    writeFileSync(destinationFile, file.contents)
  }

  if (foregroundType === 'svg') {
    const foregroundSvgContents = readFileSync(join(projectPath, options.androidForeground), 'utf-8')
    const foregroundVector = await convertSvg(foregroundSvgContents)
    writeResFile(nativePath, 'drawable-v24/ic_launcher_foreground.xml', foregroundVector)
  }

  if (foregroundType === 'xml') {
    const foregroundXmlContents = readFileSync(join(projectPath, options.androidForeground), 'utf-8')
    writeResFile(nativePath, 'drawable-v24/ic_launcher_foreground.xml', foregroundXmlContents)
  }

  if (!options.androidBackgroundColor && backgroundType === 'svg') {
    const backgroundSvgContents = readFileSync(join(projectPath, options.androidBackground as string), 'utf-8')
    const backgroundVector = await convertSvg(backgroundSvgContents)
    writeResFile(nativePath, 'drawable/ic_launcher_background.xml', backgroundVector)
  }

  if (!options.androidBackgroundColor && backgroundType === 'xml') {
    const backgroundXmlContents = readFileSync(join(projectPath, options.androidBackground as string), 'utf-8')
    writeResFile(nativePath, 'drawable/ic_launcher_background.xml', backgroundXmlContents)
  }

  if (options.androidBackgroundColor) {
    // Currently only hex colors allowed.
    const color = options.androidBackgroundColor.replace('#', '')
    writeResFile(nativePath, 'drawable/ic_launcher_background.xml', solidBackgroundVector(color))
  }
}
