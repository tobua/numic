import { makeAutoObservable } from 'mobx'
import { Language } from 'epic-language/native'

export const Data = new (class {
  language = Language.en

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  setLanguage(language: Language) {
    this.language = language
  }
})()
