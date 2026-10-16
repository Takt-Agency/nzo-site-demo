import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faSpinner,
  faSprayCanSparkles,
  faPhone,
} from '@fortawesome/free-solid-svg-icons'
import { adminApi } from '../../lib/api.js'
import {
  SERVICES,
  SERVICE_STEP2_FIELDS,
  FREQUENCIES,
  PLANT_LOCATIONS,
  VISIT_FREQUENCIES,
  PET_TYPES,
  VISITS_PER_DAY,
  ROOF_TYPES,
  LOCATION_TYPES,
} from '../../lib/devisConfig.js'

// Service key → French label. Matches the wording used in the devis form
// so the same vocabulary carries over when the admin is on the phone with
// a client and picks a service directly.
const SERVICE_LABELS = {
  bureaux: 'Nettoyage bureaux',
  apresChantier: 'Après chantier',
  facades: 'Façades',
  conciergerie: 'Conciergerie',
  garages: 'Garages',
  photovoltaique: 'Panneaux photovoltaïques',
  arrosage: 'Arrosage plantes',
  animaux: 'Soin animaux',
  jardins: 'Jardins',
  debarras: 'Débarras',
}

// Per-field metadata (label, kind, options) — drives the dynamic renderer.
// Only lists fields specific to the service; the base fields (date, notes,
// address, etc.) are hard-coded in the main form.
const FIELD_META = {
  surface: { label: 'Surface (m²)', kind: 'number', min: 1 },
  rooms: { label: 'Nombre de pièces', kind: 'number', min: 1 },
  frequency: { label: 'Fréquence', kind: 'select', options: FREQUENCIES },
  endDate: { label: 'Date de fin', kind: 'date' },
  panelCount: { label: 'Nombre de panneaux', kind: 'number', min: 1 },
  roofType: { label: 'Type de toit', kind: 'select', options: ROOF_TYPES },
  plantCount: { label: 'Nombre de plantes', kind: 'number', min: 1 },
  plantLocation: {
    label: 'Emplacement des plantes',
    kind: 'select',
    options: PLANT_LOCATIONS,
  },
  visitFrequency: {
    label: 'Fréquence des visites',
    kind: 'select',
    options: VISIT_FREQUENCIES,
  },
  petType: { label: 'Type d\'animal', kind: 'select', options: PET_TYPES },
  petCount: { label: 'Nombre d\'animaux', kind: 'number', min: 1 },
  visitsPerDay: {
    label: 'Visites par jour',
    kind: 'select',
    options: VISITS_PER_DAY,
  },
  buildingUnits: { label: 'Unités du bâtiment', kind: 'number', min: 1 },
  parkingSpaces: { label: 'Places de parking', kind: 'number', min: 1 },
  volume: { label: 'Volume (m³)', kind: 'number', min: 1 },
  locationType: { label: 'Type de lieu', kind: 'select', options: LOCATION_TYPES },
}

// Nicer labels for enum values that would otherwise show as raw camelCase.
const ENUM_LABELS = {
  unique: 'Unique',
  hebdo: 'Hebdomadaire',
  bimensuel: 'Bi-mensuel',
  mensuel: 'Mensuel',
  interieur: 'Intérieur',
  balcon: 'Balcon',
  jardin: 'Jardin',
  mixte: 'Mixte',
  quotidien: 'Quotidien',
  deuxJours: 'Tous les 2 jours',
  deuxParSemaine: '2 × par semaine',
  ponctuel: 'Ponctuel',
  chat: 'Chat',
  chien: 'Chien',
  autre: 'Autre',
  plat: 'Plat',
  incline: 'Incliné',
  tuile: 'Tuile',
  cave: 'Cave',
  grenier: 'Grenier',
  appartement: 'Appartement',
  bureau: 'Bureau',
  garage: 'Garage',
}

