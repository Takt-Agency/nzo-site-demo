import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faBuilding,
  faSpinner,
  faCircleCheck,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { adminApi } from '../../lib/api.js'

const FIELDS = [
  {
    section: 'Identité',
    cols: 2,
    items: [
      { key: 'name', label: 'Raison sociale *', required: true, placeholder: 'Nzo Immo Clean Sàrl' },
      { key: 'legalForm', label: 'Forme juridique', placeholder: 'Sàrl, SA, …' },
      { key: 'ide', label: 'N° IDE / SIRET', placeholder: 'CHE-XXX.XXX.XXX', cols: 2 },
    ],
  },
  {
    section: 'Adresse',
    cols: 2,
    items: [
      { key: 'address', label: 'Adresse *', required: true, placeholder: 'Gellertpark …', cols: 2 },
      { key: 'postalCode', label: 'Code postal', placeholder: '4052' },
      { key: 'city', label: 'Ville', placeholder: 'Bâle' },
      { key: 'country', label: 'Pays', placeholder: 'Suisse' },
    ],
  },
  {
    section: 'Contact',
    cols: 2,
    items: [
      { key: 'phone', label: 'Téléphone', placeholder: '+41 79 936 21 73' },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'info@nzoimmoclean.ch' },
      { key: 'website', label: 'Site web', placeholder: 'www.nzoimmoclean.ch', cols: 2 },
    ],
  },
  {
    section: 'Coordonnées bancaires',
    cols: 2,
    items: [
      { key: 'iban', label: 'IBAN', placeholder: 'CH00 0000 0000 0000 0000 0' },
      { key: 'bank', label: 'Banque', placeholder: 'BCV, UBS, …' },
    ],
  },
]

export default function CompanyModal({ initial = {}, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    name: '',
    legalForm: '',
    ide: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'Suisse',
    phone: '',
    email: '',
    website: '',
    iban: '',
    bank: '',
    ...initial,
  }))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const update = (patch) => setForm((p) => ({ ...p, ...patch }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await adminApi.updateSettings({ company: form })
      setSuccess(true)
      onSaved?.(res.settings)
      setTimeout(() => onClose(), 1100)
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-primary">
              <FontAwesomeIcon icon={faBuilding} className="h-4 w-4 text-secondary" />
              Société
            </h3>
            <p className="mt-0.5 text-[11px] font-medium text-gray-500">
              Ces informations apparaîtront sur les factures et documents officiels.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 space-y-5 overflow-y-auto p-5">
          {success && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-800">Société mise à jour !</span>
            </div>
          )}

          {FIELDS.map((section) => (
            <div key={section.section}>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {section.section}
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {section.items.map((f) => (
                  <div key={f.key} className={f.cols === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-[11px] font-bold text-gray-600">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      required={f.required}
                      value={form[f.key] || ''}
                      onChange={(e) => update({ [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
              {error}
            </div>
          )}
        </form>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 px-5 py-2 text-xs font-bold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="btn-primary px-5 py-2 text-xs disabled:opacity-50"
          >
            {submitting && <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
