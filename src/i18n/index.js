// ============================================================
//  i18n 主入口 —— 6 种语言：en / es / fr / de / it / zh
// ============================================================
import { createI18n } from 'vue-i18n'
import en from './locales/en.js'
import es from './locales/es.js'
import fr from './locales/fr.js'
import de from './locales/de.js'
import it from './locales/it.js'
import zh from './locales/zh.js'

// 浏览器语言 → 支持的语言
const SUPPORTED = ['en', 'es', 'fr', 'de', 'it', 'zh']

function detectBrowserLocale() {
  try {
    const nav = navigator.language || navigator.userLanguage || 'en'
    const code = nav.slice(0, 2).toLowerCase()
    return SUPPORTED.includes(code) ? code : 'en'
  } catch {
    return 'en'
  }
}

function loadStoredOrDetected() {
  try {
    const saved = localStorage.getItem('legal-ai-lang')
    if (saved && SUPPORTED.includes(saved)) return saved
  } catch {}
  return detectBrowserLocale()
}

export const i18n = createI18n({
  legacy: false,
  locale: loadStoredOrDetected(),
  fallbackLocale: 'en',
  messages: { en, es, fr, de, it, zh }
})

export const LANGUAGES = [
  { code: 'en', name: 'English',    native: 'English',     flag: '🇬🇧', countries: ['US', 'GB', 'CA', 'AU', 'NZ'] },
  { code: 'es', name: 'Spanish',    native: 'Español',     flag: '🇪🇸', countries: ['ES', 'MX', 'AR', 'CL', 'CO'] },
  { code: 'fr', name: 'French',     native: 'Français',    flag: '🇫🇷', countries: ['FR', 'CA', 'BE', 'CH'] },
  { code: 'de', name: 'German',     native: 'Deutsch',     flag: '🇩🇪', countries: ['DE', 'AT', 'CH'] },
  { code: 'it', name: 'Italian',    native: 'Italiano',    flag: '🇮🇹', countries: ['IT', 'CH'] },
  { code: 'zh', name: 'Chinese',    native: '中文',        flag: '🇨🇳', countries: ['CN', 'SG', 'TW'] },
]

export function setLocale(code) {
  if (!SUPPORTED.includes(code)) code = 'en'
  i18n.global.locale.value = code
  try { localStorage.setItem('legal-ai-lang', code) } catch {}
  document.documentElement.lang = code
}

export function getLocale() {
  return i18n.global.locale.value
}

// 国家 → 默认语言
export function guessLocaleFromCountry(countryCode) {
  const map = {
    US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en',
    ES: 'es', MX: 'es', AR: 'es', CL: 'es', CO: 'es',
    FR: 'fr', BE: 'fr',
    DE: 'de', AT: 'de',
    IT: 'it',
    CN: 'zh', SG: 'zh', TW: 'zh',
  }
  return map[countryCode] || 'en'
}
