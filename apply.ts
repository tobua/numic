import { join } from 'node:path'
import { readFileSync, unlinkSync, existsSync, writeFileSync } from 'node:fs'
import { EOL } from 'node:os'
import { SpawnSyncReturns } from 'node:child_process'
import glob from 'fast-glob'
import { basePath, log } from './helper'

const removeRejectedFiles = (location: string) => {
  const rejectedFiles = glob.sync(['android/**/*.rej', 'ios/**/*.rej'], {
    dot: true,
    cwd: location,
  })

  rejectedFiles.forEach((fileName) => {
    const filePath = join(location, fileName)
    unlinkSync(filePath)
  })
}

const collectRejectedHunks = (location: string) => {
  const rejectedFiles = glob.sync(['android/**/*.rej', 'ios/**/*.rej'], {
    dot: true,
    cwd: location,
  })

  const rejectedHunks = []

  rejectedFiles.forEach((fileName) => {
    const filePath = join(location, fileName)
    const originalFileName = fileName.replace('.rej', '')
    let contents = readFileSync(filePath, 'utf-8')

    if (contents) {
      // Inject file header, so that it can be applied like a patch.
      const contentsSplitByLine = contents.split(/\r?\n/)
      contentsSplitByLine.splice(1, 0, `--- a/${originalFileName}\n+++ b/${originalFileName}`)
      contents = contentsSplitByLine.join(EOL)
      rejectedHunks.push(contents)
    }

    unlinkSync(filePath)
  })

  return rejectedHunks
}

export const applyPatch = (
  location: string,
  git: (...args: string[]) => SpawnSyncReturns<Buffer>
) => {
  const patchPath = join(basePath(), 'patch/current.patch')
  const rejectedHunksPath = join(basePath(), 'patch/rejected-hunks.patch')

  if (existsSync(rejectedHunksPath)) {
    log(
      'Removing patch/rejected-hunks.patch, assuming appropriate changes have been made in current.patch'
    )
  }

  // https://git-scm.com/docs/git-apply
  git('apply', '--reject', patchPath)

  let rejectedHunks = collectRejectedHunks(location)

  if (rejectedHunks.length) {
    writeFileSync(rejectedHunksPath, rejectedHunks.join(EOL))
    // Check if some of the rejected hunks have already been applied, by applying them in reverse.
    git('apply', '--reject', '--reverse', rejectedHunksPath)
    unlinkSync(rejectedHunksPath)

    rejectedHunks = collectRejectedHunks(location)

    // Fully apply patch again, to restore previous reverses and ignoring rejcts.
    git('apply', '--reject', patchPath)
    removeRejectedFiles(location)

    if (rejectedHunks.length) {
      writeFileSync(rejectedHunksPath, rejectedHunks.join(EOL))

      log('Unable to apply some changes in the patch')
      log('Problematic parts have been moved to patch/rejected-hunks.patch')
      log('There are two ways to fix this:')
      log('1) Fix the problematic parts in patch/current.patch and try again')
      log(
        '2) Manually apply the proper changes in /ios or /android and run"npx numic patch" to update the patch and then try again'
      )
      return
    }
  }

  log('Patch successfully applied')
}
