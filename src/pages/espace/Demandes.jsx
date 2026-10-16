import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClipboardList, faPlus, faArrowRight, faClock } from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/espace/PageHeader.jsx'
import EmptyState from '../../components/espace/EmptyState.jsx'
import { meApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const statusColors = {
  new: 'bg-secondary-100 text-secondary-700',
  in_review: 'bg-tertiary-50 text-tertiary-700',
  replied: 'bg-accent/10 text-accent-700',
  closed: 'bg-gray-100 text-gray-500',
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium' }).format(new Date(iso))
}

export default function Demandes() {
  const { t } = useTranslation()
  const fetcher = useCallback(() => meApi.listDemandes(), [])
  const { data, loading, error } = useApi(fetcher)
  const items = data?.items || []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('espace.demandes.eyebrow')}
        title={t('espace.demandes.title')}
        description={t('espace.demandes.subtitle')}
        action={
          <Link to="/espace-client/demandes/nouvelle" className="btn-primary px-5 py-2.5 text-sm">
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            {t('espace.demandes.newCta')}
          </Link>
        }
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      )}

      {loading ? (
        <ul className="space-y-3">
          {[0, 1].map((i) => (
            <li key={i} className="h-28 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <EmptyState
          icon={faClipboardList}
          title={t('espace.demandes.empty.title')}
          text={t('espace.demandes.empty.text')}
          action={
            <Link to="/espace-client/demandes/nouvelle" className="btn-primary px-6 py-3 text-sm">
              {t('espace.demandes.newCta')}
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    {r.id.slice(-6).toUpperCase()}
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-primary">{r.subject}</h3>
                  <p className="mt-2 text-sm font-medium text-gray-600">{r.message}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                    <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                    {formatDate(r.createdAt)}
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    statusColors[r.status] || statusColors.new
                  }`}
                >
                  {t(`espace.demandes.statuses.${r.status}`, { defaultValue: r.status })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
