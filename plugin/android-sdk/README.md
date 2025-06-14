# android-sdk Numic Plugin

<img align="right" src="https://github.com/tobua/numic/raw/main/plugin/android-sdk/logo.png" width="20%" alt="Android SDK Numic Plugin Logo" />

Numic plugin to configure native folders to use the currently installed Android SDK. This ensures the build will always be successful even after updating the system.

## Installation

This plugin is automatically enabled for projects managed through [numic](https://npmjs.com/numic).

`buildToolsVersion`, `compileSdkVersion` and `targetSdkVersion` will be set to the newest one installed, while `minSdkVersion` will default to the React Native template unless configured explicitly. [apilevels.com](https://apilevels.com) can help in determining the appropriate `minSdkVersion` for your application. Check the [Android Version History](https://en.wikipedia.org/wiki/Android_version_history) on Wikipedia to determine the latest Android version used as `compileSdkVersion` and `targetSdkVersion`. The `buildToolsVersion` is more specific and should match the exact one you have installed. This plugin aims to be updated regularly to always point to the latest Android release. When developing it's often a good idea to try the application with the latest preview version to ensure future compatibility.

## Prerequisites

Make sure to update or install the Android SDK CLI Tools. This can be done when opening a project with Android Studio and clicking the icon "SDK Manager" on the top-right.

<p align="center">
  <img src="https://github.com/tobua/numic/raw/main/plugin/android-sdk/update.png" width="80%" alt="Updating Android CLI Tools" />
</p>

Furthermore, it's important to properly configure the `$ANDROID_HOME` variable. On macOS when installing Android Studio this can be set to `export ANDROID_HOME=$HOME/Library/Android/sdk` in `~/.zshrc`.

## Configuration

The detailed Android SDK versions can be configured in `package.json` under the `numic` property. This will override automatically using the installed version as described above.

```js
{
  "name": "my-app",
  "numic": {
    "android-sdk": {
      "compileSdkVersion": 36,
      "targetSdkVersion": 36,
      "minSdkVersion": 24,
      "buildToolsVersion": "36.0.0",
      "ndkVersion": true
    }
  }
}
```
