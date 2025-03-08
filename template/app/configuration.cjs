module.exports = {
  typescript: 'react-native',
  reactNative: { name: '<%= name %>', displayName: '<%= name %>' },
  gitignore: 'numic',
  metro: {
    resolver: {
      // "true" currently results in a runtime error.
      unstable_enablePackageExports: false,
    },
  },
  babel: {
    // Preset still required for jest, but leads to JSX runtime errors in regular app.
    presets: process.env.NODE_ENV === 'test' ? ['module:@react-native/babel-preset'] : [],
  },
}
