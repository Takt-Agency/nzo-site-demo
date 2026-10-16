import { useCallback, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBoxArchive,
  faRotateLeft,
  faUsers,
  faFilePen,
  faSprayCanSparkles,
  faClipboardList,
  faTriangleExclamation,
  faUsersGear,
  faFileInvoiceDollar,
  faSquarePollVertical,
  faCircleExclamation,
  faSpinner,
  faEye,
  faStar,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import ArchivePreviewModal from '../../components/admin/ArchivePreviewModal.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const TYPES = [
  { key: 'clients', label: 'Clients', icon: faUsers, color: 'bg-secondary' },
  { key: 'devis', label: 'Devis', icon: faFilePen, color: 'bg-primary-700' },
  { key: 'missions', label: 'Missions', icon: faSprayCanSparkles, color: 'bg-accent' },
  { key: 'demandes', label: 'Demandes', icon: faClipboardList, color: 'bg-tertiary-600' },
  {
    key: 'reclamations',
    label: 'Réclamations',
    icon: faTriangleExclamation,
    color: 'bg-red-500',
  },
  { key: 'agents', label: 'Agents', icon: faUsersGear, color: 'bg-emerald-600' },
  { key: 'factures', label: 'Factures', icon: faFileInvoiceDollar, color: 'bg-amber-500' },
  { key: 'reviews', label: 'Avis clients', icon: faStar, color: 'bg-yellow-500' },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatAmount(n, currency = 'CHF') {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n)
}

function renderMeta(type, meta) {
  switch (type) {
    case 'clients':
      return `${meta?.accountType || '—'}`
    case 'devis':
      return `Statut : ${meta?.status || '—'}${
        meta?.amount != null ? ` · ${formatAmount(meta.amount)}` : ''
      }`
    case 'missions':
      return `${meta?.status || '—'}${
        meta?.amount != null ? ` · ${formatAmount(meta.amount)}` : ''
      }`
    case 'demandes':
      return `${meta?.from === 'agent' ? 'Agent' : 'Client'} · ${meta?.demandeType || '—'} · ${
        meta?.status || '—'
      }`
    case 'reclamations':
      return `${meta?.category || '—'} · ${meta?.severity || '—'} · ${meta?.status || '—'}`
    case 'agents':
      return `${meta?.role || '—'}${meta?.hasAccount ? ' · Compte actif' : ''}`
    case 'factures':
      return `${meta?.amount != null ? formatAmount(meta.amount) : '—'} · Émise ${formatDate(
        meta?.issueDate,
      )}`
    case 'reviews':
      return `${meta?.rating || 0}/5 · ${meta?.service || '—'}${
        meta?.text ? ` · « ${String(meta.text).slice(0, 60)}${meta.text.length > 60 ? '…' : ''} »` : ''
      }`
    default:
      return ''
  }
}

