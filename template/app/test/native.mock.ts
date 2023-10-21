import { NativeModules } from 'react-native'

// Mock locale depending on native language by os.
NativeModules.SettingsManager = {
  settings: {
    AppleLocale: 'en_US',
  },
}
