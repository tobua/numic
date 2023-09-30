import React, { useState } from 'react'
import { Pressable, Text } from 'react-native'
import { Styled } from 'responsive-react-native'
import { Color, Font, Space } from '../style'

const CustomPressable = Styled(
  Pressable,
  {
    padding: Space.small,
    borderRadius: Space.medium,
  },
  {
    background: {
      backgroundColor: Color.lightgray,
      paddingVertical: Space.small,
      paddingHorizontal: Space.medium,
    },
    pressed: {
      backgroundColor: Color.gray,
    },
  }
)

export function Button({ title, onPress, background, ...props }: any) {
  const [pressed, setPressed] = useState(false)

  return (
    <CustomPressable
      background={background}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressed={pressed}
      {...props}
    >
      <Text style={[Font.text, Font.bold, Font.interact, pressed && Font.highlight]}>{title}</Text>
    </CustomPressable>
  )
}
