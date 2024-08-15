import React, { LegacyRef, MutableRefObject, useEffect, useRef } from 'react'
import { Text, View, Animated } from 'react-native'
import { createStyles } from 'responsive-react-native'
import { Color, Space } from '../style'

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
  text: {
    fontFamily: { ios: 'Courier', android: 'monospace' },
  },
})

function animateNativeProps(view?: MutableRefObject<View | undefined>) {
  if (!view?.current) {
    return null
  }

  let opacity = 0
  let increasing = true

  return setInterval(() => {
    if (increasing) {
      opacity += 0.01
      if (opacity >= 1) {
        increasing = false
      }
    } else {
      opacity -= 0.01
      if (opacity <= 0) {
        increasing = true
      }
    }

    view.current?.setNativeProps({
      style: { opacity },
    })
  }, 10)
}

export function Animation() {
  const firstBox = useRef<View>()
  const opacityValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const intervalId = animateNativeProps(firstBox)

    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start()

    return () => (intervalId ? clearInterval(intervalId) : undefined)
  }, [opacityValue])

  return (
    <View style={styles.wrapper}>
      <View ref={firstBox as LegacyRef<View>} style={styles.box}>
        <Text style={styles.text}>setNativeProps</Text>
      </View>
      <Animated.View style={[styles.box, { opacity: opacityValue }]}>
        <Text style={styles.text}>Animated.Value</Text>
      </Animated.View>
    </View>
  )
}
