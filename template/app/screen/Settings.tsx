import React from 'react'
import { GestureResponderEvent, Text, View, Pressable } from 'react-native'
import { back } from 'reactigation'
import { createStyles } from 'responsive-react-native'
import { Language, readableLanguage } from 'epic-language/native'
import { Screen } from '../markup/Screen'
import { Button } from '../markup/Button'
import { Header } from '../markup/Header'
import { Label } from '../label'
import { observer } from 'mobx-react-lite'
import { Data } from '../data/Data'
import { Color, Font, Space } from '../style'
import { translate } from '../translation'

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
      <Header title={translate('settingsTitle', undefined, Data.language)}>
        <Button
          background
          accessibilityLabel={Label.settingsBackButton}
          onPress={() => back()}
          title={translate('settingsBack', undefined, Data.language)}
        />
      </Header>
      <View style={styles.row}>
        <Text style={Font.bold}>{translate('settingsLanguage', undefined, Data.language)}</Text>
        <View style={styles.switch}>
          <LanguageOption
            name={readableLanguage[Language.en].local}
            active={Data.language === Language.en}
            onPress={() => Data.setLanguage(Language.en)}
          />
          <LanguageOption
            name={readableLanguage[Language.es].local}
            active={Data.language === Language.es}
            onPress={() => Data.setLanguage(Language.es)}
          />
          <LanguageOption
            name={readableLanguage[Language.zh].local}
            active={Data.language === Language.zh}
            onPress={() => Data.setLanguage(Language.zh)}
          />
        </View>
      </View>
    </Screen>
  )
})
