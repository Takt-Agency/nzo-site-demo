import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faSpinner, faUser, faKey } from '@fortawesome/free-solid-svg-icons'
import { adminApi } from '../../lib/api.js'

const ACCOUNT_TYPES = [
  { value: 'particulier', label: 'Particulier' },
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'proImmo', label: 'Pro immo' },
  { value: 'association', label: 'Association' },
]

// Admin-side manual client creation. Always creates a real login account
// (email + password are required). Company / siret / representativeRole are
// only relevant when accountType !== 'particulier'.
export default function ClientFormModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    accountType: 'particulier',
    company: '',
    siret: '',
    representativeRole: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))
  const isParticulier = form.accountType === 'particulier'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password.trim().length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        accountType: form.accountType,
        phone: form.phone.trim() || undefined,
      }
      if (!isParticulier) {
        payload.company = form.company.trim() || undefined
        payload.siret = form.siret.trim() || undefined
        payload.representativeRole = form.representativeRole.trim() || undefined
      }
      const res = await adminApi.createClient(payload)
      onSuccess?.(res.client)
      onClose()
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-primary">
            <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-secondary" />
            Ajouter un client
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100vh-12rem)] space-y-4 overflow-y-auto p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => update({ firstName: e.target.value })}
                placeholder="Sophie"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Nom *
              </label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => update({ lastName: e.target.value })}
                placeholder="Martin"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Type de compte *
            </label>
            <select
              value={form.accountType}
              onChange={(e) => update({ accountType: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="sophie.martin@example.ch"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Téléphone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update({ phone: e.target.value })}
                placeholder="+41 79 555 12 11"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          {!isParticulier && (
            <div className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Société
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => update({ company: e.target.value })}
                  placeholder="Nzo Immo SA"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  IDE / SIRET
                </label>
                <input
                  type="text"
                  value={form.siret}
                  onChange={(e) => update({ siret: e.target.value })}
                  placeholder="CHE-123.456.789"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Fonction
                </label>
                <input
                  type="text"
                  value={form.representativeRole}
                  onChange={(e) => update({ representativeRole: e.target.value })}
                  placeholder="Directeur"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
            </div>
          )}

          <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faKey} className="h-3.5 w-3.5 text-accent-700" />
              <div className="text-xs font-bold uppercase tracking-wider text-accent-700">
                Accès à l'espace client
              </div>
            </div>
            <p className="mt-2 text-[11px] font-medium leading-relaxed text-gray-600">
              Définissez un mot de passe pour permettre au client de se connecter à son
              espace. Vous pourrez le communiquer manuellement.
            </p>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={(e) => update({ password: e.target.value })}
              placeholder="Mot de passe (8 caractères min.)"
              className="mt-2.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 px-5 py-2 text-xs font-bold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-5 py-2 text-xs disabled:opacity-50"
            >
              {submitting && (
                <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
              )}
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
