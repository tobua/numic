module.exports = {
  // Preset still required for jest, but leads to JSX runtime errors in regular app.
  presets: process.env.NODE_ENV === 'test' ? ['module:metro-react-native-babel-preset'] : [],
}
