import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faMoneyBillTrendUp,
  faSpinner,
  faCircleCheck,
  faCircleExclamation,
  faTrash,
  faPlus,
  faPercent,
} from '@fortawesome/free-solid-svg-icons'
import { adminApi } from '../../lib/api.js'

const UNIT_OPTIONS = [
  { value: 'm²', label: '€ / m²' },
  { value: 'h', label: '€ / heure' },
  { value: 'forfait', label: 'Forfait' },
  { value: 'mois', label: '€ / mois' },
]

const SERVICE_LABELS = {
  bureaux: 'Bureaux',
  apresChantier: 'Fin de chantier',
  facades: 'Façades',
  conciergerie: 'Conciergerie',
  garages: 'Garages & parkings',
  photovoltaique: 'Panneaux photovoltaïques',
  arrosage: 'Arrosage des plantes',
  animaux: 'Soin des animaux en absence',
  jardins: 'Jardins',
  debarras: 'Débarras',
}

export default function PricingModal({ initial = {}, onClose, onSaved }) {
  const [form, setForm] = useState({
    currency: 'CHF',
    vatRate: 8.1,
    paymentTermsDays: 30,
    depositPercentage: 30,
    paymentTerms: '',
    rates: [],
    ...initial,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const update = (patch) => setForm((p) => ({ ...p, ...patch }))

  const updateRate = (idx, patch) => {
    setForm((p) => ({
      ...p,
      rates: p.rates.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    }))
  }

  const removeRate = (idx) => {
    setForm((p) => ({ ...p, rates: p.rates.filter((_, i) => i !== idx) }))
  }

  const addRate = () => {
    setForm((p) => ({
      ...p,
      rates: [...p.rates, { service: '', label: '', unit: 'm²', rate: 0 }],
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await adminApi.updateSettings({
        pricing: {
          currency: form.currency,
          vatRate: Number(form.vatRate) || 0,
          paymentTermsDays: Number(form.paymentTermsDays) || 30,
          depositPercentage: Number(form.depositPercentage) || 0,
          paymentTerms: form.paymentTerms || '',
          rates: form.rates.map((r) => ({
            service: r.service,
            label: r.label,
            unit: r.unit,
            rate: Number(r.rate) || 0,
          })),
        },
      })
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
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-primary">
              <FontAwesomeIcon icon={faMoneyBillTrendUp} className="h-4 w-4 text-secondary" />
              Tarification
            </h3>
            <p className="mt-0.5 text-[11px] font-medium text-gray-500">
              Grille tarifaire, TVA, conditions de paiement. Utilisé pour la facturation.
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
              <span className="text-sm font-bold text-emerald-800">Tarification mise à jour !</span>
            </div>
          )}

          {/* Globals */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Paramètres généraux
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-600">Devise</label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => update({ currency: e.target.value })}
                  placeholder="CHF"
                  maxLength={5}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600">TVA</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.1"
                    value={form.vatRate}
                    onChange={(e) => update({ vatRate: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-8 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  <FontAwesomeIcon
                    icon={faPercent}
                    className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600">
                  Délai paiement (jours)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.paymentTermsDays}
                  onChange={(e) => update({ paymentTermsDays: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600">Acompte (%)</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.depositPercentage}
                    onChange={(e) => update({ depositPercentage: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-8 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  <FontAwesomeIcon
                    icon={faPercent}
                    className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rate grid */}
          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Grille tarifaire
              </div>
              <button
                type="button"
                onClick={addRate}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-secondary px-3 py-1 text-[11px] font-bold text-secondary transition hover:bg-secondary hover:text-white"
              >
                <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                Ajouter une ligne
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {form.rates.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center text-xs font-medium text-gray-500">
                  Aucun tarif défini. Cliquez sur « Ajouter une ligne » pour commencer.
                </div>
              ) : (
                form.rates.map((r, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2 rounded-xl border border-gray-200 p-3 md:grid-cols-[1fr_1.4fr_120px_120px_auto]"
                  >
                    <input
                      type="text"
                      value={r.service}
                      onChange={(e) => updateRate(idx, { service: e.target.value })}
                      placeholder="Clé service (ex. bureaux)"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      list={`services-${idx}`}
                    />
                    <datalist id={`services-${idx}`}>
                      {Object.keys(SERVICE_LABELS).map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                    <input
                      type="text"
                      value={r.label}
                      onChange={(e) => updateRate(idx, { label: e.target.value })}
                      placeholder="Libellé affiché"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                    <select
                      value={r.unit}
                      onChange={(e) => updateRate(idx, { unit: e.target.value })}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.rate}
                        onChange={(e) => updateRate(idx, { rate: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-12 text-right text-xs font-bold focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                        {form.currency}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRate(idx)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Supprimer cette ligne"
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment terms text */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Mentions de paiement (affichées sur la facture)
            </label>
            <textarea
              rows={3}
              maxLength={400}
              value={form.paymentTerms}
              onChange={(e) => update({ paymentTerms: e.target.value })}
              placeholder="Ex. Paiement par virement bancaire à 30 jours. Intérêts de retard 5% en cas de non-paiement."
              className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </div>

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
