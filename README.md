# numic

<img align="right" src="https://github.com/tobua/numic/raw/main/logo.png" width="20%" alt="Numic Logo" />

Utility to manage React Native projects. Commit only the changes made to native code inside `/ios` and `/android` as small patches.

- Fully managed native code through Patches and Plugins
- Runs during project installation
- Easily upgrade native code
- ESLint, Prettier and TypeScript configurations

## Installation

Run the following in your React Native project and it will automatically add the necessary configurations and commands to your `package.json`.

```
npm install numic --save-dev --foreground-scripts --legacy-peer-deps
```

This will also create fresh `/android` and `/ios` native folders and generate a patch if any changes are found.

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

In order to automate common changes to native folders, reusable plugins can be installed. Any node_module ending in `-numic-plugin` will be treated as such and automatically installed. [icon-numic-plugin](https://npmjs.com/icon-numic-plugin) is an example of a plugin that will automatically create icons in various sizes for Android and iOS.

### Anatomy of a Plugin

```ts
import { join } from 'path'

interface PluginInput {
  projectPath: string
  nativePath: string
  log: (message: string, type?: 'error' | 'warning') => void
  options: object
}

export default async ({ projectPath, nativePath, log, options }: PluginInput) => {
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
    }
  }
}
```

## Acknowledgements

The approach to create patches using git was inspired by [patch-package](https://npmjs.com/patch-package).

## Lifecycle

Upon installation a new React Native template is checked out and the native `/android` and `/ios` folders are duplicated. Once for the user to make edits in the root folder and once inside `.numic` as a separate emtpy git repository. Upon installation existing plugins and patches are applied to both locations.

Before running the native application using `numic ios` or `numic android` eventual changes to native folders will be added to the patch and newly installed plugins are applied as well.
