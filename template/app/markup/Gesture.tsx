import React, { useRef } from 'react'
import { PanResponder, Text, View } from 'react-native'
import { createStyles } from 'responsive-react-native'
import { Color, Font, Space } from '../style'

const styles = createStyles({
  wrapper: {
    flexDirection: 'row',
    gap: Space.medium,
  },
  box: {
    justifyContent: 'center',
    padding: Space.medium,
    borderRadius: Space.medium,
    backgroundColor: Color.highlight,
  },
})

export function Gesture() {
  const box = useRef<View>(null)
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_event, gestureState) => {
        box.current?.setNativeProps({
          style: {
            transform: [{ translateX: gestureState.dx }, { translateY: gestureState.dy }],
          },
        })
      },
      onPanResponderRelease: () => {
        box.current?.setNativeProps({
          style: {
            transform: [{ translateX: 0 }, { translateY: 0 }],
          },
        })
      },
    })
  ).current

  return (
    <View style={styles.wrapper}>
      <View ref={box} {...panResponder.panHandlers} style={styles.box}>
        <Text style={Font.bold}>Drag around!</Text>
      </View>
    </View>
  )
}
