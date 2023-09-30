import React, { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { createStyles } from 'responsive-react-native'
import { Font } from '../style'
import { Label } from '../label'

const styles = createStyles({
  wrapper: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})

export function Header({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.wrapper}>
      {title && (
        <Text accessibilityLabel={Label.screenTitle} style={Font.title}>
          {title}
        </Text>
      )}
      {children}
    </View>
  )
}
