import { mkdirSync, cpSync } from 'fs'
import { join } from 'path'
import { expect, test, beforeEach, afterEach, vi } from 'vitest'
import {
  prepare,
  environment,
  packageJson,
  file,
  contentsForFilesMatching,
  readFile,
} from 'jest-fixture'
import { configure } from '../configure'
import { resetOptions } from '../options'

const initialCwd = process.cwd()

// @ts-ignore
global.jest = { spyOn: vi.spyOn }
// @ts-ignore
global.beforeEach = beforeEach
// @ts-ignore
global.afterEach = afterEach

beforeEach(resetOptions)

environment('configuration')

const reactNativePkg = file('node_modules/react-native/package.json', '{ "version": "0.69.0" }')

test('Properly configures empty project.', async () => {
  prepare([packageJson('empty'), file('index.js', "console.log('Hello')"), reactNativePkg])

  configure()

  const contents = contentsForFilesMatching('*.json')
  expect(contents[0].name).toBe('package.json')
  const packageContents = contents[0].contents as any

  expect(packageContents.scripts.lint).toBe('numic lint')
  expect(packageContents.scripts.ios).toBe('numic ios')
  expect(packageContents.scripts.android).toBe('numic android')
  expect(packageContents.prettier).toContain('prettierrc')
  expect(packageContents.eslintConfig.extends).toContain('eslintrc')

  // No tsconfig generated
  expect(contents.length === 1).toBe(true)
})

test('Properly adapts existing scripts.', async () => {
  prepare([
    packageJson('empty', {
      scripts: { lint: 'my-custom-eslint', android: 'react-native run-android' },
    }),
    reactNativePkg,
  ])

  configure()

  const contents = contentsForFilesMatching('*.json')
  expect(contents[0].name).toBe('package.json')
  const packageContents = contents[0].contents as any

  expect(packageContents.scripts.lint).not.toContain('numic')
  expect(packageContents.scripts.android).toContain('numic')
  // TODO override eslint and prettier only if they still match initial contents.
})

test('Adds new entries to gitignore.', async () => {
  prepare([packageJson('ignore'), reactNativePkg])

  configure()

  const contents = contentsForFilesMatching('.*')
  expect(contents[0].name).toBe('.gitignore')
  const gitignoreContents = contents[0].contents as any

  expect(gitignoreContents).toContain('.numic')
  expect(gitignoreContents).toContain('node_modules')
  expect(gitignoreContents).toContain('package-lock.json')
  expect(gitignoreContents).not.toContain('tsconfig.json')
})

test('Adds new entries to gitignore.', async () => {
  prepare([packageJson('ignore-package', { numic: { gitignore: ['my-folder'] } }), reactNativePkg])

  configure()

  const contents = contentsForFilesMatching('.*')
  expect(contents[0].name).toBe('.gitignore')
  const gitignoreContents = contents[0].contents as any

  expect(gitignoreContents).toContain('my-folder')
})

test('No duplicates are added.', async () => {
  prepare([
    packageJson('ignore-duplicates', { numic: { gitignore: ['node_modules'] } }),
    file('.gitignore', `node_modules`),
    reactNativePkg,
  ])

  configure()

  const contents = contentsForFilesMatching('.*')
  expect(contents[0].name).toBe('.gitignore')
  const gitignoreContents = contents[0].contents as any

  expect(gitignoreContents).toContain('node_modules')
  const occurrences = gitignoreContents.split('node_modules').length
  expect(occurrences).toBe(2)
})

test('Default native ignores from template are removed.', async () => {
  prepare([
    packageJson('ignore-duplicates'),
    file(
      '.gitignore',
      `build/\r\n*.mode1v3\r\nlocal.properties\r\nlocal.properties\r\nnode_modules/`
    ),
    reactNativePkg,
  ])

  configure()

  const contents = contentsForFilesMatching('.*')
  expect(contents[0].name).toBe('.gitignore')
  const gitignoreContents = contents[0].contents as any

  expect(gitignoreContents).toContain('node_modules')
  expect(gitignoreContents).toContain('node_modules/')
  expect(gitignoreContents).toContain('android')
  expect(gitignoreContents).not.toContain('build/')
  expect(gitignoreContents).not.toContain('*.mode1v3')
  expect(gitignoreContents).not.toContain('local.properties')
})

test('Properly configures empty project.', async () => {
  prepare([packageJson('empty'), file('index.js', "console.log('Hello')"), reactNativePkg])

  configure()

  const contents = contentsForFilesMatching('*.json')
  expect(contents[0].name).toBe('package.json')
  const packageContents = contents[0].contents as any

  expect(packageContents.scripts.lint).toBeDefined()
  expect(packageContents.prettier).toContain('prettierrc')
  expect(packageContents.eslintConfig.extends).toContain('eslintrc')
})

test('Properly configures typescript when dependency detected.', async () => {
  prepare([
    packageJson('typescript', { devDependencies: { typescript: '^4.4.4' } }),
    reactNativePkg,
  ])

  mkdirSync(join(process.cwd(), 'node_modules/@tsconfig/react-native'), { recursive: true })
  cpSync(
    join(initialCwd, 'node_modules/@tsconfig/react-native'),
    join(process.cwd(), 'node_modules/@tsconfig/react-native'),
    { recursive: true }
  )

  configure()

  const contents = contentsForFilesMatching('*.json')
  expect(contents[1].name).toBe('tsconfig.json')
  const tsconfigContents = contents[1].contents as any

  const gitignoreContents = readFile('.gitignore')
  expect(gitignoreContents).toContain('tsconfig.json')

  // Always extend RN template config.
  expect(tsconfigContents.extends).toBe('@tsconfig/react-native/tsconfig.json')
})

