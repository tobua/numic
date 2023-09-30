import { makeAutoObservable } from 'mobx'
import { Language } from '../types'

export const Data = new (class {
  language = Language.English

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  setLanguage(language: Language) {
    this.language = language
  }
})()
