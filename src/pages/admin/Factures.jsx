import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faDownload,
  faCircleCheck,
  faPencil,
  faBoxArchive,
  faFileInvoiceDollar,
  faEllipsisVertical,
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium' }).format(new Date(iso))
}

function formatCurrency(n, currency = 'CHF') {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(n)
}

const STATUS_LABELS_FR = {
  pending: 'À payer',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
  archived: 'Archivée',
}

export default function AdminFactures() {
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [menuId, setMenuId] = useState(null)

  const fetcher = useCallback(() => adminApi.listFactures(), [])
  const { data, loading, error, reload } = useApi(fetcher)
  const all = data?.items || []

  const tabs = ['all', 'pending', 'paid', 'overdue', 'archived']

  const filtered = useMemo(() => {
    if (statusFilter === 'all') {
      // Hide archived from "Toutes" by default — too noisy.
      return all.filter((f) => f.status !== 'archived')
    }
    return all.filter((f) => f.status === statusFilter)
  }, [all, statusFilter])

  const totals = useMemo(() => {
    const active = all.filter((f) => f.status !== 'archived')
    return {
      pending: active.filter((f) => f.status === 'pending').reduce((s, f) => s + f.amount, 0),
      paid: active.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0),
      overdue: active.filter((f) => f.status === 'overdue').reduce((s, f) => s + f.amount, 0),
    }
  }, [all])

  const statusCounts = useMemo(
    () => ({
      all: all.filter((f) => f.status !== 'archived').length,
      pending: all.filter((f) => f.status === 'pending').length,
      paid: all.filter((f) => f.status === 'paid').length,
      overdue: all.filter((f) => f.status === 'overdue').length,
      archived: all.filter((f) => f.status === 'archived').length,
    }),
    [all],
  )

  const markPaid = async (id) => {
    setBusyId(id)
    setMenuId(null)
    try {
      await adminApi.updateFacture(id, { status: 'paid' })
      reload()
    } catch (err) {
      alert(err.message || 'Erreur')
    } finally {
      setBusyId(null)
    }
  }

  const archive = async (id, number) => {
    if (!confirm(`Archiver la facture ${number} ? Elle ne sera plus visible côté client.`)) return
    setBusyId(id)
    setMenuId(null)
    try {
      await adminApi.archiveFacture(id)
      reload()
    } catch (err) {
      alert(err.message || 'Erreur')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={t('admin.factures.eyebrow')}
        title={t('admin.factures.title')}
        description={t('admin.factures.subtitle')}
        action={
          <Link to="/admin/factures/nouvelle" className="btn-primary px-5 py-2.5 text-sm">
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            {t('admin.factures.new')}
          </Link>
        }
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-secondary-700">
            {t('admin.statuses.pending')}
          </div>
          <div className="mt-2 text-2xl font-bold text-primary">{formatCurrency(totals.pending)}</div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-accent-700">
            {t('admin.statuses.paid')}
          </div>
          <div className="mt-2 text-2xl font-bold text-primary">{formatCurrency(totals.paid)}</div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-red-600">
            {t('admin.statuses.overdue')}
          </div>
          <div className="mt-2 text-2xl font-bold text-primary">{formatCurrency(totals.overdue)}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((s) => {
          const a = statusFilter === s
          const label = s === 'all' ? 'Toutes' : STATUS_LABELS_FR[s] || s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                a
                  ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-primary'
              }`}
            >
              {label}
              <span
                className={`inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
                  a ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {statusCounts[s] || 0}
              </span>
            </button>
          )
        })}
      </div>

      <div className="overflow-visible rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="h-8 w-8 text-gray-300" />
            <div className="mt-3 text-sm font-bold text-primary">Aucune facture</div>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Créez votre première facture ou convertissez une mission terminée.
            </p>
            <Link
              to="/admin/factures/nouvelle"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-xs font-bold text-white transition hover:bg-secondary-600"
            >
              <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
              Nouvelle facture
            </Link>
          </div>
        ) : (
          <>
            <table className="hidden w-full md:table">
              <thead className="bg-gray-50">
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">{t('admin.factures.cols.number')}</th>
                  <th className="px-5 py-3">{t('admin.factures.cols.client')}</th>
                  <th className="px-5 py-3">{t('admin.factures.cols.issueDate')}</th>
                  <th className="px-5 py-3">{t('admin.factures.cols.dueDate')}</th>
                  <th className="px-5 py-3 text-right">{t('admin.factures.cols.amount')}</th>
                  <th className="px-5 py-3">{t('admin.factures.cols.status')}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((f) => (
                  <tr key={f.id} className="text-sm transition hover:bg-secondary-50/30">
                    <td className="px-5 py-4 font-bold text-primary">
                      <Link
                        to={`/admin/factures/${f.id}/modifier`}
                        className="transition hover:text-secondary"
                      >
                        {f.number}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{f.clientName}</td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(f.issueDate)}</td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(f.dueDate)}</td>
                    <td className="px-5 py-4 text-right font-bold text-primary">
                      {formatCurrency(f.amount, f.currency)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={f.status} label={STATUS_LABELS_FR[f.status] || f.status} />
                    </td>
                    <td className="relative px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {f.status === 'pending' || f.status === 'overdue' ? (
                          <button
                            type="button"
                            onClick={() => markPaid(f.id)}
                            disabled={busyId === f.id}
                            title="Marquer payée"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent-700 transition hover:bg-accent hover:text-white disabled:opacity-50"
                          >
                            <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                          </button>
                        ) : null}
                        <Link
                          to={`/admin/factures/${f.id}/modifier`}
                          title="Modifier"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-secondary-50 hover:text-secondary"
                        >
                          <FontAwesomeIcon icon={faPencil} className="h-3 w-3" />
                        </Link>
                        <a
                          href={`/admin/factures/${f.id}/imprimer`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Télécharger PDF"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                        >
                          <FontAwesomeIcon icon={faFilePdf} className="h-3 w-3" />
                        </a>
                        {f.pdfUrl && (
                          <a
                            href={f.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="PDF externe"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-secondary-50 hover:text-secondary"
                          >
                            <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
                          </a>
                        )}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setMenuId(menuId === f.id ? null : f.id)}
                            title="Plus"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-primary"
                          >
                            <FontAwesomeIcon icon={faEllipsisVertical} className="h-3 w-3" />
                          </button>
                          {menuId === f.id && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setMenuId(null)}
                              />
                              <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-100">
                                {f.status !== 'archived' ? (
                                  <button
                                    type="button"
                                    onClick={() => archive(f.id, f.number)}
                                    disabled={busyId === f.id}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                                  >
                                    <FontAwesomeIcon icon={faBoxArchive} className="h-3 w-3" />
                                    Archiver
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setBusyId(f.id)
                                      setMenuId(null)
                                      try {
                                        await adminApi.updateFacture(f.id, { status: 'pending' })
                                        reload()
                                      } catch (err) {
                                        alert(err.message || 'Erreur')
                                      } finally {
                                        setBusyId(null)
                                      }
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-secondary-50 hover:text-secondary"
                                  >
                                    <FontAwesomeIcon icon={faBoxArchive} className="h-3 w-3" />
                                    Désarchiver
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-gray-100 md:hidden">
              {filtered.map((f) => (
                <li key={f.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/admin/factures/${f.id}/modifier`} className="min-w-0 flex-1">
                      <div className="font-bold text-primary">{f.number}</div>
                      <div className="text-xs font-medium text-gray-500">{f.clientName}</div>
                    </Link>
                    <StatusBadge status={f.status} label={STATUS_LABELS_FR[f.status] || f.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-[11px] font-medium text-gray-500">
                      Échéance {formatDate(f.dueDate)}
                    </div>
                    <div className="text-sm font-bold text-primary">
                      {formatCurrency(f.amount, f.currency)}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(f.status === 'pending' || f.status === 'overdue') && (
                      <button
                        type="button"
                        onClick={() => markPaid(f.id)}
                        disabled={busyId === f.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent-700 transition hover:bg-accent hover:text-white"
                      >
                        <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                        Marquer payée
                      </button>
                    )}
                    <Link
                      to={`/admin/factures/${f.id}/modifier`}
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:border-secondary hover:text-secondary"
                    >
                      <FontAwesomeIcon icon={faPencil} className="h-3 w-3" />
                      Modifier
                    </Link>
                    <a
                      href={`/admin/factures/${f.id}/imprimer`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <FontAwesomeIcon icon={faFilePdf} className="h-3 w-3" />
                      PDF
                    </a>
                    {f.status !== 'archived' && (
                      <button
                        type="button"
                        onClick={() => archive(f.id, f.number)}
                        disabled={busyId === f.id}
                        className="inline-flex items-center gap-1.5 rounded-full border-2 border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition hover:border-amber-300 hover:text-amber-700"
                      >
                        <FontAwesomeIcon icon={faBoxArchive} className="h-3 w-3" />
                        Archiver
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
