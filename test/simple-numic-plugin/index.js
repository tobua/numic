import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export default ({ cwd, log, options }) => {
  const buildGradlePath = join(cwd, 'android/build.gradle')
  let buildGradleContents = readFileSync(buildGradlePath, 'utf-8')

  buildGradleContents = buildGradleContents.replace(
    'com.android.tools.build:gradle',
    `com.${options.name || 'numic'}:plugin`
  )

  writeFileSync(buildGradlePath, buildGradleContents)

  log('Edited android/build.gradle')
}
