import { expect, test, beforeEach, afterEach, vi } from 'vitest'
import { prepare, environment, packageJson, file, contentsForFilesMatching } from 'jest-fixture'
import { configure } from '../configure'

// @ts-ignore
global.jest = { spyOn: vi.spyOn }
// @ts-ignore
global.beforeEach = beforeEach
// @ts-ignore
global.afterEach = afterEach

environment('configuration')

test('Properly configures empty project.', async () => {
  prepare([packageJson('empty'), file('index.js', "console.log('Hello')")])

  configure()

  const contents = contentsForFilesMatching('*.json')
  expect(contents[0].name).toBe('package.json')
  const packageContents = contents[0].contents as any

  expect(packageContents.scripts.lint).toBe('numic lint')
  expect(packageContents.scripts.native).toBe('numic native')
  expect(packageContents.scripts.apply).toBe('numic apply')
  expect(packageContents.scripts.patch).toBe('numic patch')
  expect(packageContents.prettier).toContain('prettierrc')
  expect(packageContents.eslintConfig.extends).toContain('eslintrc')
})

test('Properly configures empty project.', async () => {
  prepare([packageJson('empty', { scripts: { lint: 'my-custom-eslint', apply: 'my-apply' } })])

  configure()

  const contents = contentsForFilesMatching('*.json')
  expect(contents[0].name).toBe('package.json')
  const packageContents = contents[0].contents as any

  expect(packageContents.scripts.lint).not.toContain('numic')
  expect(packageContents.scripts.native).toContain('numic')
  expect(packageContents.scripts.apply).not.toContain('numic')
  expect(packageContents.scripts.patch).toContain('numic')
  // TODO override eslint and prettier only if they still match initial contents.
})

test('Adds new entries to gitignore.', async () => {
  prepare([packageJson('ignore')])

  configure()

  const contents = contentsForFilesMatching('.*')
  expect(contents[0].name).toBe('.gitignore')
  const gitignoreContents = contents[0].contents as any

  expect(gitignoreContents).toContain('.numic')
  expect(gitignoreContents).toContain('node_modules')
  expect(gitignoreContents).toContain('package-lock.json')
})

test('Adds new entries to gitignore.', async () => {
  prepare([packageJson('ignore-package', { numic: { gitignore: ['my-folder'] } })])

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
  ])

  configure()

  const contents = contentsForFilesMatching('.*')
  expect(contents[0].name).toBe('.gitignore')
  const gitignoreContents = contents[0].contents as any

  expect(gitignoreContents).toContain('node_modules')
  const occurrences = gitignoreContents.split('node_modules').length
  expect(occurrences).toBe(2)
})

test('Properly configures empty project.', async () => {
  prepare([packageJson('empty'), file('index.js', "console.log('Hello')")])

  configure()

  const contents = contentsForFilesMatching('*.json')
  expect(contents[0].name).toBe('package.json')
  const packageContents = contents[0].contents as any

  expect(packageContents.scripts.lint).toBeDefined()
  expect(packageContents.prettier).toContain('prettierrc')
  expect(packageContents.eslintConfig.extends).toContain('eslintrc')
})
