import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilePen, faArrowRight, faPlus } from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/espace/PageHeader.jsx'
import EmptyState from '../../components/espace/EmptyState.jsx'
import { meApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const statusColors = {
  new: 'bg-secondary-100 text-secondary-700',
  pending: 'bg-secondary-100 text-secondary-700',
  quoted: 'bg-accent/10 text-accent-700',
  accepted: 'bg-accent text-white',
  rejected: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-gray-100 text-gray-500',
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium' }).format(new Date(iso))
}

function formatPrice(n, currency = 'CHF') {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(n)
}

export default function EspaceDevis() {
  const { t } = useTranslation()
  const fetcher = useCallback(() => meApi.listDevis(), [])
  const { data, loading, error } = useApi(fetcher)
  const items = data?.items || []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('espace.devis.eyebrow')}
        title={t('espace.devis.title')}
        description={t('espace.devis.subtitle')}
        action={
          <Link to="/devis" className="btn-primary px-5 py-2.5 text-sm">
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            {t('espace.devis.newCta')}
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
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-24 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <EmptyState
          icon={faFilePen}
          title={t('espace.devis.empty.title')}
          text={t('espace.devis.empty.text')}
          action={
            <Link to="/devis" className="btn-primary px-6 py-3 text-sm">
              {t('espace.devis.newCta')}
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((q) => (
            <li key={q.id}>
              <Link
                to={`/espace-client/devis/${q.id}`}
                className="group flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-50 text-secondary">
                    <FontAwesomeIcon icon={faFilePen} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      {q.id.slice(-6).toUpperCase()}
                    </div>
                    <h3 className="mt-0.5 text-sm font-bold text-primary group-hover:text-secondary">
                      {t(`services.${q.service}.title`, { defaultValue: q.service })}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-gray-500">
                      <span>
                        {q.surface} m² · {t(`devis.frequencies.${q.frequency}`)}
                      </span>
                      {q.city && <><span>·</span><span>{q.city}</span></>}
                      <span>·</span>
                      <span>{formatDate(q.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {q.amount != null && (
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {t('espace.devis.estimate')}
                      </div>
                      <div className="text-base font-bold text-primary">
                        {formatPrice(q.amount, q.currency)}
                      </div>
                    </div>
                  )}
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      statusColors[q.status] || statusColors.pending
                    }`}
                  >
                    {t(`espace.devis.statuses.${q.status}`, { defaultValue: q.status })}
                  </span>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="hidden h-3 w-3 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-secondary sm:inline"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
