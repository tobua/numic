const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // "true" currently results in a runtime error.
    unstable_enablePackageExports: false,
  },
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
