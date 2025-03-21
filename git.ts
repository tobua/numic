import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { applyPatch } from './apply'
import { pluginGitignore } from './configuration/gitignore'
import { basePath, log, replaceIndexLinesFromPatch } from './helper'

const createGitShell =
  (cwd = join(basePath(), '.numic')) =>
  (...args: string[]) =>
    spawnSync('git', args, {
      cwd,
      // biome-ignore lint/style/useNamingConvention: Standard naming for env variables.
      env: { ...process.env, HOME: 'numic' },
      maxBuffer: 1024 * 1024 * 100,
    })

export const initializeRepository = () => {
  const git = createGitShell()

  git('init')
  git('config', '--local', 'user.name', 'numic')
  git('config', '--local', 'user.email', 'numic@reactnative.dev')

  writeFileSync(join(basePath(), '.numic/.gitignore'), pluginGitignore())

  git('add', '.')

  git('commit', '--allow-empty', '-m', 'Initial commit (fresh native Android and iOS folders.')
}

// Remove uncommitted changes.
export const resetRepository = () => {
  if (!existsSync(join(basePath(), '.numic', '.git'))) {
    return
  }

  const git = createGitShell()
  git('reset', 'HEAD', '--hard') // Without hard keeps changes unstaged.
}

// Commit changes from newly installed plugins.
export const commitChanges = () => {
  if (!existsSync(join(basePath(), '.numic', '.git'))) {
    return
  }

  const git = createGitShell()
  git('add', '.')
  git('commit', '--allow-empty', '-m', 'Possible changes.')
}

export const createPatch = () => {
  const git = createGitShell()

  git('add', '.') // Includes modifications, additions and removals.

  const diffResult = git('diff', '--cached', '--no-color', '--ignore-space-at-eol', '--no-ext-diff', '--binary')

  const patchFileName = join(basePath(), 'patch/current.patch')
  const patchContents = replaceIndexLinesFromPatch(diffResult.stdout.toString())

  if (patchContents) {
    const patchUpdated = existsSync(patchFileName)

    if (patchUpdated) {
      const existingPatchContents = readFileSync(patchFileName, 'utf-8')

      if (existingPatchContents !== patchContents) {
        writeFileSync(patchFileName, patchContents)
        log('Patch updated in patch/current.patch')
      }
    } else {
      const patchFolder = join(basePath(), 'patch')
      if (!existsSync(patchFolder)) {
        mkdirSync(patchFolder, { recursive: true })
      }

      writeFileSync(patchFileName, patchContents)
      log('Patch created in patch/current.patch')
    }
  } else {
    if (existsSync(patchFileName)) {
      rmSync(patchFileName)
    }

    log('No changes to patch found')
  }

  resetRepository()
}

export const apply = ({
  skipEmpty,
  location = basePath(),
}: {
  skipEmpty?: boolean
  location?: string
}) => {
  const git = createGitShell(location)
  let temporaryGitCreated = false

  if (!existsSync(join(basePath(), 'patch/current.patch'))) {
    if (!skipEmpty) {
      log('No patch found, run "numic patch" to create a patch', 'error')
    }
    return
  }

  const repositoryPath = join(basePath(), '.git')

  if (!existsSync(repositoryPath)) {
    git('init')
    git('config', '--local', 'user.name', 'numic')
    git('config', '--local', 'user.email', 'numic@reactnative.dev')
    temporaryGitCreated = true
  }

  applyPatch(location, git)

  if (temporaryGitCreated) {
    rmSync(repositoryPath, { recursive: true })
  }
}
