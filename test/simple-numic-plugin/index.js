import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export default ({ nativePath, log, options }) => {
  const buildGradlePath = join(nativePath, 'android/build.gradle')
  let buildGradleContents = readFileSync(buildGradlePath, 'utf-8')

  buildGradleContents = buildGradleContents.replace('com.android.tools.build:gradle', `com.${options.name || 'numic'}:plugin`)

  writeFileSync(buildGradlePath, buildGradleContents)

  log('Edited android/build.gradle')
}
