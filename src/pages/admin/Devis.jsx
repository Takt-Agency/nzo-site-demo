import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
  faCheck,
  faPaperPlane,
  faPlus,
  faXmark,
  faEye,
  faCalendarCheck,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import DevisActionModal from '../../components/admin/DevisActionModal.jsx'
import AdminDevisFormModal from '../../components/admin/AdminDevisFormModal.jsx'
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

function formatCurrency(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    maximumFractionDigits: 0,
  }).format(n)
}

function shortId(id) {
  return `DV-${id.slice(-6).toUpperCase()}`
}

export default function AdminDevis() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null) // { devis, mode }
  const [showCreate, setShowCreate] = useState(false)

  const fetcher = useCallback(() => adminApi.listDevis(), [])
  const { data, loading, error, reload } = useApi(fetcher)
  const allItems = data?.items || []

  const filtered = useMemo(() => {
    return allItems.filter((d) => {
      const matchSearch =
        !search ||
        (d.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || d.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [allItems, search, statusFilter])

  const counts = useMemo(
    () => ({
      all: allItems.length,
      new: allItems.filter((d) => d.status === 'new').length,
      pending: allItems.filter((d) => d.status === 'pending').length,
      quoted: allItems.filter((d) => d.status === 'quoted').length,
      accepted: allItems.filter((d) => d.status === 'accepted').length,
      rejected: allItems.filter((d) => d.status === 'rejected').length,
    }),
    [allItems],
  )

  const statusOptions = [
    { value: 'all', label: t('admin.devis.tabs.all'), count: counts.all },
    { value: 'new', label: t('admin.statuses.new'), count: counts.new },
    { value: 'pending', label: t('admin.statuses.pending'), count: counts.pending },
    { value: 'quoted', label: t('admin.statuses.quoted'), count: counts.quoted },
    { value: 'accepted', label: t('admin.statuses.accepted'), count: counts.accepted },
    { value: 'rejected', label: t('admin.statuses.rejected'), count: counts.rejected },
  ]

  const submitAction = async (payload) => {
    await adminApi.updateDevis(modal.devis.id, payload)
    reload()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={t('admin.devis.eyebrow')}
        title={t('admin.devis.title')}
        description={t('admin.devis.subtitle')}
        action={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            {t('admin.devis.newDevis', { defaultValue: 'Nouveau devis' })}
          </button>
        }
      />

      {showCreate && (
        <AdminDevisFormModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => reload()}
        />
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
        <div className="flex min-w-max gap-1">
          {statusOptions.map((opt) => {
            const active = statusFilter === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                }`}
              >
                {opt.label}
                <span
                  className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="relative">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.devis.searchPlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-gray-700 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-sm font-bold text-primary">{t('admin.devis.empty.title')}</div>
            <p className="mt-1 text-xs font-medium text-gray-500">{t('admin.devis.empty.text')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-3 p-4 transition hover:bg-secondary-50/30 md:flex-row md:items-center md:gap-5"
              >
                <Link to={`/admin/devis/${d.id}`} className="block min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {shortId(d.id)}
                    </span>
                    <StatusBadge status={d.status} label={t(`admin.statuses.${d.status}`)} />
                    {d.status === 'accepted' && !d.convertedToMission && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700 ring-1 ring-accent/30">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                        </span>
                        {t('admin.devis.toConvert', { defaultValue: 'À convertir en mission' })}
                      </span>
                    )}
                    {d.status === 'accepted' && d.convertedToMission && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-700 ring-1 ring-secondary/20">
                        <FontAwesomeIcon icon={faCalendarCheck} className="h-2.5 w-2.5" />
                        {t('admin.devis.converted', { defaultValue: 'Mission créée' })}
                      </span>
                    )}
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                      · {formatDate(d.receivedAt)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-primary transition hover:text-secondary">{d.clientName}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-gray-500">
                    <span>
                      {t(`services.${d.service}.title`, { defaultValue: d.service })} · {d.surface} m²
                    </span>
                    <span>
                      {t(`devis.frequencies.${d.frequency}`, { defaultValue: d.frequency })}
                    </span>
                    {d.city && <span>{d.city}</span>}
                  </div>
                </Link>

                <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-center">
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">
                      {formatCurrency(d.amount)}
                    </div>
                    {d.amount == null && (
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {t('admin.devis.toEstimate')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(d.status === 'new' || d.status === 'pending') && (
                      <button
                        type="button"
                        title={t('admin.devis.actions.send')}
                        onClick={() => setModal({ devis: d, mode: 'send' })}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white transition hover:bg-accent-600"
                      >
                        <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {d.status === 'quoted' && (
                      <button
                        type="button"
                        title={t('admin.devis.actions.accept')}
                        onClick={() => setModal({ devis: d, mode: 'accept' })}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white transition hover:bg-accent-600"
                      >
                        <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {d.status === 'accepted' && !d.convertedToMission && (
                      <Link
                        to={`/admin/devis/${d.id}`}
                        title={t('admin.devis.actions.convert', { defaultValue: 'Convertir en mission' })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[11px] font-bold text-white shadow-sm shadow-accent/30 transition hover:bg-accent-600"
                      >
                        <FontAwesomeIcon icon={faCalendarCheck} className="h-3 w-3" />
                        {t('admin.devis.actions.convert', { defaultValue: 'Convertir' })}
                        <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" />
                      </Link>
                    )}
                    {d.status !== 'accepted' && d.status !== 'rejected' && (
                      <button
                        type="button"
                        title={t('admin.devis.actions.reject')}
                        onClick={() => setModal({ devis: d, mode: 'reject' })}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <Link
                      to={`/admin/devis/${d.id}`}
                      title={t('admin.devis.actions.review')}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-secondary-50 hover:text-secondary"
                    >
                      <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                    </Link>
                    <RowActions
                      resource="devis"
                      id={d.id}
                      isArchived={d.isArchived}
                      itemLabel={`ce devis (${d.clientName})`}
                      onChange={reload}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && (
        <DevisActionModal
          devis={modal.devis}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSubmit={submitAction}
        />
      )}
    </div>
  )
}
