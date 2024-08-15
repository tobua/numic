import React from 'react'
import 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { App } from '../App'
import { Label } from '../label'
import { Language, readableLanguage } from 'epic-language'

test('App renders without crashing.', async () => {
  const app = render(<App headless />)
  expect(app).toBeDefined()
  let title = app.getByLabelText(Label.screenTitle)
  expect(title).toHaveTextContent('Overview')
  // Navigate to settings screen.
  const settingsButton = app.getByLabelText(Label.openSettingsButton)
  fireEvent.press(settingsButton)
  title = app.getByLabelText(Label.screenTitle)
  expect(title).toHaveTextContent('Settings')
  // Switch language.
  const spanishButton = app.getByText(readableLanguage[Language.es].local)
  fireEvent.press(spanishButton)
  title = app.getByLabelText(Label.screenTitle)
  expect(title).toHaveTextContent('Ajustes')
})
