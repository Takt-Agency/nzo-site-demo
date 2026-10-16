import { useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faEnvelope,
  faPhone,
  faLocationDot,
  faCalendarDay,
  faPencil,
  faPaperPlane,
  faEllipsis,
  faFilePen,
  faSprayCanSparkles,
  faFileInvoiceDollar,
  faTriangleExclamation,
  faClipboardList,
  faMoneyBillTrendUp,
  faClock,
  faCircleCheck,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import KpiCard from '../../components/admin/KpiCard.jsx'
import ClientEditModal from '../../components/admin/ClientEditModal.jsx'
import { adminApi, ApiError } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const typeColors = {
  particulier: 'bg-secondary-100 text-secondary-700',
  entreprise: 'bg-accent/10 text-accent-700',
  proImmo: 'bg-tertiary-50 text-tertiary-700',
  association: 'bg-amber-100 text-amber-700',
}

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
function formatCurrency(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    maximumFractionDigits: 0,
  }).format(n)
}
function formatDate(iso, withTime = false) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(
    'fr-CH',
    withTime
      ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { dateStyle: 'medium' },
  ).format(new Date(iso))
}
function shortId(prefix, id) {
  return `${prefix}-${id.slice(-6).toUpperCase()}`
}

const tabConfig = [
  { key: 'devis', icon: faFilePen },
  { key: 'missions', icon: faSprayCanSparkles },
  { key: 'factures', icon: faFileInvoiceDollar },
  { key: 'demandes', icon: faClipboardList },
  { key: 'reclamations', icon: faTriangleExclamation },
]

export default function AdminClientDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [tab, setTab] = useState('devis')
  const [editOpen, setEditOpen] = useState(false)

  const fetcher = useCallback(() => adminApi.getClient(id), [id])
  const { data, loading, error, reload } = useApi(fetcher, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200" />
        <div className="h-20 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
      </div>
    )
  }

  if (error || !data) {
    const is404 = error instanceof ApiError && error.status === 404
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
        <FontAwesomeIcon icon={faCircleExclamation} className="h-8 w-8 text-gray-300" />
        <h2 className="mt-4 text-base font-bold text-primary">
          {is404 ? t('admin.clientDetail.notFound.title') : 'Erreur de chargement'}
        </h2>
        {error && !is404 && (
          <p className="mt-1 text-xs font-medium text-gray-500">{error.message}</p>
        )}
        <Link to="/admin/clients" className="btn-primary mt-6 px-5 py-2.5 text-sm">
          {t('admin.clientDetail.backToList')}
        </Link>
      </div>
    )
  }

  const { client, aggregates } = data
  const counts = {
    devis: aggregates.devis.length,
    missions: aggregates.missions.length,
    factures: aggregates.factures.length,
    demandes: aggregates.demandes.length,
    reclamations: aggregates.reclamations.length,
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/clients"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {t('admin.clientDetail.backToList')}
      </Link>

      <AdminPageHeader
        eyebrow={shortId('CL', client.id)}
        title={client.name}
        description={client.company || t(`admin.clients.types.${client.type}`)}
        action={
          <div className="flex flex-wrap gap-2">
            <a
              href={`mailto:${client.email}`}
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
              {t('admin.clientDetail.actions.message')}
            </a>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="btn-primary px-4 py-2 text-xs"
            >
              <FontAwesomeIcon icon={faPencil} className="h-3 w-3" />
              {t('admin.clientDetail.actions.edit')}
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary">
              <FontAwesomeIcon icon={faEllipsis} className="h-3.5 w-3.5" />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={faMoneyBillTrendUp}
          label={t('admin.clientDetail.kpi.totalSpent')}
          value={client.totalSpent}
          format="currency"
          accent="accent"
        />
        <KpiCard
          icon={faSprayCanSparkles}
          label={t('admin.clientDetail.kpi.activeMissions')}
          value={client.activeMissions}
          accent="secondary"
        />
        <KpiCard
          icon={faFileInvoiceDollar}
          label={t('admin.clientDetail.kpi.pendingAmount')}
          value={aggregates.facturesPending}
          format="currency"
          accent="amber"
        />
        <KpiCard
          icon={faCircleCheck}
          label={t('admin.clientDetail.kpi.paidAmount')}
          value={aggregates.facturesPaid}
          format="currency"
          accent="tertiary"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <aside className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-4 border-b border-gray-100 bg-gradient-to-br from-primary-50 to-secondary-50 p-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-secondary-700 text-base font-bold tracking-wider text-white shadow-md">
                {initials(client.name)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-primary md:text-base">
                  {client.name}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeColors[client.type] || typeColors.particulier}`}
                  >
                    {t(`admin.clients.types.${client.type}`, { defaultValue: client.type })}
                  </span>
                  <StatusBadge status={client.status} label={t(`admin.statuses.${client.status}`)} />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-5 text-sm">
              {client.company && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {t('admin.clientDetail.info.company')}
                  </div>
                  <div className="mt-0.5 font-semibold text-primary">{client.company}</div>
                </div>
              )}

              {client.siret && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    SIRET / N° entreprise
                  </div>
                  <div className="mt-0.5 font-medium text-gray-700">{client.siret}</div>
                </div>
              )}

              {client.representativeRole && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Représentant
                  </div>
                  <div className="mt-0.5 font-medium text-gray-700">
                    {client.name} — {client.representativeRole}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t('admin.clientDetail.info.email')}
                </div>
                <a
                  href={`mailto:${client.email}`}
                  className="mt-0.5 flex items-center gap-2 break-all text-sm font-medium text-gray-700 transition hover:text-secondary"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3 text-secondary" />
                  {client.email}
                </a>
              </div>

              {client.phone && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {t('admin.clientDetail.info.phone')}
                  </div>
                  <a
                    href={`tel:${client.phone.replace(/\s/g, '')}`}
                    className="mt-0.5 flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-secondary"
                  >
                    <FontAwesomeIcon icon={faPhone} className="h-3 w-3 text-secondary" />
                    {client.phone}
                  </a>
                </div>
              )}

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t('admin.clientDetail.info.since')}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FontAwesomeIcon icon={faCalendarDay} className="h-3 w-3 text-secondary" />
                  {formatDate(client.sinceDate)}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="overflow-x-auto border-b border-gray-100">
              <div className="flex min-w-max gap-1 p-2">
                {tabConfig.map(({ key, icon }) => {
                  const active = tab === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                        active
                          ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                      }`}
                    >
                      <FontAwesomeIcon icon={icon} className="h-3 w-3" />
                      {t(`admin.clientDetail.tabs.${key}`)}
                      <span
                        className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${
                          active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {counts[key]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-5">
              {tab === 'devis' && <DevisList items={aggregates.devis} t={t} />}
              {tab === 'missions' && <MissionsList items={aggregates.missions} t={t} />}
              {tab === 'factures' && <FacturesList items={aggregates.factures} t={t} />}
              {tab === 'demandes' && <DemandesList items={aggregates.demandes} t={t} />}
              {tab === 'reclamations' && (
                <ReclamationsList items={aggregates.reclamations} t={t} />
              )}
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <ClientEditModal
          client={client}
          onClose={() => setEditOpen(false)}
          onSuccess={reload}
        />
      )}
    </div>
  )
}

