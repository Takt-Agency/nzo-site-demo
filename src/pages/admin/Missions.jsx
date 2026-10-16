import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
  faCalendarDay,
  faLocationDot,
  faUsers,
  faClock,
  faArrowRight,
  faSprayCanSparkles,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import RowActions from '../../components/admin/RowActions.jsx'
import NewMissionModal from '../../components/admin/NewMissionModal.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CH', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatCurrency(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    maximumFractionDigits: 0,
  }).format(n)
}

function shortId(id) {
  return `MS-${id.slice(-6).toUpperCase()}`
}

export default function AdminMissions() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [newOpen, setNewOpen] = useState(false)

  const fetcher = useCallback(() => adminApi.listMissions(), [])
  const { data, loading, error, reload } = useApi(fetcher)
  const items = data?.items || []

  const filtered = useMemo(() => {
    return items.filter((m) => {
      const matchSearch =
        !search ||
        (m.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.title || '').toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || m.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [items, search, statusFilter])

  const tabs = ['all', 'scheduled', 'inProgress', 'completed', 'cancelled']

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={t('admin.missions.eyebrow')}
        title={t('admin.missions.title')}
        description={t('admin.missions.subtitle')}
        action={
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2 text-xs font-bold"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            Nouvelle mission
          </button>
        }
      />

      {newOpen && (
        <NewMissionModal
          onClose={() => setNewOpen(false)}
          onSuccess={() => reload?.()}
        />
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.missions.searchPlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-gray-700 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((s) => {
            const active = statusFilter === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  active
                    ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-primary'
                }`}
              >
                {s === 'all' ? t('admin.devis.tabs.all') : t(`admin.statuses.${s}`)}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faSprayCanSparkles} className="h-7 w-7 text-gray-300" />
          <div className="mt-4 text-sm font-bold text-primary">
            {t('admin.missions.empty.title')}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {shortId(m.id)}
                  </div>
                  <h3 className="mt-1 truncate text-sm font-bold text-primary md:text-base">
                    {m.clientName}
                  </h3>
                  <div className="mt-0.5 truncate text-xs font-medium text-gray-500">
                    {m.title}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={m.status} label={t(`admin.statuses.${m.status}`)} />
                  <RowActions
                    resource="missions"
                    id={m.id}
                    isArchived={m.isArchived}
                    itemLabel={`la mission ${m.title}`}
                    onChange={reload}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarDay} className="h-3 w-3 text-accent" />
                  {formatDate(m.date)}
                </div>
                {m.address && (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 text-accent" />
                    {m.address}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="h-3 w-3 text-accent" />
                  {m.duration}h
                </div>
                {m.staff?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUsers} className="h-3 w-3 text-accent" />
                    <span className="truncate">{m.staff.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-sm font-bold text-primary">{formatCurrency(m.amount)}</span>
                <Link
                  to={`/admin/missions/${m.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-secondary transition hover:text-secondary-700"
                >
                  Gérer
                  <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
