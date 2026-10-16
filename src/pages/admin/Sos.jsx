import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTriangleExclamation,
  faLocationDot,
  faPhone,
  faCheck,
  faCheckCircle,
  faSpinner,
  faXmark,
  faClock,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

// Dedicated SOS management page. Left pane lists open + acknowledged alerts
// (urgent first), right pane shows the full detail of the selected alert
// with action buttons to acknowledge / resolve.
function fmt(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `il y a ${s}s`
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`
  return `il y a ${Math.round(s / 86400)} j`
}

const STATUS = {
  open: { label: 'Ouverte', bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-200' },
  acknowledged: {
    label: 'Prise en charge',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
  },
  resolved: {
    label: 'Résolue',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    ring: 'ring-gray-200',
  },
}

// Fallback for any status the backend hasn't defined yet — prevents the
// page from crashing when a new state (e.g. 'archived') is introduced
// server-side before the frontend is updated.
const STATUS_FALLBACK = {
  label: 'Inconnue',
  bg: 'bg-gray-100',
  text: 'text-gray-700',
  ring: 'ring-gray-200',
}
function statusInfo(s) {
  return STATUS[s] || STATUS_FALLBACK
}

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'open', label: 'Ouvertes' },
  { key: 'acknowledged', label: 'En cours' },
  { key: 'resolved', label: 'Résolues' },
]

export default function Sos() {
  const params = useParams()
  const navigate = useNavigate()
  // URL takes precedence — hitting /admin/sos/:id (via push notification or
  // the realtime SOS banner) pre-selects that alert. Falls back to internal
  // click selection otherwise.
  const urlId = params.id || null
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(urlId)
  const [resolveNote, setResolveNote] = useState('')
  const [busy, setBusy] = useState(false)

  // When the URL changes (e.g. two SOS banners in a row), refresh the
  // selection so the pane reflects the latest one.
  useEffect(() => {
    if (urlId) setSelectedId(urlId)
  }, [urlId])

  // Force the "all" tab when landing via URL so the deep-linked alert is
  // visible even if it's already resolved (filtered out of the default view).
  useEffect(() => {
    if (urlId && status !== 'all') setStatus('all')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId])

  const { data, loading, reload } = useApi(
    () => adminApi.listSos({ status: status === 'all' ? undefined : status }),
    [status],
  )
  const items = data?.items || []
  const selected = useMemo(
    () => items.find((a) => a.id === selectedId) || items[0] || null,
    [items, selectedId],
  )

  // Auto-refresh every 20s so a new SOS pops up without manual reload.
  useEffect(() => {
    const iv = setInterval(reload, 20_000)
    return () => clearInterval(iv)
  }, [reload])

  const ack = async () => {
    if (!selected) return
    setBusy(true)
    try {
      await adminApi.acknowledgeSos(selected.id)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const resolve = async () => {
    if (!selected) return
    setBusy(true)
    try {
      await adminApi.resolveSos(selected.id, resolveNote.trim() || undefined)
      setResolveNote('')
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const openInMaps = (geo) => {
    if (!geo?.lat) return
    window.open(`https://www.google.com/maps?q=${geo.lat},${geo.lng}`, '_blank', 'noopener')
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="Sécurité"
        title="Alertes SOS"
        subtitle="Alertes envoyées par les agents depuis l'application mobile"
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = status === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatus(t.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-primary/40'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left — list */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            {loading && items.length === 0 ? (
              <div className="p-8 text-center">
                <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-10 text-center">
                <FontAwesomeIcon
                  icon={faShieldHalved}
                  className="h-8 w-8 text-emerald-400"
                />
                <div className="mt-3 text-sm font-bold text-primary">Aucune alerte</div>
                <div className="mt-1 text-xs text-gray-500">Rien à traiter côté sécurité.</div>
              </div>
            ) : (
              <ul className="max-h-[75vh] overflow-y-auto">
                {items.map((a, i) => {
                  const s = statusInfo(a.status)
                  const active = selected?.id === a.id
                  return (
                    <li
                      key={a.id}
                      className={`${i > 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(a.id)}
                        className={`flex w-full items-start gap-3 p-4 text-left transition ${
                          active
                            ? 'bg-red-50/60'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            a.status === 'open'
                              ? 'bg-red-100 text-red-700 animate-pulse'
                              : a.status === 'acknowledged'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-bold text-primary">
                              {a.agentName || 'Agent'}
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.bg} ${s.text}`}
                            >
                              {s.label}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] font-semibold text-gray-500">
                            {timeAgo(a.createdAt)} · {fmt(a.createdAt)}
                          </div>
                          {a.note ? (
                            <div className="mt-2 line-clamp-2 rounded-lg bg-gray-50 p-2 text-xs italic text-gray-700">
                              « {a.note} »
                            </div>
                          ) : null}
                          {a.missionTitle && (
                            <div className="mt-1.5 text-[11px] text-gray-600">
                              Mission : {a.missionTitle}
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right — detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="space-y-4">
              {/* Header card */}
              <div className={`rounded-2xl p-5 shadow-sm ring-1 ${statusInfo(selected.status).ring} ${
                selected.status === 'open' ? 'bg-red-50' : selected.status === 'acknowledged' ? 'bg-amber-50' : 'bg-white'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold ${statusInfo(selected.status).bg} ${statusInfo(selected.status).text}`}>
                      <FontAwesomeIcon icon={faTriangleExclamation} className="h-3 w-3" />
                      {statusInfo(selected.status).label}
                    </div>
                    <h2 className="mt-3 text-xl font-bold text-primary">
                      Alerte SOS — {selected.agentName}
                    </h2>
                    <div className="mt-1 text-xs font-semibold text-gray-500">
                      <FontAwesomeIcon icon={faClock} className="mr-1 h-3 w-3" />
                      {fmt(selected.createdAt)} · {timeAgo(selected.createdAt)}
                    </div>
                  </div>
                </div>

                {selected.note ? (
                  <div className="mt-4 rounded-xl border-l-4 border-red-400 bg-white p-3 text-sm italic text-gray-800">
                    « {selected.note} »
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-white p-3 text-xs italic text-gray-500">
                    Aucun message texte joint à l'alerte.
                  </div>
                )}

                {/* Action buttons */}
                {selected.status !== 'resolved' && (
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    {selected.status === 'open' && (
                      <button
                        type="button"
                        onClick={ack}
                        disabled={busy}
                        className="btn-primary flex-1 px-6 py-3 text-sm disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                        Prendre en charge
                      </button>
                    )}
                    <div className="flex-[2] rounded-xl border border-gray-200 bg-white p-3">
                      <textarea
                        value={resolveNote}
                        onChange={(e) => setResolveNote(e.target.value)}
                        placeholder="Note de résolution (optionnel) — ex : contacté par téléphone, agent OK, retour au bureau…"
                        className="w-full resize-none border-0 bg-transparent p-0 text-sm text-gray-800 outline-none placeholder:text-gray-400"
                        rows={2}
                      />
                      <button
                        type="button"
                        onClick={resolve}
                        disabled={busy}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} className="h-3 w-3" />
                        Marquer comme résolue
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Position + agent contact */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Position GPS
                  </div>
                  {selected.geo?.lat != null ? (
                    <>
                      <div className="mt-2 font-mono text-sm text-primary">
                        {selected.geo.lat.toFixed(5)}, {selected.geo.lng.toFixed(5)}
                      </div>
                      {selected.geo.accuracy != null && (
                        <div className="mt-1 text-[11px] text-gray-500">
                          Précision : {Math.round(selected.geo.accuracy)} m
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => openInMaps(selected.geo)}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary-50 px-3 py-1.5 text-xs font-bold text-secondary-700 transition hover:bg-secondary-100"
                      >
                        <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
                        Ouvrir dans Google Maps
                      </button>
                    </>
                  ) : (
                    <div className="mt-2 text-xs italic text-gray-500">
                      Position non disponible au moment de l'alerte.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Contact agent
                  </div>
                  <div className="mt-2 text-sm font-bold text-primary">{selected.agentName}</div>
                  {selected.agentPhone && (
                    <a
                      href={`tel:${selected.agentPhone}`}
                      className="mt-2 inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1.5 text-xs font-bold text-accent-700 transition hover:bg-accent-100"
                    >
                      <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
                      {selected.agentPhone}
                    </a>
                  )}
                  {selected.agentEmail && (
                    <div className="mt-2">
                      <a
                        href={`mailto:${selected.agentEmail}`}
                        className="text-xs text-secondary underline underline-offset-2 hover:text-secondary-700"
                      >
                        {selected.agentEmail}
                      </a>
                    </div>
                  )}
                  {selected.missionTitle && (
                    <div className="mt-3 rounded-lg bg-accent-50/60 p-2 text-[11px] text-primary">
                      <span className="font-semibold">Mission liée :</span>{' '}
                      {selected.missionTitle}
                    </div>
                  )}
                </div>
              </div>

              {/* History */}
              {(selected.acknowledgedAt || selected.resolvedAt) && (
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Historique
                  </div>
                  <ol className="mt-3 space-y-2 text-xs">
                    {selected.acknowledgedAt && (
                      <li className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                          <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-primary">Prise en charge</span>
                          {selected.acknowledgedByName ? ` par ${selected.acknowledgedByName}` : ''}
                          {' · '}
                          <span className="text-gray-500">{fmt(selected.acknowledgedAt)}</span>
                        </div>
                      </li>
                    )}
                    {selected.resolvedAt && (
                      <li className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <FontAwesomeIcon icon={faCheckCircle} className="h-2.5 w-2.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-primary">Résolue</span>
                          {selected.resolvedByName ? ` par ${selected.resolvedByName}` : ''}
                          {' · '}
                          <span className="text-gray-500">{fmt(selected.resolvedAt)}</span>
                        </div>
                      </li>
                    )}
                  </ol>
                  {selected.resolutionNote && (
                    <div className="mt-3 rounded-lg border-l-2 border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
                      <div className="font-bold uppercase tracking-wider text-emerald-700">
                        Note de résolution
                      </div>
                      <div className="mt-1">{selected.resolutionNote}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
              <FontAwesomeIcon icon={faShieldHalved} className="h-8 w-8 text-gray-300" />
              <div className="mt-3 text-sm font-bold text-primary">
                Sélectionnez une alerte à gauche
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
