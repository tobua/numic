import { MeshBasicMaterial, Color as ThreeColor } from 'three'

export const Color = {
  background: '#e9e9e9',
  backgroundDarker: '#d9d9d9',
  highlight: '#3add85',
  react: '#61dafb',
  black: 'black',
  transparent: 'transparent',
}

export const Material = {
  highlight: new MeshBasicMaterial({ color: new ThreeColor(Color.highlight) }),
  react: new MeshBasicMaterial({ color: new ThreeColor(Color.react) }),
}
