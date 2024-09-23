declare module '*.png' {
  const src: import('react-native').ImageSourcePropType
  export default src
}

declare module '*.jpg' {
  const src: import('react-native').ImageSourcePropType
  export default src
}

declare module '*.jpeg' {
  const src: import('react-native').ImageSourcePropType
  export default src
}

declare module '*.bmp' {
  const src: import('react-native').ImageSourcePropType
  export default src
}

// See: https://reactnative.dev/docs/image#gif-and-webp-support-on-android
declare module '*.gif' {
  const src: import('react-native').ImageSourcePropType
  export default src
}

declare module '*.webp' {
  const src: import('react-native').ImageSourcePropType
  export default src
}