function tomorrowIso() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  // toISOString includes seconds/millis — datetime-local wants only YYYY-MM-DDTHH:MM.
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Convert an ISO date string / Date object into the "YYYY-MM-DDTHH:MM"
// shape expected by <input type="datetime-local">.
function toDatetimeLocal(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Direct-create modal for a mission with no source devis. Used when a
// client calls in and the admin books the intervention right there without
// going through the quote pipeline. Also used to schedule the next
// occurrence of a recurring mission (prefill props carry the source data).
export default function NewMissionModal({
  onClose,
  onSuccess,
  prefillClientId,
  prefill,
}) {
  const [clients, setClients] = useState([])
  const [agents, setAgents] = useState([])
  const [loadingRefs, setLoadingRefs] = useState(true)
  const [clientQuery, setClientQuery] = useState('')

  const [form, setForm] = useState(() => ({
    userId: prefill?.userId || prefillClientId || '',
    service: prefill?.service || 'bureaux',
    title: prefill?.title || '',
    address: prefill?.address || '',
    city: prefill?.city || '',
    date: prefill?.date ? toDatetimeLocal(prefill.date) : tomorrowIso(),
    endDate: prefill?.endDate ? toDatetimeLocal(prefill.endDate) : '',
    duration: prefill?.duration ?? 4,
    staffIds: Array.isArray(prefill?.staffIds) ? prefill.staffIds : [],
    amount: prefill?.amount != null ? String(prefill.amount) : '',
    notes: prefill?.notes || '',
    // Per-service extra fields — schema depends on `service` (see FIELD_META
    // and SERVICE_STEP2_FIELDS). We store them all in one map and split at
    // submit time between top-level Mission fields and `serviceDetails`.
    details: prefill?.details ? { ...prefill.details } : {},
  }))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Load clients + agents in parallel — the form is unusable without them.
  useEffect(() => {
    let cancelled = false
    Promise.all([
      adminApi.listClients().catch(() => ({ items: [] })),
      adminApi.listAgents().catch(() => ({ items: [] })),
    ])
      .then(([c, a]) => {
        if (cancelled) return
        setClients(c.items || [])
        setAgents(a.items || [])
      })
      .finally(() => {
        if (!cancelled) setLoadingRefs(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase()
    if (!q) return clients.slice(0, 20)
    return clients
      .filter((c) => {
        const label = (
          c.company ||
          `${c.firstName || ''} ${c.lastName || ''}`.trim()
        ).toLowerCase()
        const email = (c.email || '').toLowerCase()
        return label.includes(q) || email.includes(q)
      })
      .slice(0, 20)
  }, [clients, clientQuery])

  const selectedClient = clients.find((c) => c.id === form.userId)

  // When the admin picks a client, prefill address/city from the client
  // record so they don't have to retype what we already know.
  const pickClient = (c) => {
    setForm((f) => ({
      ...f,
      userId: c.id,
      address: c.address || f.address,
      city: c.city || f.city,
    }))
    setClientQuery('')
  }

  // Reset per-service details whenever the service changes — the fields
  // rendered depend on the service, so keeping stale values would silently
  // ship irrelevant data (e.g. `petType` on a `bureaux` mission).
  const changeService = (nextService) => {
    setForm((f) => ({ ...f, service: nextService, details: {}, endDate: '' }))
  }

  const setDetail = (key, value) => {
    setForm((f) => ({ ...f, details: { ...f.details, [key]: value } }))
  }

  // Ordered list of the currently-visible detail fields. Excludes fields
  // already covered by the main form (startDate → date, notes → notes).
  const detailFields = (SERVICE_STEP2_FIELDS[form.service] || []).filter(
    (k) => k !== 'startDate' && k !== 'notes',
  )

  const toggleAgent = (id) => {
    setForm((f) => ({
      ...f,
      staffIds: f.staffIds.includes(id)
        ? f.staffIds.filter((x) => x !== id)
        : [...f.staffIds, id],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.userId) {
      setError('Sélectionne un client.')
      return
    }
    if (!form.address.trim()) {
      setError("L'adresse est obligatoire.")
      return
    }
    setSubmitting(true)
    try {
      // Build the serviceDetails payload — coerce numeric fields to numbers
      // so the backend doesn't store "3" as a string. `endDate` was pulled
      // out already and lives at the Mission root.
      const NUMERIC_KEYS = new Set([
        'panelCount',
        'plantCount',
        'petCount',
        'buildingUnits',
        'parkingSpaces',
        'volume',
        'surface',
        'rooms',
      ])
      const serviceDetails = {}
      for (const [key, raw] of Object.entries(form.details)) {
        if (raw === '' || raw == null) continue
        serviceDetails[key] = NUMERIC_KEYS.has(key) ? Number(raw) : raw
      }

      const payload = {
        userId: form.userId,
        service: form.service,
        title: form.title || undefined,
        address: form.address.trim(),
        city: form.city || undefined,
        date: form.date,
        endDate: form.endDate || undefined,
        duration: Number(form.duration) || 4,
        staffIds: form.staffIds,
        amount: form.amount === '' ? null : Number(form.amount),
        notes: form.notes || undefined,
        serviceDetails,
      }
      const res = await adminApi.createMission(payload)
      onSuccess?.(res.mission)
      onClose()
    } catch (err) {
      setError(err.message || 'Erreur lors de la création')
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
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-primary">
              <FontAwesomeIcon icon={faPhone} className="h-4 w-4 text-secondary" />
              Nouvelle mission
            </h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Création directe — sans passer par un devis (appel téléphonique, urgence…)
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

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100vh-10rem)] space-y-4 overflow-y-auto p-5"
        >
          {/* Client picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Client *
            </label>
            {selectedClient ? (
              <div className="mt-1.5 flex items-center justify-between rounded-xl border-2 border-secondary/40 bg-secondary/5 px-3 py-2.5">
                <div>
                  <div className="text-sm font-bold text-primary">
                    {selectedClient.company ||
                      `${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim()}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {selectedClient.email}
                    {selectedClient.phone ? ` · ${selectedClient.phone}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, userId: '' }))}
                  className="text-[11px] font-bold text-secondary hover:underline"
                >
                  Changer
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  placeholder="Rechercher par nom, société, email…"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
                {loadingRefs ? (
                  <div className="mt-1.5 h-16 animate-pulse rounded-xl bg-gray-100" />
                ) : (
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-gray-100">
                    {filteredClients.length === 0 ? (
                      <p className="p-3 text-xs text-gray-500">Aucun client trouvé.</p>
                    ) : (
                      filteredClients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => pickClient(c)}
                          className="flex w-full items-center justify-between border-b border-gray-50 px-3 py-2 text-left text-xs transition hover:bg-secondary/5 last:border-b-0"
                        >
                          <span className="font-bold text-primary">
                            {c.company ||
                              `${c.firstName || ''} ${c.lastName || ''}`.trim() ||
                              c.email}
                          </span>
                          <span className="text-[10px] text-gray-500">{c.email}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Service *
              </label>
              <select
                required
                value={form.service}
                onChange={(e) => changeService(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              >
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {SERVICE_LABELS[s] || s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Titre (optionnel)
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Auto-généré si vide"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          {/* Per-service dynamic fields — driven by SERVICE_STEP2_FIELDS. */}
          {detailFields.length > 0 && (
            <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-3">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary-700">
                <FontAwesomeIcon icon={faSprayCanSparkles} className="h-3 w-3" />
                Détails — {SERVICE_LABELS[form.service] || form.service}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {detailFields.map((key) => {
                  const meta = FIELD_META[key]
                  if (!meta) return null
                  // endDate maps to the Mission root field, everything else
                  // will be tucked into `serviceDetails` at submit time. Read
                  // uniformly from `details` here regardless.
                  const value =
                    key === 'endDate' ? form.endDate : form.details[key] ?? ''
                  const onChange = (v) =>
                    key === 'endDate'
                      ? setForm((f) => ({ ...f, endDate: v }))
                      : setDetail(key, v)
                  return (
                    <div key={key}>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {meta.label}
                      </label>
                      {meta.kind === 'select' ? (
                        <select
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        >
                          <option value="">— Sélectionner —</option>
                          {meta.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {ENUM_LABELS[opt] || opt}
                            </option>
                          ))}
                        </select>
                      ) : meta.kind === 'date' ? (
                        <input
                          type="datetime-local"
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        />
                      ) : (
                        <input
                          type="number"
                          min={meta.min || 0}
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Date et heure *
              </label>
              <input
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Durée (h)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Adresse *
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Rue et numéro"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Ville
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Agents assignés
            </label>
            {loadingRefs ? (
              <div className="mt-1.5 h-12 animate-pulse rounded-xl bg-gray-100" />
            ) : agents.length === 0 ? (
              <p className="mt-1.5 text-xs font-medium text-gray-500">
                Aucun agent actif — pense à en créer avant d'affecter.
              </p>
            ) : (
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                {agents
                  .filter((a) => a.status !== 'inactive')
                  .map((a) => {
                    const active = form.staffIds.includes(a.id)
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAgent(a.id)}
                        className={`flex items-start gap-2.5 rounded-xl border-2 p-2.5 text-left transition ${
                          active
                            ? 'border-secondary bg-secondary/5'
                            : 'border-gray-200 bg-white hover:border-secondary/40'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            active ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {a.name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-primary">{a.name}</div>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                            {a.role}
                          </div>
                        </div>
                      </button>
                    )
                  })}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Montant (CHF)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="Facultatif — à convertir en facture ensuite"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Notes internes
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Instructions, accès, consignes spécifiques…"
              className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
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
              {submitting ? (
                <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faSprayCanSparkles} className="h-3 w-3" />
              )}
              Créer la mission
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
