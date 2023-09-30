import React from 'react'
import Reactigation, { register } from 'reactigation'
import { Overview } from './screen/Overview'
import { Settings } from './screen/Settings'

register(<Overview />, 'Overview')
register(<Settings />, 'Settings')

export const App = Reactigation
