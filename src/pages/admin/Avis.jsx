import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faStar,
  faCircleCheck,
  faCircleXmark,
  faSpinner,
  faCircleExclamation,
  faQuoteLeft,
  faClock,
  faUser,
  faSprayCanSparkles,
  faGlobe,
  faRotateLeft,
  faBoxArchive,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

const STATUS_TONE = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-gray-100 text-gray-600 ring-gray-200',
  archived: 'bg-gray-200 text-gray-700 ring-gray-300',
}

const STATUS_LABEL = {
  pending: 'En attente',
  approved: 'Publié',
  rejected: 'Rejeté',
  archived: 'Archivé',
}

export default function AdminAvis() {
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)

  // Fetch every non-archived review once and filter client-side. This way
  // the chip counts always reflect the whole dataset, not just the
  // currently-active tab. Archived reviews stay hidden (backend's default).
  const fetcher = useCallback(() => adminApi.listReviews(), [])
  const { data, loading, error, reload } = useApi(fetcher)
  const items = data?.items || []

  const filtered = useMemo(
    () => (statusFilter === 'all' ? items : items.filter((r) => r.reviewStatus === statusFilter)),
    [items, statusFilter],
  )

  const counts = useMemo(
    () => ({
      all: items.length,
      pending: items.filter((r) => r.reviewStatus === 'pending').length,
      approved: items.filter((r) => r.reviewStatus === 'approved').length,
      rejected: items.filter((r) => r.reviewStatus === 'rejected').length,
    }),
    [items],
  )

  const averageRating = useMemo(() => {
    if (items.length === 0) return 0
    const sum = items.reduce((s, r) => s + (r.rating || 0), 0)
    return Math.round((sum / items.length) * 10) / 10
  }, [items])

  const moderate = async (id, status) => {
    setBusyId(id)
    try {
      await adminApi.moderateReview(id, status)
      reload()
    } catch (err) {
      alert(err.message || 'Erreur')
    } finally {
      setBusyId(null)
    }
  }

  const archive = async (id) => {
    if (
      !confirm(
        'Archiver cet avis ? Il sera retiré de la liste active et du site public — vous pourrez le restaurer depuis la page Archives.',
      )
    )
      return
    setBusyId(id)
    try {
      await adminApi.archiveResource('reviews', id)
      reload()
    } catch (err) {
      alert(err.message || 'Erreur')
    } finally {
      setBusyId(null)
    }
  }

  // Archived reviews live exclusively in the unified /admin/archives view —
  // they're intentionally not exposed here to keep the moderation workflow
  // focused on active reviews.
  const tabs = [
    { value: 'all', label: 'Tous' },
    { value: 'pending', label: 'En attente' },
    { value: 'approved', label: 'Publiés' },
    { value: 'rejected', label: 'Rejetés' },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="MODÉRATION"
        title="Avis clients"
        description="Validez les avis soumis par vos clients pour les publier sur le site public."
      />

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
          {error.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
            En attente
          </div>
          <div className="mt-2 text-2xl font-bold text-primary">{counts.pending}</div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            <FontAwesomeIcon icon={faGlobe} className="h-3 w-3" />
            Publiés
          </div>
          <div className="mt-2 text-2xl font-bold text-primary">{counts.approved}</div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <FontAwesomeIcon icon={faCircleXmark} className="h-3 w-3" />
            Rejetés
          </div>
          <div className="mt-2 text-2xl font-bold text-primary">{counts.rejected}</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-primary-900 to-secondary-900 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/70">
            <FontAwesomeIcon icon={faStar} className="h-3 w-3 text-yellow-400" />
            Note moyenne
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold">{averageRating || '—'}</span>
            <span className="text-xs font-medium text-white/70">/ 5</span>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const a = statusFilter === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                a
                  ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-primary'
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
                  a ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {counts[tab.value] || 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faQuoteLeft} className="h-8 w-8 text-gray-300" />
          <div className="mt-3 text-sm font-bold text-primary">
            {statusFilter === 'pending'
              ? 'Aucun avis en attente de modération'
              : 'Aucun avis dans cette catégorie'}
          </div>
          <p className="mt-1 text-xs font-medium text-gray-500">
            Les avis sont envoyés par les clients après chaque mission terminée.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
            >
              <FontAwesomeIcon
                icon={faQuoteLeft}
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-4 h-8 w-8 text-secondary-50"
              />

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-secondary-700 text-sm font-bold text-white shadow-md">
                    <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-primary">{r.clientName}</div>
                    {r.clientCompany && (
                      <div className="truncate text-[11px] font-medium text-gray-500">
                        {r.clientCompany}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                    STATUS_TONE[r.reviewStatus] || STATUS_TONE.pending
                  }`}
                >
                  {STATUS_LABEL[r.reviewStatus] || r.reviewStatus}
                </span>
              </div>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FontAwesomeIcon
                    key={i}
                    icon={faStar}
                    className={`h-3.5 w-3.5 ${
                      i < (r.rating || 0) ? 'text-yellow-400' : 'text-gray-200'
                    }`}
                  />
                ))}
                <span className="ml-1 text-xs font-bold text-primary">{r.rating}/5</span>
              </div>

              {/* Text */}
              {r.text ? (
                <p className="mt-3 text-sm font-medium leading-relaxed text-gray-700">
                  « {r.text} »
                </p>
              ) : (
                <p className="mt-3 text-xs italic font-medium text-gray-400">
                  Aucun commentaire écrit — seulement une note.
                </p>
              )}

              {/* Meta */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faSprayCanSparkles} className="h-2.5 w-2.5 text-secondary" />
                  {t(`services.${r.service}.title`, { defaultValue: r.service })}
                </span>
                {r.city && <span>· {r.city}</span>}
                <span className="inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                  {formatDate(r.submittedAt)}
                </span>
              </div>

              {/* Actions — archived reviews are managed on /admin/archives */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                {r.reviewStatus !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => moderate(r.id, 'approved')}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {busyId === r.id ? (
                      <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
                    ) : (
                      <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                    )}
                    {r.reviewStatus === 'rejected' ? 'Publier' : 'Publier sur le site'}
                  </button>
                )}
                {r.reviewStatus !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => moderate(r.id, 'rejected')}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faCircleXmark} className="h-3 w-3" />
                    Rejeter
                  </button>
                )}
                {r.reviewStatus !== 'pending' && (
                  <button
                    type="button"
                    onClick={() => moderate(r.id, 'pending')}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:border-amber-300 hover:text-amber-700 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} className="h-3 w-3" />
                    Remettre en attente
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => archive(r.id)}
                  disabled={busyId === r.id}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:border-amber-300 hover:text-amber-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faBoxArchive} className="h-3 w-3" />
                  Archiver
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
