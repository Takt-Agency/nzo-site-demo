import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faSpinner, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons'
import { adminApi } from '../../lib/api.js'

function dueDateDefault() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export default function FactureFormModal({ onClose, onSuccess }) {
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [form, setForm] = useState({
    userId: '',
    amount: '',
    dueDate: dueDateDefault(),
    vatRate: 8.1,
    status: 'pending',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    adminApi
      .listClients()
      .then((res) => setClients(res.items || []))
      .catch(() => setClients([]))
      .finally(() => setLoadingClients(false))
  }, [])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.userId || !form.amount) {
      setError('Client et montant requis')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await adminApi.createFacture({
        userId: form.userId,
        amount: Number(form.amount),
        dueDate: form.dueDate || undefined,
        vatRate: Number(form.vatRate),
        status: form.status,
      })
      onSuccess(res.facture)
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
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-primary">
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="h-4 w-4 text-secondary" />
            Nouvelle facture
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Client *
            </label>
            <select
              required
              value={form.userId}
              onChange={(e) => update({ userId: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            >
              <option value="">
                {loadingClients ? 'Chargement…' : '— Sélectionner un client —'}
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `— ${c.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Montant (CHF) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => update({ amount: e.target.value })}
                placeholder="1240"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                TVA (%)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.1"
                value={form.vatRate}
                onChange={(e) => update({ vatRate: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Échéance
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => update({ dueDate: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Statut initial
              </label>
              <select
                value={form.status}
                onChange={(e) => update({ status: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              >
                <option value="pending">À payer</option>
                <option value="paid">Payée</option>
              </select>
            </div>
          </div>

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
              Créer la facture
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