export default function AdminArchives() {
  const [activeType, setActiveType] = useState('all')
  const [busyId, setBusyId] = useState(null)
  // { type, id } of the item being previewed in the modal, or null when closed.
  const [preview, setPreview] = useState(null)
  const fetcher = useCallback(() => adminApi.listArchived(), [])
  const { data, loading, error, reload } = useApi(fetcher)

  const counts = data?.counts || {}
  const items = data?.items || []
  const total = items.length

  const filtered = useMemo(() => {
    if (activeType === 'all') return items
    return items.filter((it) => it.type === activeType)
  }, [items, activeType])

  const restore = async (item) => {
    if (!confirm(`Désarchiver « ${item.title} » ? Il redeviendra visible dans les listes.`))
      return
    setBusyId(item.id)
    try {
      await adminApi.unarchiveResource(item.type, item.id)
      reload()
    } catch (err) {
      alert(err.message || 'Erreur')
    } finally {
      setBusyId(null)
    }
  }

  // Restore from inside the preview modal: closes the modal on success.
  const restoreFromPreview = async () => {
    if (!preview) return
    setBusyId(preview.id)
    try {
      await adminApi.unarchiveResource(preview.type, preview.id)
      setPreview(null)
      reload()
    } catch (err) {
      alert(err.message || 'Erreur')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="ARCHIVES"
        title="Données archivées"
        description="Tout ce qui a été archivé par l'admin reste ici — restauration possible à tout moment."
      />

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
          {error.message}
        </div>
      )}

      {/* Counts grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {TYPES.map((t) => {
          const n = counts[t.key] || 0
          const active = activeType === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveType(active ? 'all' : t.key)}
              className={`flex items-center gap-3 rounded-2xl p-4 text-left shadow-sm ring-1 transition ${
                active
                  ? 'bg-primary text-white ring-primary shadow-md'
                  : 'bg-white text-gray-700 ring-gray-100 hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${
                  active ? 'bg-white/20' : t.color
                }`}
              >
                <FontAwesomeIcon icon={t.icon} className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    active ? 'text-white/80' : 'text-gray-500'
                  }`}
                >
                  {t.label}
                </div>
                <div className="text-lg font-bold leading-tight">{n}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveType('all')}
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
            activeType === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-primary'
          }`}
        >
          <FontAwesomeIcon icon={faSquarePollVertical} className="h-3 w-3" />
          Tout
          <span
            className={`inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
              activeType === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {total}
          </span>
        </button>
        {TYPES.map((t) => {
          const n = counts[t.key] || 0
          const active = activeType === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveType(t.key)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                active
                  ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-primary'
              }`}
            >
              <FontAwesomeIcon icon={t.icon} className="h-3 w-3" />
              {t.label}
              <span
                className={`inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {n}
              </span>
            </button>
          )
        })}
      </div>

      {/* Items list */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FontAwesomeIcon icon={faBoxArchive} className="h-8 w-8 text-gray-300" />
            <div className="mt-3 text-sm font-bold text-primary">
              {activeType === 'all'
                ? 'Aucune donnée archivée'
                : `Aucun élément archivé dans « ${
                    TYPES.find((t) => t.key === activeType)?.label || activeType
                  } »`}
            </div>
            <p className="mt-1 text-xs font-medium text-gray-500">
              L'admin peut archiver tout élément depuis sa fiche pour le retirer des listes sans le
              supprimer.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((item) => {
              const typeDef = TYPES.find((t) => t.key === item.type)
              return (
                <li key={`${item.type}-${item.id}`} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
                        typeDef?.color || 'bg-gray-400'
                      }`}
                    >
                      <FontAwesomeIcon icon={typeDef?.icon || faBoxArchive} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                          {typeDef?.label || item.type}
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                          Archivée le {formatDate(item.archivedAt)}
                        </span>
                      </div>
                      <div className="mt-1 truncate text-sm font-bold text-primary md:text-base">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-xs font-medium text-gray-500">{item.subtitle}</div>
                      )}
                      <div className="mt-1 text-[11px] font-medium text-gray-500">
                        {renderMeta(item.type, item.meta)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreview({ type: item.type, id: item.id })}
                        className="inline-flex items-center gap-1.5 rounded-full border-2 border-gray-200 px-3 py-1.5 text-[11px] font-bold text-gray-700 transition hover:border-secondary hover:text-secondary"
                      >
                        <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                        Ouvrir
                      </button>
                      <button
                        type="button"
                        onClick={() => restore(item)}
                        disabled={busyId === item.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busyId === item.id ? (
                          <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
                        ) : (
                          <FontAwesomeIcon icon={faRotateLeft} className="h-3 w-3" />
                        )}
                        Restaurer
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {preview && (
        <ArchivePreviewModal
          type={preview.type}
          id={preview.id}
          onClose={() => setPreview(null)}
          onRestore={restoreFromPreview}
          restoring={busyId === preview.id}
        />
      )}
    </div>
  )
}
