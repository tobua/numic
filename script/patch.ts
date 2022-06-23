import { join } from 'path'
import { cpSync } from 'fs'
import { createPatch } from '../git'
import { basePath, log } from '../helper'

export const patch = () => {
  cpSync(join(basePath(), 'android'), join(basePath(), '.numic/android'), { recursive: true })
  cpSync(join(basePath(), 'ios'), join(basePath(), '.numic/ios'), { recursive: true })

  createPatch()

  log('Patch created in patch/current.patch')
}
