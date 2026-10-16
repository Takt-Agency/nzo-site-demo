import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faMagnifyingGlass,
  faEnvelope,
  faPhone,
  faEye,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import RowActions from '../../components/admin/RowActions.jsx'
import ClientFormModal from '../../components/admin/ClientFormModal.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const typeColors = {
  particulier: 'bg-secondary-100 text-secondary-700',
  entreprise: 'bg-accent/10 text-accent-700',
  proImmo: 'bg-tertiary-50 text-tertiary-700',
  association: 'bg-amber-100 text-amber-700',
}

function formatCurrency(n) {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium' }).format(new Date(iso))
}

function shortId(id) {
  return `CL-${id.slice(-6).toUpperCase()}`
}

export default function AdminClients() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  const fetcher = useCallback(() => adminApi.listClients(), [])
  const { data, loading, error, reload } = useApi(fetcher)
  const clients = data?.items || []

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'all' || c.type === typeFilter
      return matchSearch && matchType
    })
  }, [clients, search, typeFilter])

  const typeOptions = [
    { value: 'all', label: t('admin.clients.types.all') },
    { value: 'particulier', label: t('admin.clients.types.particulier') },
    { value: 'entreprise', label: t('admin.clients.types.entreprise') },
    { value: 'proImmo', label: t('admin.clients.types.proImmo') },
    { value: 'association', label: t('admin.clients.types.association') },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={t('admin.clients.eyebrow')}
        title={t('admin.clients.title')}
        description={t('admin.clients.subtitle', { count: clients.length })}
        action={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            {t('admin.clients.newClient')}
          </button>
        }
      />

      {showCreate && (
        <ClientFormModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => reload()}
        />
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.clients.searchPlaceholder')}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-gray-700 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((opt) => {
              const active = typeFilter === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTypeFilter(opt.value)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                      : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-sm font-bold text-primary">{t('admin.clients.empty.title')}</div>
            <p className="mt-1 text-xs font-medium text-gray-500">{t('admin.clients.empty.text')}</p>
          </div>
        ) : (
          <>
            <table className="hidden w-full lg:table">
              <thead className="bg-gray-50">
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">{t('admin.clients.cols.client')}</th>
                  <th className="px-5 py-3">{t('admin.clients.cols.type')}</th>
                  <th className="px-5 py-3">{t('admin.clients.cols.contact')}</th>
                  <th className="px-5 py-3">{t('admin.clients.cols.since')}</th>
                  <th className="px-5 py-3 text-right">{t('admin.clients.cols.spent')}</th>
                  <th className="px-5 py-3 text-center">
                    {t('admin.clients.cols.activeMissions')}
                  </th>
                  <th className="px-5 py-3">{t('admin.clients.cols.status')}</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="text-sm transition hover:bg-secondary-50/30">
                    <td className="px-5 py-4">
                      <Link
                        to={`/admin/clients/${c.id}`}
                        className="block font-bold text-primary transition hover:text-secondary"
                      >
                        {c.name}
                      </Link>
                      {c.company && (
                        <div className="text-xs font-medium text-gray-500">{c.company}</div>
                      )}
                      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {shortId(c.id)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${typeColors[c.type] || typeColors.particulier}`}
                      >
                        {t(`admin.clients.types.${c.type}`, { defaultValue: c.type })}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-gray-600">
                      <div>{c.email}</div>
                      <div className="mt-0.5 text-gray-400">{c.phone || '—'}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-gray-600">
                      {formatDate(c.sinceDate)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-bold text-primary">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-bold text-primary">
                      {c.activeMissions}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={c.status} label={t(`admin.statuses.${c.status}`)} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/clients/${c.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-secondary-50 hover:text-secondary"
                          aria-label={t('admin.clientDetail.view')}
                        >
                          <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                        </Link>
                        <RowActions
                          resource="clients"
                          id={c.id}
                          isArchived={c.isArchived}
                          itemLabel={`le client ${c.name}`}
                          onChange={reload}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-gray-100 lg:hidden">
              {filtered.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/admin/clients/${c.id}`}
                    className="block p-4 transition hover:bg-secondary-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {shortId(c.id)}
                        </div>
                        <div className="mt-0.5 font-bold text-primary">{c.name}</div>
                        {c.company && (
                          <div className="text-xs font-medium text-gray-500">{c.company}</div>
                        )}
                      </div>
                      <StatusBadge status={c.status} label={t(`admin.statuses.${c.status}`)} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-gray-600">
                      <span className="inline-flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3 text-secondary" />
                        {c.email}
                      </span>
                      {c.phone && (
                        <span className="inline-flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faPhone} className="h-3 w-3 text-secondary" />
                          {c.phone}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${typeColors[c.type] || typeColors.particulier}`}
                      >
                        {t(`admin.clients.types.${c.type}`, { defaultValue: c.type })}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary">
                          {formatCurrency(c.totalSpent)}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {c.activeMissions} {t('admin.clients.cols.activeMissions')}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
