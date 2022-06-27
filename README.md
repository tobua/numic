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
npm install numic --save-dev --foreground-scripts
```

## Commands

This framework provides the following commands that will be added to `scripts` in `package.json` upon installation.

### `numic native`

Generate or recreate native `/ios` and `/android` folders. Use this command to upgrade the native code.

### `numic patch`

Create or updated patches from changes made to native folders.

### `numic apply`

Apply patches from `/patch` folder to native folders.

### `numic lint`

Lints and formats the whole project.

## Acknowledgements

The approach to create patches using git was inspired by [patch-package](https://npmjs.com/patch-package).
