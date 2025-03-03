import { afterEach, beforeEach, expect, spyOn, test } from 'bun:test'
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import getPixels from 'get-pixels'
import { environment, listFilesMatching, packageJson, prepare, readFile, registerVitest } from 'jest-fixture'
import plugin from '../index'

const initialCwd = process.cwd()

registerVitest(beforeEach, afterEach, { spyOn })

environment('logo')

const filePath = (fileName: string) => join(process.cwd(), fileName)

test('Creates logos in various sizes.', async () => {
  prepare([packageJson('logo')])

  cpSync(join(initialCwd, 'test/logo.png'), filePath('logo.png'))
  mkdirSync(filePath('ios/numic/Images.xcassets'), { recursive: true })

  expect(existsSync(filePath('logo.png'))).toBe(true)

  await plugin({})

  const files = listFilesMatching('**/*.png')

  expect(files.length).toBe(19)
  expect(files.includes('android/app/src/main/res/mipmap-mdpi/ic_launcher.png')).toBe(true)
  expect(files.includes('android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png')).toBe(true)
  expect(files.includes('ios/numic/Images.xcassets/AppIcon.appiconset/Icon-80.png')).toBe(true)

  const iosContentsPath = filePath('ios/numic/Images.xcassets/AppIcon.appiconset/Contents.json')

  expect(existsSync(iosContentsPath)).toBe(true)

  const iconContentsSpecification = readFile(iosContentsPath)

  expect(iconContentsSpecification.images[0].filename).toBe('Icon-40.png')
})

test('Icon path can be configured.', async () => {
  prepare([packageJson('logo-configured')])

  cpSync(join(initialCwd, 'test/logo.png'), filePath('icon/my-image.png'), { recursive: true })
  mkdirSync(filePath('ios/numic/Images.xcassets'), { recursive: true })

  expect(existsSync(filePath('icon/my-image.png'))).toBe(true)

  await plugin({ options: { icon: { icon: 'icon/my-image.png' } } })

  const files = listFilesMatching('**/*.png')

  expect(files.length).toBe(19)
})

test('Native output folder can be configured.', async () => {
  prepare([packageJson('logo-native')])

  const logoPath = filePath('logo.png')

  cpSync(join(initialCwd, 'test/logo.png'), logoPath)
  mkdirSync(filePath('.numic/ios/numic/Images.xcassets'), { recursive: true })

  expect(existsSync(logoPath)).toBe(true)

  await plugin({ nativePath: join(process.cwd(), '.numic') })

  const files = listFilesMatching('**/*.png')

  expect(files.length).toBe(19)
  expect(files.includes('.numic/android/app/src/main/res/mipmap-mdpi/ic_launcher.png')).toBe(true)
  expect(files.includes('.numic/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png')).toBe(true)
  expect(files.includes('.numic/ios/numic/Images.xcassets/AppIcon.appiconset/Icon-80.png')).toBe(true)
})

test('Also works with svg input file.', async () => {
  prepare([packageJson('logo-svg')])

  const logoPath = filePath('logo.svg')

  cpSync(join(initialCwd, 'test/logo.svg'), logoPath)
  mkdirSync(filePath('ios/numic/Images.xcassets'), { recursive: true })

  expect(existsSync(logoPath)).toBe(true)

  await plugin({ options: { icon: { icon: 'logo.svg' } } })

  const files = listFilesMatching('**/*.png')

  expect(files.length).toBe(18)
  expect(files.includes('android/app/src/main/res/mipmap-mdpi/ic_launcher.png')).toBe(true)
  expect(files.includes('android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png')).toBe(true)
  expect(files.includes('ios/numic/Images.xcassets/AppIcon.appiconset/Icon-80.png')).toBe(true)
})

test('Automatically finds svg in default paths.', async () => {
  prepare([packageJson('logo-svg-default')])

  const logoPath = filePath('app-icon.svg')

  cpSync(join(initialCwd, 'test/logo.svg'), logoPath)
  mkdirSync(filePath('ios/numic/Images.xcassets'), { recursive: true })

  expect(existsSync(logoPath)).toBe(true)

  await plugin({})

  const files = listFilesMatching('**/*.png')

  expect(files.length).toBe(18)
  expect(files.includes('android/app/src/main/res/mipmap-mdpi/ic_launcher.png')).toBe(true)
  expect(files.includes('android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png')).toBe(true)
  expect(files.includes('ios/numic/Images.xcassets/AppIcon.appiconset/Icon-80.png')).toBe(true)
})

test('iOS background transparency can be configured.', async () => {
  prepare([packageJson('logo-ios-background')])

  const white = '#FFFFFF'
  const black = '#000000'

  const logoPath = filePath('icon.png')

  cpSync(join(initialCwd, 'test/logo.png'), logoPath)
  mkdirSync(filePath('ios/numic/Images.xcassets'), { recursive: true })

  expect(existsSync(logoPath)).toBe(true)

  await plugin({})

  const someIosIcon = filePath('ios/numic/Images.xcassets/AppIcon.appiconset/Icon-80.png')

  expect(existsSync(someIosIcon)).toBe(true)
  let pixels = await new Promise<number[]>((done) => {
    getPixels(someIosIcon, (_, currentPixels: any) => done(currentPixels.data))
  })

  expect(pixels[0]).toBe(255) // Red
  expect(pixels[1]).toBe(255) // Green
  expect(pixels[2]).toBe(255) // Blue
  expect(pixels[3]).toBe(255) // Alpha (transparency)

  await plugin({
    options: {
      icon: {
        iOSBackground: black,
      },
    },
  })

  pixels = await new Promise<number[]>((done) => {
    getPixels(someIosIcon, (_, currentPixels: any) => done(currentPixels.data))
  })

  expect(pixels[0]).toBe(0) // Red
  expect(pixels[1]).toBe(0) // Green
  expect(pixels[2]).toBe(0) // Blue
  expect(pixels[3]).toBe(255) // Alpha (transparency)

  await plugin({
    options: {
      icon: {
        iOSBackground: white,
      },
    },
  })

  pixels = await new Promise<number[]>((done) => {
    getPixels(someIosIcon, (_, currentPixels: any) => done(currentPixels.data))
  })

  expect(pixels[0]).toBe(255) // Red
  expect(pixels[1]).toBe(255) // Green
  expect(pixels[2]).toBe(255) // Blue
  expect(pixels[3]).toBe(255) // Alpha (transparency)
})
