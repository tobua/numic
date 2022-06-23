import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'
import { basePath, log } from './helper'

const createGitShell =
  (cwd = join(basePath(), '.numic')) =>
  (...args: string[]) =>
    spawnSync('git', args, {
      cwd,
      env: { ...process.env, HOME: 'numic' },
      maxBuffer: 1024 * 1024 * 100,
    })

export const initializeRepository = () => {
  const git = createGitShell()

  git('init')
  git('config', '--local', 'user.name', 'numic')
  git('config', '--local', 'user.email', 'numic@reactnative.dev')

  git('add', '.')

  git('commit', '--allow-empty', '-m', 'Initial commit (fresh native Android and iOS folders.')
}

export const createPatch = () => {
  const git = createGitShell()

  git('add', '.') // Includes new files and content changes.
  // TODO patch with removes will fail to be applied.
  // git('rm', '$(git ls-files --deleted)') // Includes removed files, see https://stackoverflow.com/a/34455483.
  // git('rm', 'android/app/debug.keystore')

  const diffResult = git('diff', '--cached', '--no-color', '--ignore-space-at-eol', '--no-ext-diff')

  // TODO verify diff (no symlinks).

  if (!existsSync(join(basePath(), 'patch'))) {
    mkdirSync(join(basePath(), 'patch'), { recursive: true })
  }

  writeFileSync(join(basePath(), 'patch/current.patch'), diffResult.stdout)

  // TODO remove added/staged changes again.
}

export const applyPatch = () => {
  const git = createGitShell(basePath())

  if (!existsSync(join(basePath(), 'patch/current.patch'))) {
    log('Missing patch', 'error')
    return
  }

  if (!existsSync(join(basePath(), '.git'))) {
    // TODO just do probably no notice necessary
    log(`Missing repository in ${basePath()} initializing an empty one`, 'warning')

    git('init')
    git('config', '--local', 'user.name', 'numic')
    git('config', '--local', 'user.email', 'numic@reactnative.dev')
  }

  // Add '--check' flag to see if patch is valid and can be applied.
  git('apply', join(basePath(), 'patch/current.patch'))

  // TODO remove temporary repository if one created.
}
