import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faSpinner, faUserPen } from '@fortawesome/free-solid-svg-icons'
import { adminApi } from '../../lib/api.js'

const TYPES = [
  { value: 'particulier', label: 'Particulier' },
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'proImmo', label: 'Pro immo' },
  { value: 'association', label: 'Association' },
]

export default function ClientEditModal({ client, onClose, onSuccess }) {
  const [form, setForm] = useState({
    firstName: client.firstName || '',
    lastName: client.lastName || '',
    phone: client.phone || '',
    company: client.company || '',
    siret: client.siret || '',
    representativeRole: client.representativeRole || '',
    accountType: client.type || 'particulier',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))
  const isCompany = form.accountType !== 'particulier'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Prénom et nom requis')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        company: isCompany ? form.company.trim() || undefined : undefined,
        siret: isCompany ? form.siret.trim() || undefined : undefined,
        representativeRole: isCompany
          ? form.representativeRole.trim() || undefined
          : undefined,
        accountType: form.accountType,
      }
      const res = await adminApi.updateClient(client.id, payload)
      onSuccess(res.client)
      onClose()
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-primary">
            <FontAwesomeIcon icon={faUserPen} className="h-4 w-4 text-secondary" />
            Modifier le client
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
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Email
            </label>
            <input
              type="email"
              value={client.email}
              readOnly
              className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-500"
            />
            <p className="mt-1 text-[11px] font-medium text-gray-400">
              L'email ne peut pas être modifié.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Type de compte
              </label>
              <select
                value={form.accountType}
                onChange={(e) => update({ accountType: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Téléphone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update({ phone: e.target.value })}
                placeholder="+41 79 ..."
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          {isCompany && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Société / raison sociale
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => update({ company: e.target.value })}
                  placeholder="Régie Léman SA"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                    SIRET / N° entreprise
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
                    Fonction du représentant
                  </label>
                  <input
                    type="text"
                    value={form.representativeRole}
                    onChange={(e) => update({ representativeRole: e.target.value })}
                    placeholder="Directeur, Gérant…"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
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
              disabled={submitting}
              className="btn-primary px-5 py-2 text-xs disabled:opacity-50"
            >
              {submitting && <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
