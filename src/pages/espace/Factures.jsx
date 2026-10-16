import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDownload,
  faFileInvoiceDollar,
  faArrowRight,
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/espace/PageHeader.jsx'
import EmptyState from '../../components/espace/EmptyState.jsx'
import { meApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const statusColors = {
  pending: 'bg-secondary-100 text-secondary-700',
  paid: 'bg-accent text-white',
  overdue: 'bg-red-50 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium' }).format(new Date(iso))
}

function formatAmount(n, currency = 'CHF') {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(n)
}

export default function Factures() {
  const { t } = useTranslation()
  const fetcher = useCallback(() => meApi.listFactures(), [])
  const { data, loading, error } = useApi(fetcher)
  const items = data?.items || []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('espace.factures.eyebrow')}
        title={t('espace.factures.title')}
        description={t('espace.factures.subtitle')}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={faFileInvoiceDollar}
          title={t('espace.factures.empty.title')}
          text={t('espace.factures.empty.text')}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-3">{t('espace.factures.cols.number')}</th>
                  <th className="px-5 py-3">{t('espace.factures.cols.date')}</th>
                  <th className="px-5 py-3">{t('espace.factures.cols.dueDate')}</th>
                  <th className="px-5 py-3">{t('espace.factures.cols.amount')}</th>
                  <th className="px-5 py-3">{t('espace.factures.cols.status')}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((inv) => (
                  <tr
                    key={inv.id}
                    className="cursor-pointer transition hover:bg-secondary-50/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <Link
                        to={`/espace-client/factures/${inv.id}`}
                        className="flex items-center gap-2.5"
                      >
                        <FontAwesomeIcon
                          icon={faFileInvoiceDollar}
                          className="h-3.5 w-3.5 text-secondary"
                        />
                        <span className="font-bold text-primary transition hover:text-secondary">
                          {inv.number}
                        </span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-600">
                      <Link to={`/espace-client/factures/${inv.id}`} className="block">
                        {formatDate(inv.issueDate)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-600">
                      <Link to={`/espace-client/factures/${inv.id}`} className="block">
                        {inv.dueDate ? formatDate(inv.dueDate) : '—'}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-primary">
                      <Link to={`/espace-client/factures/${inv.id}`} className="block">
                        {formatAmount(inv.amount, inv.currency)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                          statusColors[inv.status] || statusColors.pending
                        }`}
                      >
                        {t(`espace.factures.statuses.${inv.status}`, { defaultValue: inv.status })}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/espace-client/factures/${inv.id}/imprimer`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white"
                        >
                          <FontAwesomeIcon icon={faFilePdf} className="h-3 w-3" />
                          PDF
                        </a>
                        {inv.pdfUrl && (
                          <a
                            href={inv.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 rounded-full bg-secondary-50 px-3 py-1.5 text-xs font-bold text-secondary-700 transition hover:bg-secondary hover:text-white"
                          >
                            <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
                          </a>
                        )}
                        <Link
                          to={`/espace-client/factures/${inv.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-secondary-50 hover:text-secondary"
                          aria-label="Voir la facture"
                        >
                          <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
