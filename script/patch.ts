import { join } from 'path'
import { cpSync } from 'fs'
import { createPatch } from '../git'
import { basePath, log } from '../helper'

export const patch = () => {
  try {
    cpSync(join(basePath(), 'android'), join(basePath(), '.numic/android'), { recursive: true })
    cpSync(join(basePath(), 'ios'), join(basePath(), '.numic/ios'), {
      recursive: true,
      filter: (source) => {
        if (source.includes('/ios/Pods')) {
          return false
        }
        return true
      },
    })
  } catch (error) {
    log('Failed to copy native files', 'error')
  }

  createPatch()

  log('Patch created in patch/current.patch')
}
