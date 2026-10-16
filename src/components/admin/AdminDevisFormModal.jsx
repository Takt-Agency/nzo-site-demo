import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faSpinner,
  faFileInvoice,
  faMagnifyingGlass,
  faCircleCheck,
  faUser,
  faUserPlus,
  faKey,
  faCopy,
} from '@fortawesome/free-solid-svg-icons'
import { adminApi } from '../../lib/api.js'
import {
  SERVICES,
  FREQUENCIES,
  AUDIENCES,
  SERVICE_STEP2_FIELDS,
  SERVICE_REQUIRED,
  SERVICE_DETAIL_KEYS,
  PLANT_LOCATIONS,
  VISIT_FREQUENCIES,
  PET_TYPES,
  VISITS_PER_DAY,
  ROOF_TYPES,
  LOCATION_TYPES,
  serviceHasField,
} from '../../lib/devisConfig.js'

const initialForm = {
  // 'existing' picks a registered client via userId; 'new' collects the client
  // info inline and the backend creates the User on the fly (with a generated
  // password we show once).
  clientMode: 'existing',
  userId: '',
  newFirstName: '',
  newLastName: '',
  newEmail: '',
  newPhone: '',
  newCompany: '',
  newSiret: '',
  newRepresentativeRole: '',
  service: 'bureaux',
  audience: 'particulier',
  surface: '',
  frequency: 'unique',
  startDate: '',
  endDate: '',
  notes: '',
  address: '',
  postalCode: '',
  city: '',
  // Service-specific extras
  panelCount: '',
  roofType: '',
  plantCount: '',
  plantLocation: '',
  visitFrequency: '',
  petType: '',
  petCount: '',
  visitsPerDay: '',
  buildingUnits: '',
  parkingSpaces: '',
  volume: '',
  locationType: '',
  // Pricing (optional — sets status=quoted when filled)
  amount: '',
  vatRate: 8.1,
  staffMessage: '',
}

// Compact input class matching the AgentFormModal look.
const inputCls =
  'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20'
const labelCls = 'block text-xs font-bold uppercase tracking-wider text-gray-500'

