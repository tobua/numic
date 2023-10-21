import { create, Language } from 'epic-language/native'

export const { translate, Text } = create(
  {
    settingsTitle: 'Settings',
    settingsLanguage: 'Language',
    settingsBack: 'Back',
  },
  {
    [Language.es]: {
      settingsTitle: 'Ajustes',
      settingsLanguage: 'Idioma',
      settingsBack: 'Atrás',
    },
    [Language.zh]: {
      settingsTitle: '设置',
      settingsLanguage: '语言',
      settingsBack: '后退',
    },
  },
  Language.en
)
