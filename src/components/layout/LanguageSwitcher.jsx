import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faGlobe, faCheck } from '@fortawesome/free-solid-svg-icons'
import { languages } from '../../i18n'
import CountryFlag from './CountryFlag.jsx'

export default function LanguageSwitcher({ compact = false, dropUp = false }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = languages.find((l) => l.code === i18n.resolvedLanguage) ?? languages[0]

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  function pick(code) {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 transition hover:text-accent"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={compact ? current.label : undefined}
      >
        {compact ? (
          <FontAwesomeIcon icon={faGlobe} className="h-5 w-5" />
        ) : (
          <>
            <CountryFlag code={current.code} className="h-3 w-4" />
            <span className="font-medium">{current.short}</span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`h-2.5 w-2.5 transition ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute right-0 z-50 w-44 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 text-gray-700 shadow-xl ${
            dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {languages.map((lang) => {
            const active = lang.code === current.code
            return (
              <li key={lang.code}>
                <button
                  type="button"
                  onClick={() => pick(lang.code)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition hover:bg-gray-50 ${
                    active ? 'font-semibold text-primary' : ''
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <CountryFlag code={lang.code} className="h-3.5 w-5 shrink-0" />
                    <span>{lang.label}</span>
                  </span>
                  {active && <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5 text-accent" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
