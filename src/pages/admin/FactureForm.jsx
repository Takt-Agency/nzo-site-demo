import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faFileInvoiceDollar,
  faSpinner,
  faCircleExclamation,
  faCircleCheck,
  faSprayCanSparkles,
  faPercent,
  faMoneyBillTrendUp,
  faCalendarDay,
  faUser,
  faNoteSticky,
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import { adminApi, ApiError } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function dueDateDefault() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

function toDateInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function formatCurrency(n, currency = 'CHF') {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(n || 0)
}

export default function AdminFactureForm() {
  const navigate = useNavigate()
  const { id } = useParams() // edit mode if present
  const [searchParams] = useSearchParams()
  const editing = !!id
  const prefillMissionId = searchParams.get('mission') || ''
  const prefillClientId = searchParams.get('client') || ''

  // Load existing facture in edit mode.
  const factureFetcher = useCallback(
    () => (editing ? adminApi.getFacture(id) : Promise.resolve({ facture: null })),
    [id, editing],
  )
  const { data: factureData, loading: loadingFacture, error: loadError } = useApi(factureFetcher, [
    id,
    editing,
  ])
  const existing = factureData?.facture

  // Clients + missions + global settings for pickers / defaults.
  const [clients, setClients] = useState([])
  const [missions, setMissions] = useState([])
  const [settings, setSettings] = useState(null)
  const [pickersLoading, setPickersLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      adminApi.listClients(),
      adminApi.listMissions({ status: 'completed' }),
      adminApi.getSettings(),
    ])
      .then(([c, m, s]) => {
        if (cancelled) return
        setClients(c.items || [])
        setMissions(m.items || [])
        setSettings(s.settings || null)
      })
      .catch(() => {
        /* picker data is optional */
      })
      .finally(() => {
        if (!cancelled) setPickersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const [form, setForm] = useState({
    userId: '',
    missionId: '',
    number: '',
    amount: '',
    vatRate: 8.1,
    currency: 'CHF',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: dueDateDefault(),
    status: 'pending',
    notes: '',
    pdfUrl: '',
  })
  const [hydrated, setHydrated] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Prefill from existing or query-string mission.
  useEffect(() => {
    if (editing && existing && !hydrated) {
      setForm({
        userId: existing.clientId || '',
        missionId: existing.mission || '',
        number: existing.number || '',
        amount: String(existing.amount ?? ''),
        vatRate: existing.vatRate ?? settings?.pricing?.vatRate ?? 8.1,
        currency: existing.currency || settings?.pricing?.currency || 'CHF',
        issueDate: toDateInput(existing.issueDate) || new Date().toISOString().slice(0, 10),
        dueDate: toDateInput(existing.dueDate) || dueDateDefault(),
        status: existing.status || 'pending',
        notes: existing.notes || '',
        pdfUrl: existing.pdfUrl || '',
      })
      setHydrated(true)
    } else if (!editing && settings && !hydrated) {
      // First load in create mode: apply Settings defaults (TVA, devise,
      // échéance) once we have them.
      const days = Number(settings?.pricing?.paymentTermsDays) || 30
      const due = new Date()
      due.setDate(due.getDate() + days)
      setForm((prev) => ({
        ...prev,
        vatRate: settings.pricing?.vatRate ?? prev.vatRate,
        currency: settings.pricing?.currency || prev.currency,
        dueDate: due.toISOString().slice(0, 10),
      }))
      // Then layer in mission/client prefill from query string.
      if ((prefillMissionId || prefillClientId) && missions.length > 0) {
        const m = missions.find((x) => x.id === prefillMissionId)
        if (m) {
          setForm((prev) => ({
            ...prev,
            userId: m.clientId || prefillClientId || prev.userId,
            missionId: m.id,
            amount: m.amount != null ? String(m.amount) : prev.amount,
            notes: prev.notes || `Mission ${m.title}`,
          }))
        } else if (prefillClientId) {
          setForm((prev) => ({ ...prev, userId: prefillClientId }))
        }
      }
      setHydrated(true)
    }
  }, [editing, existing, hydrated, prefillMissionId, prefillClientId, missions, settings])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  // When the admin picks a mission, prefill client + amount automatically.
  const onPickMission = (missionId) => {
    if (!missionId) {
      update({ missionId: '' })
      return
    }
    const m = missions.find((x) => x.id === missionId)
    if (!m) {
      update({ missionId })
      return
    }
    update({
      missionId,
      userId: m.clientId || form.userId,
      amount: form.amount || (m.amount != null ? String(m.amount) : ''),
      notes: form.notes || `Mission ${m.title}`,
    })
  }

  const totalTTC = useMemo(() => {
    const a = Number(form.amount) || 0
    const v = Number(form.vatRate) || 0
    return a * (1 + v / 100)
  }, [form.amount, form.vatRate])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.userId || !form.amount) {
      setError('Client et montant sont requis.')
      return
    }
    if (Number(form.amount) <= 0) {
      setError('Le montant doit être supérieur à 0.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        userId: form.userId,
        missionId: form.missionId || undefined,
        number: form.number || undefined,
        amount: Number(form.amount),
        vatRate: Number(form.vatRate),
        currency: form.currency,
        issueDate: form.issueDate || undefined,
        dueDate: form.dueDate || undefined,
        status: form.status,
        notes: form.notes || undefined,
        pdfUrl: form.pdfUrl || undefined,
      }
      if (editing) {
        await adminApi.updateFacture(id, payload)
      } else {
        await adminApi.createFacture(payload)
      }
      navigate('/admin/factures')
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  // --- Loading / error states ---------------------------------------------
  if (editing && loadingFacture) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200" />
        <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    )
  }
  if (editing && loadError) {
    const is404 = loadError instanceof ApiError && loadError.status === 404
    return (
      <div className="space-y-4">
        <Link
          to="/admin/factures"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          Retour aux factures
        </Link>
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faCircleExclamation} className="h-8 w-8 text-gray-400" />
          <h2 className="mt-4 text-lg font-bold text-primary">
            {is404 ? 'Facture introuvable' : 'Erreur de chargement'}
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/factures"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        Retour aux factures
      </Link>

      <AdminPageHeader
        eyebrow={editing ? `FA — ${form.number || 'Modification'}` : 'NOUVELLE FACTURE'}
        title={editing ? 'Modifier la facture' : 'Créer une facture'}
        description={
          editing
            ? 'Mettez à jour le client, montant, échéance ou statut.'
            : 'Renseignez les détails et envoyez la facture au client. Un email de notification lui sera envoyé.'
        }
      />

      <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Client & mission */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
              <FontAwesomeIcon icon={faUser} className="h-3.5 w-3.5 text-secondary" />
              Client & mission
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Client *
                </label>
                <select
                  required
                  value={form.userId}
                  onChange={(e) => update({ userId: e.target.value })}
                  disabled={pickersLoading}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:opacity-50"
                >
                  <option value="">
                    {pickersLoading ? 'Chargement…' : '— Sélectionner un client —'}
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.company ? ` — ${c.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Mission liée — optionnel
                </label>
                <select
                  value={form.missionId}
                  onChange={(e) => onPickMission(e.target.value)}
                  disabled={pickersLoading}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:opacity-50"
                >
                  <option value="">— Aucune —</option>
                  {missions
                    .filter((m) => !form.userId || m.clientId === form.userId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} — {m.clientName}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-[10px] font-medium text-gray-400">
                  Sélectionner une mission préremplit le montant et le client.
                </p>
              </div>
            </div>
          </div>

          {/* Auto-calc from rate grid */}
          {settings?.pricing?.rates?.length > 0 && (
            <RateCalculator
              rates={settings.pricing.rates}
              currency={form.currency}
              onApply={(computed) => update({ amount: String(computed) })}
            />
          )}

          {/* Amount */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
              <FontAwesomeIcon icon={faMoneyBillTrendUp} className="h-3.5 w-3.5 text-secondary" />
              Montant
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Montant HT *
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => update({ amount: e.target.value })}
                    placeholder="1240"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-14 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    {form.currency}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  TVA
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.1"
                    value={form.vatRate}
                    onChange={(e) => update({ vatRate: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-9 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  <FontAwesomeIcon
                    icon={faPercent}
                    className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-2 rounded-xl bg-gray-50 p-3 text-xs sm:grid-cols-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Sous-total HT
                </div>
                <div className="mt-0.5 text-sm font-bold text-primary">
                  {formatCurrency(Number(form.amount) || 0, form.currency)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  TVA ({form.vatRate}%)
                </div>
                <div className="mt-0.5 text-sm font-bold text-primary">
                  {formatCurrency(
                    (Number(form.amount) || 0) * ((Number(form.vatRate) || 0) / 100),
                    form.currency,
                  )}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-accent-700">
                  Total TTC
                </div>
                <div className="mt-0.5 text-base font-bold text-accent-700">
                  {formatCurrency(totalTTC, form.currency)}
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
              <FontAwesomeIcon icon={faCalendarDay} className="h-3.5 w-3.5 text-secondary" />
              Dates & numéro
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Numéro
                </label>
                <input
                  type="text"
                  value={form.number}
                  onChange={(e) => update({ number: e.target.value })}
                  placeholder="Auto FA-YYYY-NNN"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Émise le
                </label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => update({ issueDate: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
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
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
              <FontAwesomeIcon icon={faNoteSticky} className="h-3.5 w-3.5 text-secondary" />
              Notes internes
            </h2>
            <textarea
              rows={3}
              maxLength={2000}
              value={form.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Conditions, références, détails internes…"
              className="mt-3 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Statut</h2>
            <div className="mt-3 space-y-2">
              {[
                { value: 'pending', label: 'À payer' },
                { value: 'paid', label: 'Payée' },
                { value: 'overdue', label: 'En retard' },
                { value: 'cancelled', label: 'Annulée' },
              ].map((s) => {
                const active = form.status === s.value
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => update({ status: s.value })}
                    className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-2 text-left text-xs font-bold transition ${
                      active
                        ? 'border-accent bg-accent/5 text-accent-700'
                        : 'border-gray-200 text-gray-700 hover:border-accent/40 hover:text-primary'
                    }`}
                  >
                    {s.label}
                    {active && <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />}
                  </button>
                )
              })}
            </div>
          </div>

          {form.missionId && (
            <div className="rounded-2xl border-2 border-dashed border-secondary/30 bg-secondary-50/40 p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-secondary-700">
                <FontAwesomeIcon icon={faSprayCanSparkles} className="h-3 w-3" />
                Conversion depuis mission
              </div>
              <p className="mt-1 leading-relaxed text-gray-600">
                Cette facture sera reliée à la mission. Le client verra le lien dans sa fiche.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full px-5 py-3 text-sm disabled:opacity-50"
            >
              {submitting ? (
                <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="h-3.5 w-3.5" />
              )}
              {editing ? 'Enregistrer' : 'Créer la facture'}
            </button>
            {editing && id && (
              <a
                href={`/admin/factures/${id}/imprimer`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-50 px-5 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100"
              >
                <FontAwesomeIcon icon={faFilePdf} className="h-3.5 w-3.5" />
                Télécharger en PDF
              </a>
            )}
            <Link
              to="/admin/factures"
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-gray-200 px-5 py-3 text-xs font-bold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Annuler
            </Link>
          </div>
        </aside>
      </form>
    </div>
  )
}

// ----- Auto-calc helper from the pricing grid ----------------------------
// Lets the admin pick a service tarif, enter a quantity, and apply the
// computed amount to the invoice's HT field in one click. Uses Settings
// rates so changes to the pricing grid propagate automatically.
function RateCalculator({ rates, currency, onApply }) {
  const [serviceKey, setServiceKey] = useState(rates[0]?.service || '')
  const [quantity, setQuantity] = useState('')
  const selected = rates.find((r) => r.service === serviceKey)
  const computed = (Number(quantity) || 0) * (selected?.rate || 0)

  return (
    <div className="rounded-2xl bg-gradient-to-br from-secondary-50 to-white p-5 shadow-sm ring-1 ring-secondary/20">
      <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
        <FontAwesomeIcon icon={faMoneyBillTrendUp} className="h-3.5 w-3.5 text-secondary" />
        Calcul automatique
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-700">
          Depuis la grille tarifaire
        </span>
      </h2>
      <p className="mt-1 text-xs font-medium text-gray-500">
        Choisissez un service, entrez la quantité — le montant HT est calculé puis appliqué.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1.5fr_1fr_auto]">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Service
          </label>
          <select
            value={serviceKey}
            onChange={(e) => setServiceKey(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          >
            {rates.map((r) => (
              <option key={r.service} value={r.service}>
                {r.label || r.service} — {r.rate} {currency} / {r.unit}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Quantité ({selected?.unit || 'm²'})
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={selected?.unit === 'forfait' ? '1' : '120'}
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
        <button
          type="button"
          onClick={() => onApply(computed.toFixed(2))}
          disabled={!quantity || !selected}
          className="self-end inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-secondary/30 transition hover:bg-secondary-600 disabled:opacity-50"
        >
          Appliquer{' '}
          {computed > 0
            ? new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(computed)
            : ''}
        </button>
      </div>
    </div>
  )
}
