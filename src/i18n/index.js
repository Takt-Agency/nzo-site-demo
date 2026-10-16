import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import fr from './locales/fr.json'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import it from './locales/it.json'
import sr from './locales/sr.json'
import tr from './locales/tr.json'

export const languages = [
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', short: 'DE', flag: '🇩🇪' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'es', label: 'Español', short: 'ES', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', short: 'IT', flag: '🇮🇹' },
  { code: 'sr', label: 'Srpski', short: 'SR', flag: '🇷🇸' },
  { code: 'tr', label: 'Türkçe', short: 'TR', flag: '🇹🇷' },
]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      de: { translation: de },
      en: { translation: en },
      es: { translation: es },
      it: { translation: it },
      sr: { translation: sr },
      tr: { translation: tr },
    },
    fallbackLng: 'de',
    supportedLngs: languages.map((l) => l.code),
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'nzo-lang',
    },
  })

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng
  }
})

// HMR : recharge les bundles de traduction quand un .json est modifié pendant le dev.
// Sans ça, Vite recharge le module mais i18next garde l'ancien resource bundle en mémoire.
if (import.meta.hot) {
  import.meta.hot.accept(
    [
      './locales/fr.json',
      './locales/de.json',
      './locales/en.json',
      './locales/es.json',
      './locales/it.json',
      './locales/sr.json',
      './locales/tr.json',
    ],
    (modules) => {
      const map = { 0: 'fr', 1: 'de', 2: 'en', 3: 'es', 4: 'it', 5: 'sr', 6: 'tr' }
      modules.forEach((mod, i) => {
        if (!mod) return
        i18n.addResourceBundle(map[i], 'translation', mod.default, true, true)
      })
      i18n.changeLanguage(i18n.language)
    },
  )
}

export default i18n
