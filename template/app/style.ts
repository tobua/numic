import { createStyles } from 'responsive-react-native'

export const Color = {
  highlight: '#3ADD85',
  interact: '#DD3A92',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#D9D9D9',
  lightgray: '#E9E9E9',
}

export const Font = createStyles({
  title: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  text: {
    fontSize: 14,
  },
  bold: {
    fontWeight: 'bold',
  },
  highlight: {
    color: Color.highlight,
  },
  interact: {
    color: Color.interact,
  },
})

export const Space = {
  huge: 40,
  large: 20,
  medium: 10,
  small: 5,
}
