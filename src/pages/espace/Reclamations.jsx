import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTriangleExclamation,
  faPlus,
  faArrowRight,
  faClock,
  faMessage,
} from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/espace/PageHeader.jsx'
import EmptyState from '../../components/espace/EmptyState.jsx'
import { meApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const statusColors = {
  open: 'bg-amber-100 text-amber-700',
  in_review: 'bg-tertiary-50 text-tertiary-700',
  resolved: 'bg-accent/10 text-accent-700',
  closed: 'bg-gray-100 text-gray-500',
}

const severityColors = {
  low: 'bg-gray-100 text-gray-500',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-50 text-red-600',
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium' }).format(new Date(iso))
}

export default function Reclamations() {
  const { t } = useTranslation()
  const fetcher = useCallback(() => meApi.listReclamations(), [])
  const { data, loading, error } = useApi(fetcher)
  const items = data?.items || []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('espace.reclamations.eyebrow')}
        title={t('espace.reclamations.title')}
        description={t('espace.reclamations.subtitle')}
        action={
          <Link
            to="/espace-client/reclamations/nouvelle"
            className="btn-primary px-5 py-2.5 text-sm"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            {t('espace.reclamations.newCta')}
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
          icon={faTriangleExclamation}
          title={t('espace.reclamations.empty.title')}
          text={t('espace.reclamations.empty.text')}
          action={
            <Link
              to="/espace-client/reclamations/nouvelle"
              className="btn-primary px-6 py-3 text-sm"
            >
              {t('espace.reclamations.newCta')}
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                to={`/espace-client/reclamations/${r.id}`}
                className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        RC-{r.id.slice(-6).toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${severityColors[r.severity]}`}
                      >
                        {t(`espace.reclamationNew.severities.${r.severity}`, {
                          defaultValue: r.severity,
                        })}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-sm font-bold text-primary md:text-base">
                      {r.subject}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-gray-600">
                      {t(`espace.reclamationNew.categories.${r.category}`, {
                        defaultValue: r.category,
                      })}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-gray-400">
                      <span className="inline-flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                        {formatDate(r.createdAt)}
                      </span>
                      {r.replies?.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-secondary-700">
                          <FontAwesomeIcon icon={faMessage} className="h-2.5 w-2.5" />
                          {r.replies.length} réponse{r.replies.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        statusColors[r.status] || statusColors.open
                      }`}
                    >
                      {t(`admin.statuses.${r.status}`, { defaultValue: r.status })}
                    </span>
                    <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3 text-gray-300" />
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
