# numic

<img align="right" src="https://github.com/tobua/numic/raw/main/logo.png" width="20%" alt="Numic Logo" />

Utility to manage React Native projects. Commit only the changes made to native code inside `/ios` and `/android` as small patches.

- Fully managed native code through Patches and Plugins
- Runs during project installation
- Easily upgrade native code
- ESLint, Prettier and TypeScript configurations
- Plugins to apply common native changes automatically

## Installation

Run the following in your React Native project and it will automatically add the necessary configurations and commands to your `package.json`.

```
npm install numic --save-dev --foreground-scripts --legacy-peer-deps
```

This will also create fresh `/android` and `/ios` native folders and generate a patch if any changes are found. See [Migration of an Existing Project](#migration-of-an-existing-project) for more details. When **starting from scratch** the following will setup a React Native TypeScript installation with numic preinstalled and much of the default bloat removed.

```
npm init --yes now numic ./my-app
```

## Commands

This framework provides the following commands that will be added to `scripts` in `package.json` upon installation.

### `numic ios`

Run native application on iOS device or Simulator. Updates patch and pods first. Alias for `react-native run-ios` where any additional arguments are passed as well.

### `numic android`

Run native application on Android device or Emulator. Updates patch first. Alias for `react-native run-android` where any additional arguments are passed as well.

### `numic lint`

Lints and formats the whole project.

<details>
  <summary>Lifecycle methods (automatically run during installation and when building the native application).</summary>
  
### `numic native`

Generate or recreate native `/ios` and `/android` folders. Use this command to upgrade the native code.

### `numic patch`

Create or updated patches from changes made to native folders.

### `numic apply`

Apply patches from `/patch` folder to native folders.

### `numic plugin`

Apply installed plugins.

</details>

## Plugins

In order to automate common changes to native folders, reusable plugins can be installed. Any node_module ending in `-numic-plugin` will be treated as such and automatically installed. Currently the following plugins are available:

- [icon-numic-plugin](https://npmjs.com/icon-numic-plugin) creates icons in various sizes for Android and iOS.
- [android-sdk-numic-plugin](https://npmjs.com/android-sdk-numic-plugin) checks which Android SDK versions are installed and adapts Gradle configuration to ensure a successful build.

### Anatomy of a Plugin

```ts
import { join } from 'path'

interface PluginInput {
  // Root project path.
  projectPath?: string
  // Location of /android or /ios folders, either root or inside /.numic.
  nativePath?: string
  log?: (message: string, type?: 'error' | 'warning') => void
  options: Options
  // Currently installed React Native version.
  version?: string
}

export default async ({
  projectPath = process.cwd(),
  nativePath = process.cwd(),
  log = console.log,
  options = {},
  version,
}: PluginInput) => {
  const androidFolder = join(nativePath, 'android')
  const iosFolder = join(nativePath, 'ios')
  const appJsonPath = join(projectPath, 'app.json')

  // Do something with ios and android folders.
}
```

Any plugins placed as `.js` files inside `/plugin` or installed node_modules ending in `-numic-plugin` will automatically be run before patches are created or the app is run.

## Configuration

Adding a `numic` property allows to configure script and plugin behaviour. This is useful for npm plugins but also works for local plugins inside the `/plugin` folder.

```json
{
  "name": "my-app",
  "numic": {
    "icon-numic-plugin": {
      "icon": "image/icon/app-icon.png"
    },
    "my-plugin.js": {
      "icon": "asset/my-icon.png"
    },
    // Entries to be added to native .gitignore (changes will not appear in patch).
    "nativeGitignore": [
      "android/app/upload-keystore.jks",
      "project.pbxproj",
      "!IDEWorkspaceChecks.plist" // Include file.
    ]
  },
  // Will be merged with tsconfig, that's by default gitignored.
  "tsconfig": {
    "compilerOptions": {
      "skipLibCheck": false,
      "include": ["global.d.ts"],
      "target": "esnext"
    }
  }
}
```

## Acknowledgements

The approach to create patches using git was inspired by [patch-package](https://npmjs.com/patch-package).

## Lifecycle

Upon installation a new React Native template is checked out and the native `/android` and `/ios` folders are duplicated. Once for the user to make edits in the root folder and once inside `.numic` as a separate emtpy git repository. Upon installation existing plugins and patches are applied to both locations.

Before running the native application using `numic ios` or `numic android` eventual changes to native folders will be added to the patch and newly installed plugins are applied as well.

## Migration of an Existing Project

Native files are generated using the React Native version specified in `package.json`. To ensure a more seamless migration make sure files in your native folders are up to date with native files generated by the currently installed version. Ensure all open changes (especially inside native folders) have been committed.

The first step to start the migration is to install numic as described above. This will remove the existing native folders along with changes made. To regain those changes use git to reset changes missing in the native folders. Make sure to temporarly remove the native folders that have been added to `.gitignore`. Usually, the number of files affected is manageable and best reset one-by-one in a graphical tool like SourceTree. Once all changes are applied again a patch can be created running `numic ios` or `numic android`. Both should successfully build and run the application and all the changes made to native folders before should now be found in the `patch/current.patch` file. The only thing left is to commit the patch file along with removing the native folders from the repository source code as described below.

```
# Make sure /android and /ios do not contain any local modifications.
git rm -r android
git rm -r ios
# Optional: automatically generated during install.
git rm tsconfig.json
```
