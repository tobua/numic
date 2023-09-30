import React from 'react'
import { GestureResponderEvent, Text, View, Pressable } from 'react-native'
import { back } from 'reactigation'
import { createStyles } from 'responsive-react-native'
import { Screen } from '../markup/Screen'
import { Button } from '../markup/Button'
import { Header } from '../markup/Header'
import { Label } from '../label'
import { observer } from 'mobx-react-lite'
import { Data } from '../data/Data'
import { Language } from '../types'
import { Color, Font, Space } from '../style'

const styles = createStyles({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  switch: {
    flexDirection: 'row',
    gap: Space.medium,
  },
  option: {
    backgroundColor: Color.lightgray,
    padding: Space.small,
    borderRadius: Space.small,
  },
  active: {
    backgroundColor: Color.highlight,
  },
})

const LanguageOption = ({
  name,
  onPress,
  active,
}: {
  name: string
  active: boolean
  onPress: (event: GestureResponderEvent) => void
}) => (
  <Pressable style={[styles.option, active && styles.active]} onPress={onPress}>
    <Text accessibilityState={{ selected: active }}>{name}</Text>
  </Pressable>
)

export const Settings = observer(() => {
  return (
    <Screen>
      <Header title="Settings">
        <Button
          background
          accessibilityLabel={Label.settingsBackButton}
          onPress={() => back()}
          title="Back"
        />
      </Header>
      <View style={styles.row}>
        <Text style={Font.bold}>Language</Text>
        <View style={styles.switch}>
          <LanguageOption
            name="English"
            active={Data.language === Language.English}
            onPress={() => Data.setLanguage(Language.English)}
          />
          <LanguageOption
            name="Spanish"
            active={Data.language === Language.Spanish}
            onPress={() => Data.setLanguage(Language.Spanish)}
          />
          <LanguageOption
            name="Chinese"
            active={Data.language === Language.Chinese}
            onPress={() => Data.setLanguage(Language.Chinese)}
          />
        </View>
      </View>
    </Screen>
  )
})
