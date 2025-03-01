export interface Options {
  iOSBackground?: string
  icon?: string
  androidForeground?: string
  androidBackground?: string
  androidBackgroundColor?: string
}

export type Log = (message: string, type?: 'warning' | 'error') => void
