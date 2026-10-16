import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClipboardList,
  faClock,
  faArrowRight,
  faUser,
  faUserGear,
  faMessage,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import RowActions from '../../components/admin/RowActions.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const PRIORITY_TONE = {
  low: 'bg-gray-100 text-gray-500',
  normal: 'bg-secondary-100 text-secondary-700',
  high: 'bg-red-50 text-red-600',
}

const TYPE_LABEL = {
  info: 'Information',
  mission: 'Mission',
  devis: 'Devis',
  planning: 'Planning',
  equipment: 'Matériel',
  leave: 'Congés',
  incident: 'Incident',
  other: 'Autre',
}

export default function AdminDemandes() {
  const { t } = useTranslation()
  const [fromFilter, setFromFilter] = useState('client') // 'client' | 'agent'
  const [statusFilter, setStatusFilter] = useState('all')

  const fetcher = useCallback(() => adminApi.listDemandes(), [])
  const { data, loading, error, reload } = useApi(fetcher)
  const items = data?.items || []

  const byFrom = useMemo(
    () => ({
      client: items.filter((d) => (d.from || 'client') === 'client'),
      agent: items.filter((d) => d.from === 'agent'),
    }),
    [items],
  )

  const scoped = byFrom[fromFilter] || []
  const filtered =
    statusFilter === 'all' ? scoped : scoped.filter((d) => d.status === statusFilter)

  const statusCounts = useMemo(
    () => ({
      all: scoped.length,
      new: scoped.filter((d) => d.status === 'new').length,
      in_review: scoped.filter((d) => d.status === 'in_review').length,
      replied: scoped.filter((d) => d.status === 'replied').length,
      closed: scoped.filter((d) => d.status === 'closed').length,
    }),
    [scoped],
  )

  const statusTabs = ['all', 'new', 'in_review', 'replied', 'closed']

  const isAgent = fromFilter === 'agent'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={t('admin.demandes.eyebrow')}
        title={t('admin.demandes.title')}
        description={t('admin.demandes.subtitle')}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      )}

      {/* Top tabs — Client vs Agent */}
      <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              setFromFilter('client')
              setStatusFilter('all')
            }}
            className={`flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold transition ${
              fromFilter === 'client'
                ? 'bg-gradient-to-br from-primary-700 to-secondary-700 text-white shadow-md shadow-secondary/30'
                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
            }`}
          >
            <FontAwesomeIcon icon={faUser} className="h-3.5 w-3.5" />
            Demandes clients
            <span
              className={`inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${
                fromFilter === 'client' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {byFrom.client.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFromFilter('agent')
              setStatusFilter('all')
            }}
            className={`flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold transition ${
              fromFilter === 'agent'
                ? 'bg-gradient-to-br from-accent to-accent-700 text-white shadow-md shadow-accent/30'
                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
            }`}
          >
            <FontAwesomeIcon icon={faUserGear} className="h-3.5 w-3.5" />
            Demandes agents
            <span
              className={`inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${
                fromFilter === 'agent' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {byFrom.agent.length}
            </span>
          </button>
        </div>
      </div>

      {/* Status sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map((s) => {
          const active = statusFilter === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                active
                  ? isAgent
                    ? 'bg-accent text-white shadow-sm shadow-accent/30'
                    : 'bg-secondary text-white shadow-sm shadow-secondary/30'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-primary'
              }`}
            >
              {s === 'all' ? 'Toutes' : t(`admin.statuses.${s}`)}
              <span
                className={`inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {statusCounts[s] || 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FontAwesomeIcon icon={faClipboardList} className="h-8 w-8 text-gray-300" />
            <div className="mt-3 text-sm font-bold text-primary">
              {isAgent ? 'Aucune demande agent' : 'Aucune demande client'}
            </div>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Aucune demande ne correspond à ce filtre.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((d) => (
              <li key={d.id} className="relative">
                <Link
                  to={`/admin/demandes/${d.id}`}
                  className="flex items-start gap-4 p-4 transition hover:bg-secondary-50/30"
                >
                  <span
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
                      isAgent
                        ? 'bg-gradient-to-br from-accent to-accent-700'
                        : 'bg-gradient-to-br from-primary-700 to-secondary-700'
                    }`}
                  >
                    <FontAwesomeIcon icon={isAgent ? faUserGear : faUser} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={d.status} label={t(`admin.statuses.${d.status}`)} />
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          PRIORITY_TONE[d.priority] || PRIORITY_TONE.normal
                        }`}
                      >
                        {t(`admin.demandes.priority.${d.priority}`, { defaultValue: d.priority })}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        · {TYPE_LABEL[d.type] || d.type}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-sm font-bold text-primary md:text-base">
                      {d.subject}
                    </div>
                    <div className="mt-0.5 text-xs font-medium text-secondary-700">
                      {d.clientName}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-500">
                      {d.message}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                        {formatDate(d.receivedAt)}
                      </span>
                      {d.replies?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-secondary-700">
                          <FontAwesomeIcon icon={faMessage} className="h-2.5 w-2.5" />
                          {d.replies.length} réponse{d.replies.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="mt-2 h-3.5 w-3.5 text-gray-400" />
                </Link>
                <div className="absolute right-3 top-3">
                  <RowActions
                    resource="demandes"
                    id={d.id}
                    isArchived={d.isArchived}
                    itemLabel={`la demande « ${d.subject} »`}
                    onChange={reload}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
