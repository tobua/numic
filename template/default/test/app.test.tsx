import 'react-native'
import React from 'react'
import { App } from '../App'
import renderer from 'react-test-renderer'

test('App renders without crashing.', () => {
  renderer.create(<App />)
})
