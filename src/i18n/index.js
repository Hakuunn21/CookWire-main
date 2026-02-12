import messagesEn from './messages.en'
import messagesJa from './messages.ja'

const dictionaries = {
  en: messagesEn,
  ja: messagesJa,
}

const SUPPORTED_LANGUAGES = ['en', 'ja']

const resolveLanguage = (value) => (SUPPORTED_LANGUAGES.includes(value) ? value : 'en')

export const tFor = (language) => {
  const dict = dictionaries[resolveLanguage(language)] || dictionaries.en
  return (key) => dict[key] || dictionaries.en[key] || key
}