function EmptyTab({ t, tabKey }) {
  return (
    <div className="px-6 py-12 text-center">
      <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-gray-300" />
      <p className="mt-3 text-sm font-bold text-primary">
        {t(`admin.clientDetail.empty.${tabKey}.title`)}
      </p>
      <p className="mt-1 text-xs font-medium text-gray-500">
        {t(`admin.clientDetail.empty.${tabKey}.text`)}
      </p>
    </div>
  )
}

function DevisList({ items, t }) {
  if (items.length === 0) return <EmptyTab t={t} tabKey="devis" />
  return (
    <ul className="space-y-2.5">
      {items.map((d) => (
        <li
          key={d.id}
          className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {shortId('DV', d.id)}
              </span>
              <StatusBadge status={d.status} label={t(`admin.statuses.${d.status}`)} />
            </div>
            <div className="mt-1 text-sm font-bold text-primary">
              {t(`services.${d.service}.title`, { defaultValue: d.service })} · {d.surface} m²
            </div>
            <div className="mt-0.5 text-xs font-medium text-gray-500">
              {formatDate(d.createdAt, true)}
            </div>
          </div>
          <div className="text-right text-sm font-bold text-primary">
            {formatCurrency(d.amount)}
          </div>
        </li>
      ))}
    </ul>
  )
}

function MissionsList({ items, t }) {
  if (items.length === 0) return <EmptyTab t={t} tabKey="missions" />
  return (
    <ul className="space-y-2.5">
      {items.map((m) => (
        <li
          key={m.id}
          className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {shortId('MS', m.id)}
              </span>
              <StatusBadge status={m.status} label={t(`admin.statuses.${m.status}`)} />
            </div>
            <div className="mt-1 text-sm font-bold text-primary">{m.title}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-medium text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCalendarDay} className="h-2.5 w-2.5 text-accent" />
                {formatDate(m.date, true)}
              </span>
              {m.address && (
                <span className="inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faLocationDot} className="h-2.5 w-2.5 text-accent" />
                  {m.address}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-sm font-bold text-primary">
            {formatCurrency(m.amount)}
          </div>
        </li>
      ))}
    </ul>
  )
}

function FacturesList({ items, t }) {
  if (items.length === 0) return <EmptyTab t={t} tabKey="factures" />
  return (
    <ul className="space-y-2.5">
      {items.map((f) => (
        <li
          key={f.id}
          className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {f.number}
              </span>
              <StatusBadge status={f.status} label={t(`admin.statuses.${f.status}`)} />
            </div>
            <div className="mt-1 text-xs font-medium text-gray-500">
              Émise le {formatDate(f.issueDate)} · Échéance {formatDate(f.dueDate)}
            </div>
          </div>
          <div className="text-right text-sm font-bold text-primary">
            {formatCurrency(f.amount)}
          </div>
        </li>
      ))}
    </ul>
  )
}

function DemandesList({ items, t }) {
  if (items.length === 0) return <EmptyTab t={t} tabKey="demandes" />
  return (
    <ul className="space-y-2.5">
      {items.map((d) => (
        <li key={d.id} className="rounded-xl border border-gray-100 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {shortId('DE', d.id)}
            </span>
            <StatusBadge status={d.status} label={t(`admin.statuses.${d.status}`)} />
          </div>
          <div className="mt-1.5 text-sm font-bold text-primary">{d.subject}</div>
          <p className="mt-1 text-xs font-medium text-gray-600">{d.message}</p>
        </li>
      ))}
    </ul>
  )
}

function ReclamationsList({ items, t }) {
  if (items.length === 0) return <EmptyTab t={t} tabKey="reclamations" />
  return (
    <ul className="space-y-2.5">
      {items.map((r) => (
        <li key={r.id} className="rounded-xl border border-gray-100 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {shortId('RC', r.id)}
            </span>
            <StatusBadge status={r.status} label={t(`admin.statuses.${r.status}`)} />
          </div>
          <div className="mt-1.5 text-sm font-bold text-primary">{r.subject}</div>
          <div className="mt-1 text-xs font-medium text-gray-600">
            {t(`admin.reclamations.category.${r.category}`)}
          </div>
        </li>
      ))}
    </ul>
  )
}
