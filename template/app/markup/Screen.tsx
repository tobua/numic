import React, { ReactNode } from 'react'
import { SafeAreaView, StatusBar, View } from 'react-native'
import { createStyles } from 'responsive-react-native'
import { Color, Space } from '../style'

const styles = createStyles({
  safeArea: {
    backgroundColor: Color.white,
    flex: 1,
  },
  wrapper: {
    padding: Space.large,
    alignItems: 'center',
    gap: Space.huge,
  },
})

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.wrapper}>{children}</View>
    </SafeAreaView>
  )
}
