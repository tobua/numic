# icon Numic Plugin

<img align="right" src="https://github.com/tobua/numic/raw/main/plugin/icon/logo.png" width="20%" alt="Icon Numic Plugin Logo" />

Numic plugin for React Native to automatically generate iOS and Android app icons from a single file. Commit only one 1024x1024 file of your app icon but get all sizes automatically. Also supports the generation of adaptive icons for Android.

## Installation

This plugin is automatically enabled for projects managed through [numic](https://npmjs.com/numic).

## Usage

Numic automatically picks up the plugin once installed and adds the various icons to the native folders in `/android` and `/ios` without any changes to commit. The only thing **required is an icon** of the recommended size 1024x1024. The plugin will look for icons in the following locations and pick the first match:

- icon.png / icon.svg
- app-icon.png / app-icon.svg
- asset/icon.png / asset/icon.svg
- logo.png / logo.svg (also used as Avatar in SourceTree)

## Configuration

The icon can be configured in `package.json` under the `numic` property. This will override default icon paths from the file system as described above.

```js
{
  "name": "my-app",
  "numic": {
    "icon": {
      "icon": "image/my-icon.png",
      // Convert transparent icons to a black background for iOS, default white.
      "iOSBackground": "#000000",
      // Generate Android adaptive icons from SVG images.
      "androidForeground": "image/my-adaptive-foreground.svg",
      "androidBackground": "image/my-adaptive-background.svg",
      // Pass native Android vector drawables in XML format.
      "androidForeground": "image/my-adaptive-foreground.xml",
      "androidBackground": "image/my-adaptive-background.xml",
      // Instead of "androidBackground" it's possible to just set a solid color.
      "androidBackgroundColor": "#FF0000",
    }
  }
}
```

## Adaptive Icons for Android

Adaptive icons use vector graphics and are composed of a foreground and a background image. Due to using vector graphics only one image size is required. This plugin will generate all the required configuration files as well as the scaled legacy images in various sizes for older devices.

For web developers the easiest way to generate the vector drawables used on Android for adaptive icons is to convert from an SVG. The vector drawable specification is largely the same as SVG so this plugin is able to take SVG icons as input and convert them to XML files in the Android Drawable syntax. It's also possible to directly pass in XML files that are already in the vector drawable format. To generate vector drawables from scratch or debug the output of the conversion from SVG by this plugin, open the `/android` folder in Android Studio. There it's possible to edit and directly preview the images. To get a preview of the resulting images for various Android versions click `Resource Manager` on the left -> `+` icon -> `Image Asset`.

<p align="center">
  <img src="https://github.com/tobua/numic/raw/main/plugin/icon/image/image-asset.png" width="80%" alt="Adaptive Icon preview in Android Studio" />
</p>

To avoid that parts of the foreground icon are cut off the icon should be centered and only take up about **60%** of the width and height.

<p align="center">
  <a href="https://npmjs.com/react-native-adaptive-icons">
    <img src="https://github.com/tobua/numic/raw/main/plugin/icon/image/nice-try.png" width="70%" alt="ChatGPT's attempt at Adaptive Icons for React Native" />
  </a>
</p>
