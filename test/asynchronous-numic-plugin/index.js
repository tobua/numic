import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export default async ({ nativePath, log }) => {
  await new Promise((done) => {
    setTimeout(done, 2000)
  })

  const podfilePath = join(nativePath, 'ios/Podfile')
  let podfileContents = readFileSync(podfilePath, 'utf-8')

  podfileContents = podfileContents.replace('use_native_modules', 'numic_hash')

  writeFileSync(podfilePath, podfileContents)

  log('Edited ios/Podfile')
}
