import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faCircleExclamation,
  faMessage,
  faClock,
  faArrowRight,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { agentApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const PRIORITY_TONE = {
  low: 'bg-gray-100 text-gray-600 ring-gray-200',
  normal: 'bg-secondary/10 text-secondary-700 ring-secondary/30',
  high: 'bg-red-50 text-red-700 ring-red-200',
}

const STATUS_TONE = {
  new: 'bg-accent/10 text-accent-700 ring-accent/30',
  in_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  replied: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-gray-100 text-gray-600 ring-gray-200',
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function AgentDemandes() {
  const { t } = useTranslation()
  const fetcher = useCallback(() => agentApi.listDemandes(), [])
  const { data, loading, error } = useApi(fetcher)
  const items = data?.items || []

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-700">
            {t('agent.demandes.eyebrow')}
          </div>
          <h1 className="mt-1 text-xl font-bold text-primary md:text-2xl">
            {t('agent.demandes.title')}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            {t('agent.demandes.subtitle')}
          </p>
        </div>
        <Link
          to="/espace-agent/demandes/nouvelle"
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-accent/30 transition hover:bg-accent-600 sm:self-end"
        >
          <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
          {t('agent.demandes.new')}
        </Link>
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
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FontAwesomeIcon icon={faMessage} className="h-8 w-8 text-gray-300" />
            <div className="mt-3 text-sm font-bold text-primary">{t('agent.demandes.empty')}</div>
            <p className="mt-1 text-xs font-medium text-gray-500">
              {t('agent.demandes.emptyHint')}
            </p>
            <Link
              to="/espace-agent/demandes/nouvelle"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-white transition hover:bg-accent-600"
            >
              <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
              {t('agent.demandes.makeRequest')}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((d) => (
              <li key={d.id}>
                <Link
                  to={`/espace-agent/demandes/${d.id}`}
                  className="block p-4 transition hover:bg-accent/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                            STATUS_TONE[d.status] || STATUS_TONE.new
                          }`}
                        >
                          {t(`agent.demandeStatuses.${d.status}`, { defaultValue: d.status })}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                            PRIORITY_TONE[d.priority] || PRIORITY_TONE.normal
                          }`}
                        >
                          {t(`agent.priorities.${d.priority}`, { defaultValue: d.priority })}
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                          · {t(`agent.demandeTypes.${d.type}`, { defaultValue: d.type })}
                        </span>
                      </div>
                      <div className="mt-1 truncate text-sm font-bold text-primary md:text-base">
                        {d.subject}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs font-medium text-gray-600">
                        {d.message}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                          {formatDate(d.createdAt)}
                        </span>
                        {d.replies?.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-secondary-700">
                            <FontAwesomeIcon icon={faMessage} className="h-2.5 w-2.5" />
                            {t('agent.demandes.replyCount', { count: d.replies.length })}
                          </span>
                        )}
                      </div>

                      {d.replies?.length > 0 && (
                        <div className="mt-3 rounded-xl bg-gray-50 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {t('agent.demandes.lastReply', {
                              author:
                                d.replies[d.replies.length - 1].from === 'admin'
                                  ? t('agent.demandes.authorAdmin')
                                  : t('agent.demandes.authorYou'),
                            })}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-700">
                            {d.replies[d.replies.length - 1].text}
                          </p>
                        </div>
                      )}
                    </div>
                    <FontAwesomeIcon icon={faChevronRight} className="mt-2 h-3 w-3 text-gray-400" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
