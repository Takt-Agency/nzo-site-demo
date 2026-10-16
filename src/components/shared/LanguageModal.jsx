import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faGlobe,
  faCircleCheck,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons'

const LANGUAGES = [
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'sr', label: 'Srpski', flag: '🇷🇸' },
  { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
]

const TIMEZONES = [
  { value: 'Europe/Zurich', label: 'Suisse — Zurich (UTC+1)' },
  { value: 'Europe/Paris', label: 'France — Paris (UTC+1)' },
  { value: 'Europe/Berlin', label: 'Allemagne — Berlin (UTC+1)' },
  { value: 'Europe/Madrid', label: 'Espagne — Madrid (UTC+1)' },
  { value: 'Europe/Rome', label: 'Italie — Rome (UTC+1)' },
  { value: 'Europe/Belgrade', label: 'Serbie — Belgrade (UTC+1)' },
  { value: 'Europe/Istanbul', label: 'Turquie — Istanbul (UTC+3)' },
]

// Language + region picker. Works in two modes:
// - admin: shows both UI language + system defaults (timezone) and persists
//   the system default via onSave (PATCH /admin/settings)
// - agent/client: shows only the UI language and switches it locally
export default function LanguageModal({ onClose, onSave, initial = {}, mode = 'agent' }) {
  const { i18n } = useTranslation()
  const [lang, setLang] = useState(initial.language || i18n.language || 'fr')
  const [tz, setTz] = useState(initial.timezone || 'Europe/Zurich')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      // Always update the UI language locally so the change is immediate.
      await i18n.changeLanguage(lang)
      if (onSave) {
        await onSave({ language: lang, timezone: tz })
      }
      setSuccess(true)
      setTimeout(() => onClose(), 1200)
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-primary">
            <FontAwesomeIcon icon={faGlobe} className="h-4 w-4 text-secondary" />
            Langue et région
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-5">
          {success ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5 text-emerald-600" />
              <div className="text-sm font-bold text-emerald-800">Préférences enregistrées !</div>
            </div>
          ) : (
            <>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Langue d'affichage
                </div>
                <p className="mt-1 text-[11px] font-medium text-gray-400">
                  S'applique immédiatement à toute l'interface.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {LANGUAGES.map((l) => {
                    const active = lang === l.value
                    return (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLang(l.value)}
                        className={`flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition ${
                          active
                            ? 'border-secondary bg-secondary/5'
                            : 'border-gray-200 hover:border-secondary/40'
                        }`}
                      >
                        <span className="text-base">{l.flag}</span>
                        <span className="text-xs font-bold text-primary">{l.label}</span>
                        {active && (
                          <FontAwesomeIcon
                            icon={faCircleCheck}
                            className="ml-auto h-3.5 w-3.5 text-secondary"
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {mode === 'admin' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Fuseau horaire — pour les dates / heures
                  </label>
                  <select
                    value={tz}
                    onChange={(e) => setTz(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 px-5 py-2 text-xs font-bold text-gray-700 transition hover:border-primary hover:text-primary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-5 py-2 text-xs disabled:opacity-50"
                >
                  Enregistrer
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
