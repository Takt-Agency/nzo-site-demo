import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSprayCanSparkles,
  faCalendarCheck,
  faLocationDot,
  faCircleCheck,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/espace/PageHeader.jsx'
import EmptyState from '../../components/espace/EmptyState.jsx'
import { meApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const statusColors = {
  scheduled: 'bg-secondary-100 text-secondary-700',
  inProgress: 'bg-tertiary-50 text-tertiary-700',
  completed: 'bg-accent/10 text-accent-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function Missions() {
  const { t } = useTranslation()
  const fetcher = useCallback(() => meApi.listMissions(), [])
  const { data, loading, error } = useApi(fetcher)
  const items = data?.items || []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('espace.missions.eyebrow')}
        title={t('espace.missions.title')}
        description={t('espace.missions.subtitle')}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      )}

      {loading ? (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-24 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <EmptyState
          icon={faSprayCanSparkles}
          title={t('espace.missions.empty.title')}
          text={t('espace.missions.empty.text')}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((m) => (
            <li key={m.id}>
              <Link
                to={`/espace-client/missions/${m.id}`}
                className="group block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-50 text-secondary">
                      <FontAwesomeIcon icon={faSprayCanSparkles} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        MS-{m.id.slice(-6).toUpperCase()}
                      </div>
                      <h3 className="mt-0.5 text-sm font-bold text-primary group-hover:text-secondary">
                        {m.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faCalendarCheck} className="h-3 w-3 text-accent" />
                          {formatDate(m.date)}
                        </span>
                        {m.address && (
                          <span className="inline-flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 text-accent" />
                            {m.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex shrink-0 items-center self-start rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:self-center ${
                        statusColors[m.status] || statusColors.scheduled
                      }`}
                    >
                      {m.status === 'completed' && (
                        <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5 h-2.5 w-2.5" />
                      )}
                      {t(`admin.statuses.${m.status}`, { defaultValue: m.status })}
                    </span>
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className="hidden h-3 w-3 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-secondary sm:inline"
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
