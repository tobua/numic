import { expect, test } from 'bun:test'
import Bun from 'bun'
import { matchVersion } from '../match-version'

test('Extracts the correct versions for various script outputs.', async () => {
  const initialMacScriptOutput = await Bun.file('test/script/initial-mac-installed.txt').text()
  const { buildToolsVersion, compileSdkVersion, targetSdkVersion } = matchVersion(initialMacScriptOutput)

  expect(buildToolsVersion).toEqual('33.0.1')
  expect(compileSdkVersion).toBe(33)
  expect(targetSdkVersion).toBe(33)
})

test('Extracts the correct versions for Android 15.', async () => {
  const macScriptOutput = await Bun.file('test/script/15-mac-installed.txt').text()
  const { buildToolsVersion, compileSdkVersion, targetSdkVersion } = matchVersion(macScriptOutput)

  expect(buildToolsVersion).toEqual('35.0.0')
  expect(compileSdkVersion).toBe(35)
  expect(targetSdkVersion).toBe(35)
})

test('Extracts the correct versions for Android 14.', async () => {
  const macScriptOutput = await Bun.file('test/script/14-mac-installed.txt').text()
  const { buildToolsVersion, compileSdkVersion, targetSdkVersion } = matchVersion(macScriptOutput)

  expect(buildToolsVersion).toEqual('34.0.0')
  expect(compileSdkVersion).toBe(34)
  expect(targetSdkVersion).toBe(34)
})

test('Extracts the correct versions for Android 14.', async () => {
  const macScriptOutput = await Bun.file('test/script/q2-2024-installed.txt').text()
  const { buildToolsVersion, compileSdkVersion, targetSdkVersion } = matchVersion(macScriptOutput)

  expect(buildToolsVersion).toEqual('34.0.0')
  expect(compileSdkVersion).toBe(34)
  expect(targetSdkVersion).toBe(34)
})

test('Extracts the correct versions for Android 15.', async () => {
  const macScriptOutput = await Bun.file('test/script/q3-2024-installed.txt').text()
  const { buildToolsVersion, compileSdkVersion, targetSdkVersion } = matchVersion(macScriptOutput)

  expect(buildToolsVersion).toEqual('35.0.0')
  expect(compileSdkVersion).toBe(35)
  expect(targetSdkVersion).toBe(35)
})

test('Extracts the correct versions for Android 16.', async () => {
  const macScriptOutput = await Bun.file('test/script/q2-2025-installed.txt').text()
  const { buildToolsVersion, compileSdkVersion, targetSdkVersion } = matchVersion(macScriptOutput)

  expect(buildToolsVersion).toEqual('36.0.0')
  expect(compileSdkVersion).toBe(36)
  expect(targetSdkVersion).toBe(36)
})

test('Extracts the correct versions for Android 16 (released).', async () => {
  const macScriptOutput = await Bun.file('test/script/q3-2025-installed.txt').text()
  const { buildToolsVersion, compileSdkVersion, targetSdkVersion } = matchVersion(macScriptOutput)

  expect(buildToolsVersion).toEqual('36.0.0')
  expect(compileSdkVersion).toBe(36)
  expect(targetSdkVersion).toBe(36)
})