export default function AdminDevisFormModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  // Populated after a new-client creation succeeds — displays the one-time
  // password to the admin. When set, the form is replaced with a credentials
  // screen.
  const [credentials, setCredentials] = useState(null)

  // --- Client picker -----------------------------------------------------
  const [clients, setClients] = useState([])
  const [clientQuery, setClientQuery] = useState('')
  const [clientsLoading, setClientsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    adminApi
      .listClients()
      .then((res) => {
        if (cancelled) return
        setClients(res?.items || [])
      })
      .catch(() => {})
      .finally(() => !cancelled && setClientsLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filteredClients = useMemo(() => {
    if (!clientQuery.trim()) return clients.slice(0, 8)
    const q = clientQuery.toLowerCase()
    return clients
      .filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.company || '').toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [clients, clientQuery])

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === form.userId) || null,
    [clients, form.userId],
  )

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))
  const has = (f) => serviceHasField(form.service, f)

  // When picking a client, prefill audience from their accountType.
  const pickClient = (c) => {
    update({
      userId: c.id,
      audience: c.type || form.audience,
      city: form.city || c.city || '',
    })
    setClientQuery('')
  }

  // The forfait selector is only meaningful for recurring services when the
  // client is a business. Same rule as the public quote form.
  const showsForfait = form.audience !== 'particulier' && has('frequency')

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const clientOk =
    form.clientMode === 'existing'
      ? !!form.userId
      : form.newFirstName.trim() &&
        form.newLastName.trim() &&
        emailRe.test(form.newEmail.trim())

  const canSubmit = () => {
    if (!clientOk) return false
    if (!SERVICES.includes(form.service)) return false
    const required = SERVICE_REQUIRED[form.service] || ['surface']
    const allRequired = required.every((f) => String(form[f] || '').trim())
    return allRequired && (!showsForfait || form.frequency)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // Bundle service-specific extras — only include the fields relevant to
      // the picked service so the payload stays tidy.
      const serviceDetails = {}
      for (const key of SERVICE_DETAIL_KEYS) {
        if (has(key) && form[key] !== '' && form[key] != null) {
          serviceDetails[key] = form[key]
        }
      }

      const payload = {
        service: form.service,
        audience: form.audience,
        surface: has('surface') ? Number(form.surface) || 0 : 0,
        frequency: showsForfait ? form.frequency : 'unique',
        startDate: form.startDate || undefined,
        endDate: has('endDate') ? form.endDate || undefined : undefined,
        notes: form.notes.trim(),
        address: form.address.trim(),
        postalCode: form.postalCode.trim(),
        city: form.city.trim(),
        serviceDetails,
        vatRate: Number(form.vatRate),
        staffMessage: form.staffMessage.trim(),
      }
      if (form.clientMode === 'existing') {
        payload.userId = form.userId
      } else {
        payload.newClient = {
          firstName: form.newFirstName.trim(),
          lastName: form.newLastName.trim(),
          email: form.newEmail.trim(),
          phone: form.newPhone.trim() || undefined,
          accountType: form.audience,
          company: form.newCompany.trim() || undefined,
          siret: form.newSiret.trim() || undefined,
          representativeRole: form.newRepresentativeRole.trim() || undefined,
        }
      }
      if (String(form.amount).trim() !== '') {
        payload.amount = Number(form.amount)
      }

      const res = await adminApi.createDevis(payload)
      // If the backend created a new client, surface the one-time password to
      // the admin so they can share it. Otherwise close immediately.
      if (res.newClient?.temporaryPassword) {
        setCredentials(res.newClient)
      } else {
        onSuccess?.(res.devis)
        onClose()
      }
      // Reload the parent list even when we keep the modal open on the
      // credentials screen — the new devis is already in the DB.
      if (res.devis) onSuccess?.(res.devis)
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
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-primary">
            <FontAwesomeIcon
              icon={credentials ? faKey : faFileInvoice}
              className="h-4 w-4 text-secondary"
            />
            {credentials ? 'Devis créé — Identifiants du client' : 'Nouveau devis'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        {credentials ? (
          <div className="space-y-5 p-5">
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                <FontAwesomeIcon icon={faCircleCheck} className="h-6 w-6" />
              </span>
              <div className="mt-3 text-sm font-bold text-emerald-900">
                Devis créé avec succès
              </div>
              <p className="mt-1 text-xs font-medium text-emerald-800">
                Un compte client a été créé automatiquement. Partagez ces identifiants
                pour qu'il puisse se connecter à son espace.
              </p>
            </div>

            <div className="rounded-xl border-2 border-dashed border-secondary/30 bg-secondary-50/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-secondary-700">
                Email
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="text-sm font-bold text-primary">{credentials.email}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(credentials.email)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-secondary ring-1 ring-secondary/30 transition hover:bg-secondary hover:text-white"
                >
                  <FontAwesomeIcon icon={faCopy} className="h-2.5 w-2.5" />
                  Copier
                </button>
              </div>
              <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-secondary-700">
                Mot de passe temporaire
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="break-all text-sm font-bold text-primary">
                  {credentials.temporaryPassword}
                </code>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard?.writeText(credentials.temporaryPassword)
                  }
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-secondary ring-1 ring-secondary/30 transition hover:bg-secondary hover:text-white"
                >
                  <FontAwesomeIcon icon={faCopy} className="h-2.5 w-2.5" />
                  Copier
                </button>
              </div>
              <p className="mt-3 text-[11px] font-medium leading-relaxed text-gray-600">
                ⚠️ Ce mot de passe ne sera plus jamais affiché. Copiez-le maintenant et
                communiquez-le au client. Il pourra le modifier depuis son espace.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-primary px-5 py-2 text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100vh-10rem)] space-y-5 overflow-y-auto p-5"
        >
          {/* Client picker ------------------------------------------------- */}
          <section>
            <label className={labelCls}>Client *</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => update({ clientMode: 'existing' })}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2 text-xs font-bold transition ${
                  form.clientMode === 'existing'
                    ? 'border-secondary bg-secondary/5 text-secondary'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-secondary/40'
                }`}
              >
                <FontAwesomeIcon icon={faUser} className="h-3 w-3" />
                Client existant
              </button>
              <button
                type="button"
                onClick={() => update({ clientMode: 'new' })}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2 text-xs font-bold transition ${
                  form.clientMode === 'new'
                    ? 'border-secondary bg-secondary/5 text-secondary'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-secondary/40'
                }`}
              >
                <FontAwesomeIcon icon={faUserPlus} className="h-3 w-3" />
                Nouveau client
              </button>
            </div>

            {form.clientMode === 'existing' ? (
              selectedClient ? (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border-2 border-secondary/40 bg-secondary/5 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-white">
                      <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-primary">{selectedClient.name}</div>
                      <div className="text-xs font-medium text-gray-500">
                        {selectedClient.email}
                        {selectedClient.company ? ` — ${selectedClient.company}` : ''}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => update({ userId: '' })}
                    className="text-xs font-bold text-secondary transition hover:text-secondary-700"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="search"
                      value={clientQuery}
                      onChange={(e) => setClientQuery(e.target.value)}
                      placeholder="Rechercher un client par nom, email ou société…"
                      className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                  {clientsLoading ? (
                    <div className="rounded-xl border border-gray-100 p-3 text-xs text-gray-500">
                      Chargement des clients…
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="rounded-xl border border-gray-100 p-3 text-xs text-gray-500">
                      Aucun client trouvé. Basculez sur « Nouveau client » pour créer le compte.
                    </div>
                  ) : (
                    <ul className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-100">
                      {filteredClients.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => pickClient(c)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-secondary-50"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                              <FontAwesomeIcon icon={faUser} className="h-3 w-3" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-bold text-primary">
                                {c.name}
                              </div>
                              <div className="truncate text-xs font-medium text-gray-500">
                                {c.email}
                                {c.company ? ` — ${c.company}` : ''}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            ) : (
              <div className="mt-3 space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <p className="text-[11px] font-medium leading-relaxed text-gray-600">
                  Un compte client sera créé automatiquement. Un mot de passe temporaire
                  vous sera affiché une fois pour que vous puissiez le partager.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Prénom *</label>
                    <input
                      type="text"
                      value={form.newFirstName}
                      onChange={(e) => update({ newFirstName: e.target.value })}
                      className={inputCls}
                      placeholder="Sophie"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nom *</label>
                    <input
                      type="text"
                      value={form.newLastName}
                      onChange={(e) => update({ newLastName: e.target.value })}
                      className={inputCls}
                      placeholder="Martin"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input
                      type="email"
                      value={form.newEmail}
                      onChange={(e) => update({ newEmail: e.target.value })}
                      className={inputCls}
                      placeholder="sophie.martin@example.ch"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Téléphone</label>
                    <input
                      type="tel"
                      value={form.newPhone}
                      onChange={(e) => update({ newPhone: e.target.value })}
                      className={inputCls}
                      placeholder="+41 79 555 12 11"
                    />
                  </div>
                  {form.audience !== 'particulier' && (
                    <>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Société</label>
                        <input
                          type="text"
                          value={form.newCompany}
                          onChange={(e) => update({ newCompany: e.target.value })}
                          className={inputCls}
                          placeholder="Régie Léman SA"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>IDE / SIRET</label>
                        <input
                          type="text"
                          value={form.newSiret}
                          onChange={(e) => update({ newSiret: e.target.value })}
                          className={inputCls}
                          placeholder="CHE-123.456.789"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Fonction</label>
                        <input
                          type="text"
                          value={form.newRepresentativeRole}
                          onChange={(e) => update({ newRepresentativeRole: e.target.value })}
                          className={inputCls}
                          placeholder="Directeur"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Service + audience ------------------------------------------- */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Prestation *</label>
              <select
                value={form.service}
                onChange={(e) => update({ service: e.target.value })}
                className={inputCls}
              >
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Type de client</label>
              <select
                value={form.audience}
                onChange={(e) => update({ audience: e.target.value })}
                className={inputCls}
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Adaptive fields ---------------------------------------------- */}
          <section className="grid gap-4 sm:grid-cols-2">
            {has('surface') && (
              <div>
                <label className={labelCls}>Surface (m²) *</label>
                <input
                  type="number"
                  min="1"
                  value={form.surface}
                  onChange={(e) => update({ surface: e.target.value })}
                  className={inputCls}
                  placeholder="80"
                />
              </div>
            )}

            {has('panelCount') && (
              <div>
                <label className={labelCls}>Nombre de panneaux *</label>
                <input
                  type="number"
                  min="1"
                  value={form.panelCount}
                  onChange={(e) => update({ panelCount: e.target.value })}
                  className={inputCls}
                  placeholder="20"
                />
              </div>
            )}
            {has('roofType') && (
              <div>
                <label className={labelCls}>Type de toiture</label>
                <select
                  value={form.roofType}
                  onChange={(e) => update({ roofType: e.target.value })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {ROOF_TYPES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {has('plantCount') && (
              <div>
                <label className={labelCls}>Nombre de plantes *</label>
                <input
                  type="number"
                  min="1"
                  value={form.plantCount}
                  onChange={(e) => update({ plantCount: e.target.value })}
                  className={inputCls}
                  placeholder="8"
                />
              </div>
            )}
            {has('plantLocation') && (
              <div>
                <label className={labelCls}>Emplacement des plantes</label>
                <select
                  value={form.plantLocation}
                  onChange={(e) => update({ plantLocation: e.target.value })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {PLANT_LOCATIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {has('visitFrequency') && (
              <div>
                <label className={labelCls}>Fréquence des passages</label>
                <select
                  value={form.visitFrequency}
                  onChange={(e) => update({ visitFrequency: e.target.value })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {VISIT_FREQUENCIES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {has('petType') && (
              <div>
                <label className={labelCls}>Type d'animal *</label>
                <select
                  value={form.petType}
                  onChange={(e) => update({ petType: e.target.value })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {PET_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {has('petCount') && (
              <div>
                <label className={labelCls}>Nombre d'animaux *</label>
                <input
                  type="number"
                  min="1"
                  value={form.petCount}
                  onChange={(e) => update({ petCount: e.target.value })}
                  className={inputCls}
                  placeholder="1"
                />
              </div>
            )}
            {has('visitsPerDay') && (
              <div>
                <label className={labelCls}>Passages par jour</label>
                <select
                  value={form.visitsPerDay}
                  onChange={(e) => update({ visitsPerDay: e.target.value })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {VISITS_PER_DAY.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {has('buildingUnits') && (
              <div>
                <label className={labelCls}>Nombre de logements</label>
                <input
                  type="number"
                  min="1"
                  value={form.buildingUnits}
                  onChange={(e) => update({ buildingUnits: e.target.value })}
                  className={inputCls}
                  placeholder="12"
                />
              </div>
            )}
            {has('parkingSpaces') && (
              <div>
                <label className={labelCls}>Nombre de places</label>
                <input
                  type="number"
                  min="1"
                  value={form.parkingSpaces}
                  onChange={(e) => update({ parkingSpaces: e.target.value })}
                  className={inputCls}
                  placeholder="30"
                />
              </div>
            )}

            {has('volume') && (
              <div>
                <label className={labelCls}>Volume (m³) *</label>
                <input
                  type="number"
                  min="1"
                  value={form.volume}
                  onChange={(e) => update({ volume: e.target.value })}
                  className={inputCls}
                  placeholder="10"
                />
              </div>
            )}
            {has('locationType') && (
              <div>
                <label className={labelCls}>Type de local</label>
                <select
                  value={form.locationType}
                  onChange={(e) => update({ locationType: e.target.value })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {LOCATION_TYPES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showsForfait && (
              <div className="sm:col-span-2">
                <label className={labelCls}>Forfait *</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {FREQUENCIES.map((f) => {
                    const active = form.frequency === f
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => update({ frequency: f })}
                        className={`rounded-xl border-2 p-2.5 text-xs font-bold transition ${
                          active
                            ? 'border-secondary bg-secondary/5 text-secondary'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-secondary/40'
                        }`}
                      >
                        {f}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {has('startDate') && (
              <div>
                <label className={labelCls}>
                  {form.service === 'arrosage' || form.service === 'animaux'
                    ? "Début de l'absence"
                    : 'Date souhaitée'}
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                  className={inputCls}
                />
              </div>
            )}
            {has('endDate') && (
              <div>
                <label className={labelCls}>Fin de l'absence *</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => update({ endDate: e.target.value })}
                  className={inputCls}
                />
              </div>
            )}
          </section>

          {/* Address ------------------------------------------------------- */}
          <section className="grid gap-4 sm:grid-cols-[1fr_120px_1fr]">
            <div>
              <label className={labelCls}>Adresse</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => update({ address: e.target.value })}
                className={inputCls}
                placeholder="Rue de la Paix 12"
              />
            </div>
            <div>
              <label className={labelCls}>Code postal</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => update({ postalCode: e.target.value })}
                className={inputCls}
                placeholder="1200"
              />
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update({ city: e.target.value })}
                className={inputCls}
                placeholder="Genève"
              />
            </div>
          </section>

          {/* Pricing ------------------------------------------------------- */}
          <section className="rounded-xl border-2 border-dashed border-secondary/30 bg-secondary-50/40 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-secondary-700">
              Tarif (optionnel)
            </div>
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-600">
              Si vous saisissez un montant, le devis est directement envoyé au
              client au statut « Envoyé » et il peut l'accepter. Sinon, le devis
              est créé au statut « Nouveau » et vous pourrez le chiffrer plus tard.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Montant HT (CHF)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => update({ amount: e.target.value })}
                  className={inputCls}
                  placeholder="450"
                />
              </div>
              <div>
                <label className={labelCls}>TVA (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.vatRate}
                  onChange={(e) => update({ vatRate: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>Message au client</label>
              <textarea
                rows={2}
                value={form.staffMessage}
                onChange={(e) => update({ staffMessage: e.target.value })}
                placeholder="Bonjour, voici notre proposition…"
                className={`${inputCls} resize-y`}
              />
            </div>
          </section>

          {/* Notes internes ----------------------------------------------- */}
          <section>
            <label className={labelCls}>Notes internes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Contraintes d'accès, particularités, historique…"
              className={`${inputCls} resize-y`}
            />
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
            <div className="text-xs font-medium text-gray-500">
              {form.amount ? (
                <span className="inline-flex items-center gap-1.5 text-secondary-700">
                  <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                  Statut : Envoyé
                </span>
              ) : (
                <span>Statut : Nouveau (à chiffrer)</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 px-5 py-2 text-xs font-bold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || !canSubmit()}
                className="btn-primary px-5 py-2 text-xs disabled:opacity-50"
              >
                {submitting && (
                  <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
                )}
                Créer le devis
              </button>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
