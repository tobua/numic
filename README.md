# numic

<img align="right" src="https://github.com/tobua/numic/raw/main/logo.png" width="20%" alt="Numic Logo" />

Utility to manage React Native projects. Commit only the changes made to native code inside `/ios` and `/android` as small patches.

- TypeScript
- ESLint, Prettier
- Fully managed native code
  - Patches
  - Plugins
- Runs during project installation
- Easily upgrade native code

## Installation

Run the following in your React Native project and it will automatically add the necessary configurations and commands to your `package.json`.

```
npm install --save-dev numic
```

## Commands

This framework provides the following commands that will be added to `scripts` in `package.json` upon installation.

### `numic lint`

Lints and formats the whole project.

### `numic native`

Generate or recreate native `/ios` and `/android` folders.

### `numic apply`

Apply patches from `/patch` folder to native folders.
