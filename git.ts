import { writeFileSync, existsSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'
import { basePath, log } from './helper'
import { pluginGitignore } from './configuration/gitignore'

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

  writeFileSync(join(basePath(), '.numic/.gitignore'), pluginGitignore())

  git('add', '.')

  git('commit', '--allow-empty', '-m', 'Initial commit (fresh native Android and iOS folders.')
}

export const createPatch = () => {
  const git = createGitShell()

  git('add', '.') // Includes modifications, additions and removals.

  const diffResult = git(
    'diff',
    '--cached',
    '--no-color',
    '--ignore-space-at-eol',
    '--no-ext-diff',
    '--binary'
  )

  // TODO verify diff (no symlinks).

  if (!existsSync(join(basePath(), 'patch'))) {
    mkdirSync(join(basePath(), 'patch'), { recursive: true })
  }

  const patchFileName = join(basePath(), 'patch/current.patch')
  const patchContents = diffResult.stdout.toString()

  if (patchContents) {
    const patchUpdated = existsSync(patchFileName)
    writeFileSync(patchFileName, patchContents)
    log(`Patch ${patchUpdated ? 'updated' : 'created'} in patch/current.patch`)
  } else {
    if (existsSync(patchFileName)) {
      rmSync(patchFileName)
    }

    log('No changes to patch found', 'warning')
  }

  // Remove staged changes again.
  git('reset', 'HEAD', '--', '.')
}

export const applyPatch = ({
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

  // TODO Add '--check' flag to see if patch is valid and can be applied.
  // https://git-scm.com/docs/git-apply#Documentation/git-apply.txt---check
  // TODO --reject flag to apply possible changes and output fails to .rej file.

  git('apply', join(basePath(), 'patch/current.patch'))

  if (temporaryGitCreated) {
    rmSync(repositoryPath, { recursive: true })
  }

  log('Patch successfully applied')
}
