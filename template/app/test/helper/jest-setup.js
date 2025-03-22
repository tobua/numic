import { jest } from '@jest/globals'
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock'

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext)

// Mocks turbo modules not available in jest.
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  const turboModuleRegistry = jest.requireActual(
    'react-native/Libraries/TurboModule/TurboModuleRegistry'
  )
  return {
    ...turboModuleRegistry,
    getEnforcing: (name) => {
      // List of TurboModules libraries to mock.
      const modulesToMock = {
        PlatformConstants: {
          getConstants() {
            return {}
          },
        },
        SourceCode: {
          getConstants() {
            return {
              scriptURL: null,
            }
          },
        },
        ImageLoader: {
          getSize: jest.fn(() => Promise.resolve({ width: 320, height: 240 })),
          prefetchImage: jest.fn(),
        },
        SettingsManager: {
          getConstants() {
            return {
              settings: {
                AppleLocale: 'en-us',
                AppleLanguages: ['en-us'],
              },
            }
          },
        },
        StatusBarManager: {
          setColor: jest.fn(),
          setStyle: jest.fn(),
          setHidden: jest.fn(),
          setNetworkActivityIndicatorVisible: jest.fn(),
          setBackgroundColor: jest.fn(),
          setTranslucent: jest.fn(),
          getConstants: () => ({
            HEIGHT: 42,
          }),
        },
        DeviceInfo: {
          getConstants() {
            return {
              Dimensions: {
                window: {
                  fontScale: 2,
                  height: 1334,
                  scale: 2,
                  width: 750,
                },
                screen: {
                  fontScale: 2,
                  height: 1334,
                  scale: 2,
                  width: 750,
                },
              },
            }
          },
        },
        DevSettings: {},
      }
      if (Object.hasOwn(modulesToMock, name)) {
        return modulesToMock[name]
      } else {
        console.warn(`Missing mock for native module "${name}" add in test/helper/jest-setup.js.`)
      }
      return turboModuleRegistry.getEnforcing(name)
    },
  }
})
