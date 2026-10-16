import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSprayCanSparkles,
  faLocationDot,
  faPhone,
  faArrowRight,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { agentApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const STATUS_TONE = {
  scheduled: 'bg-secondary/10 text-secondary-700 ring-secondary/30',
  inProgress: 'bg-accent/10 text-accent-700 ring-accent/30',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

export default function AgentMissions() {
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState('all')
  const fetcher = useCallback(() => agentApi.listMissions(), [])
  const { data, loading, error } = useApi(fetcher)
  const items = data?.items || []

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return items
    return items.filter((m) => m.status === statusFilter)
  }, [items, statusFilter])

  const counts = useMemo(
    () => ({
      all: items.length,
      scheduled: items.filter((m) => m.status === 'scheduled').length,
      inProgress: items.filter((m) => m.status === 'inProgress').length,
      completed: items.filter((m) => m.status === 'completed').length,
    }),
    [items],
  )

  const tabs = [
    { value: 'all', label: t('agent.missions.tabs.all'), count: counts.all },
    { value: 'scheduled', label: t('agent.missions.tabs.scheduled'), count: counts.scheduled },
    { value: 'inProgress', label: t('agent.missions.tabs.inProgress'), count: counts.inProgress },
    { value: 'completed', label: t('agent.missions.tabs.completed'), count: counts.completed },
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-700">
          {t('agent.missions.eyebrow')}
        </div>
        <h1 className="mt-1 text-xl font-bold text-primary md:text-2xl">{t('agent.missions.title')}</h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          {t('agent.missions.subtitle')}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => {
            const active = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-accent text-white shadow-sm shadow-accent/30'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
          {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FontAwesomeIcon icon={faSprayCanSparkles} className="h-8 w-8 text-gray-300" />
            <div className="mt-3 text-sm font-bold text-primary">{t('agent.missions.empty')}</div>
            <p className="mt-1 text-xs font-medium text-gray-500">
              {t('agent.missions.emptyHint')}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/espace-agent/missions/${m.id}`}
                  className="flex items-start gap-4 p-4 transition hover:bg-secondary-50/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                          STATUS_TONE[m.status] || STATUS_TONE.scheduled
                        }`}
                      >
                        {t(`agent.statuses.${m.status}`, { defaultValue: m.status })}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                        {formatDateTime(m.date)}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-sm font-bold text-primary md:text-base">
                      {m.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-medium text-gray-500">
                      <span>{m.clientName}</span>
                      {m.city && (
                        <span className="inline-flex items-center gap-1">
                          <FontAwesomeIcon icon={faLocationDot} className="h-2.5 w-2.5" />
                          {m.city}
                        </span>
                      )}
                      {m.clientPhone && (
                        <a
                          href={`tel:${m.clientPhone.replace(/\s/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-secondary hover:text-secondary-700"
                        >
                          <FontAwesomeIcon icon={faPhone} className="h-2.5 w-2.5" />
                          {m.clientPhone}
                        </a>
                      )}
                    </div>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="mt-2 h-3.5 w-3.5 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