test('Properly configures typescript when tsconfig detected.', async () => {
  prepare([
    packageJson('typescript-detect'),
    file(
      'tsconfig.json',
      '{ "compilerOptions": { "skipLibCheck": true }, "exclude": [ "babel.config.js" ] }'
    ),
    reactNativePkg,
  ])

  mkdirSync(join(process.cwd(), 'node_modules/@tsconfig/react-native'), { recursive: true })
  cpSync(
    join(initialCwd, 'node_modules/@tsconfig/react-native'),
    join(process.cwd(), 'node_modules/@tsconfig/react-native'),
    { recursive: true }
  )

  configure()

  const contents = contentsForFilesMatching('*.json')
  expect(contents[1].name).toBe('tsconfig.json')
  const tsconfigContents = contents[1].contents as any

  // Always extend RN template config.
  expect(tsconfigContents.extends).toBe('@tsconfig/react-native/tsconfig.json')
  expect(tsconfigContents.compilerOptions.skipLibCheck).toBe(true)
  // Extended excludes removed.
  expect(tsconfigContents.exclude).toBe(undefined)
})

test('Extended tsconfig properties are removed.', async () => {
  prepare([
    packageJson('typescript-extend', { devDependencies: { typescript: '^4.4.4' } }),
    file(
      'tsconfig.json',
      '{ "compilerOptions": { "moduleResolution": "node" }, "exclude": [ "node_modules", "my-stuff" ] }'
    ),
    reactNativePkg,
  ])

  mkdirSync(join(process.cwd(), 'node_modules/@tsconfig/react-native'), { recursive: true })
  cpSync(
    join(initialCwd, 'node_modules/@tsconfig/react-native'),
    join(process.cwd(), 'node_modules/@tsconfig/react-native'),
    { recursive: true }
  )

  configure()

  const contents = contentsForFilesMatching('*.json')
  expect(contents[1].name).toBe('tsconfig.json')
  const tsconfigContents = contents[1].contents as any

  // Always extend RN template config.
  expect(tsconfigContents.extends).toBe('@tsconfig/react-native/tsconfig.json')
  // Always added.
  expect(tsconfigContents.compilerOptions.skipLibCheck).toBe(true)
  expect(tsconfigContents.moduleResolution).toBe(undefined)
  // Extended excludes removed.
  expect(tsconfigContents.exclude).toEqual(['my-stuff'])
})

test('tsconfig from package.json is merged in.', async () => {
  prepare([
    packageJson('typescript-package', {
      devDependencies: { typescript: '^4.4.4' },
      tsconfig: {
        compilerOptions: { skipLibCheck: false, module: 'esm' },
        include: ['global.d.ts'],
      },
    }),
    reactNativePkg,
  ])

  mkdirSync(join(process.cwd(), 'node_modules/@tsconfig/react-native'), { recursive: true })
  cpSync(
    join(initialCwd, 'node_modules/@tsconfig/react-native'),
    join(process.cwd(), 'node_modules/@tsconfig/react-native'),
    { recursive: true }
  )

  configure()

  const contents = contentsForFilesMatching('*.json')
  expect(contents[1].name).toBe('tsconfig.json')
  const tsconfigContents = contents[1].contents as any

  // Always extend RN template config.
  expect(tsconfigContents.extends).toBe('@tsconfig/react-native/tsconfig.json')
  // Always added.
  expect(tsconfigContents.compilerOptions.skipLibCheck).toBe(false)
  expect(tsconfigContents.moduleResolution).toBe(undefined)
  expect(tsconfigContents.include).toEqual(['global.d.ts'])
  expect(tsconfigContents.compilerOptions.module).toBe('esm')
})

test("Tsconfig array properties aren't duplicated upon merge.", async () => {
  prepare([
    packageJson('typescript-merge', {
      devDependencies: { typescript: '^4.4.4' },
      tsconfig: {
        compilerOptions: { types: ['node', 'jest'] },
        include: ['global.d.ts'],
      },
    }),
    file(
      'tsconfig.json',
      '{ "compilerOptions": { "types": ["node"] }, "include": [ "global.d.ts", "another.d.ts" ] }'
    ),
    reactNativePkg,
  ])

  mkdirSync(join(process.cwd(), 'node_modules/@tsconfig/react-native'), { recursive: true })
  cpSync(
    join(initialCwd, 'node_modules/@tsconfig/react-native'),
    join(process.cwd(), 'node_modules/@tsconfig/react-native'),
    { recursive: true }
  )

  configure()

  const contents = contentsForFilesMatching('*.json')
  expect(contents[1].name).toBe('tsconfig.json')
  const tsconfigContents = contents[1].contents as any

  // Always extend RN template config.
  expect(tsconfigContents.extends).toBe('@tsconfig/react-native/tsconfig.json')
  expect(tsconfigContents.compilerOptions.types.length).toBe(2)
  expect(tsconfigContents.compilerOptions.types).toContain('node')
  expect(tsconfigContents.compilerOptions.types).toContain('jest')
  // Extended excludes removed.
  expect(tsconfigContents.include).toEqual(['global.d.ts', 'another.d.ts'])
})
