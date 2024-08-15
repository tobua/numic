import React from 'react'
import { Text, Image } from 'react-native'
import { go } from 'reactigation'
import { createStyles } from 'responsive-react-native'
import { Screen } from '../markup/Screen'
import { Button } from '../markup/Button'
import { Header } from '../markup/Header'
import { Animation } from '../markup/Animation'
import { Gesture } from '../markup/Gesture'
import { Label } from '../label'
import logo from '../logo.png'
import { Font, Space, Color } from '../style'

const styles = createStyles({
  image: {
    width: 100,
    height: 100,
    marginTop: Space.huge,
  },
  green: {
    color: Color.highlight,
  },
})

export function Overview() {
  return (
    <Screen>
      <Header title="Overview">
        <Button
          background
          accessibilityLabel={Label.openSettingsButton}
          onPress={() => go('Settings')}
          title="Settings"
        />
      </Header>
      <Image style={styles.image} source={logo} />
      <Text style={Font.title}>
        Welcome to <Text style={Font.highlight}>numic</Text>!
      </Text>
      <Text style={Font.text}>Running in {__DEV__ ? 'Debug' : 'Release'} Mode</Text>
      <Text style={Font.title}>Animations</Text>
      <Animation />
      <Text style={Font.title}>Gestures</Text>
      <Gesture />
    </Screen>
  )
}
