import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFilePen,
  faSprayCanSparkles,
  faFileInvoiceDollar,
  faTriangleExclamation,
  faArrowRight,
  faCalendarCheck,
  faLocationDot,
  faHeadset,
  faUserGear,
} from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/espace/PageHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { meApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const tiles = [
  { key: 'quotes', icon: faFilePen, color: 'bg-secondary/10 text-secondary', to: '/espace-client/devis' },
  {
    key: 'missions',
    icon: faSprayCanSparkles,
    color: 'bg-accent/10 text-accent-700',
    to: '/espace-client/missions',
  },
  {
    key: 'invoices',
    icon: faFileInvoiceDollar,
    color: 'bg-tertiary-50 text-tertiary-700',
    to: '/espace-client/factures',
  },
  {
    key: 'complaints',
    icon: faTriangleExclamation,
    color: 'bg-red-50 text-red-600',
    to: '/espace-client/reclamations',
  },
]

const quickActions = [
  { key: 'newQuote', icon: faFilePen, to: '/devis', color: 'bg-accent text-white' },
  { key: 'support', icon: faHeadset, to: '/contact', color: 'bg-secondary text-white' },
  { key: 'invoices', icon: faFileInvoiceDollar, to: '/espace-client/factures', color: 'bg-primary text-white' },
  { key: 'profile', icon: faUserGear, to: '/espace-client/profil', color: 'bg-tertiary text-white' },
]

function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-CH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const fetcher = useCallback(() => meApi.dashboard(), [])
  const { data, loading, error } = useApi(fetcher)

  const stats = data?.stats || { quotes: 0, missions: 0, invoices: 0, complaints: 0 }
  const upcomingMissions = data?.upcomingMissions || []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('espace.dashboard.eyebrow')}
        title={t('espace.dashboard.greeting', { name: user?.firstName || '' })}
        description={t('espace.dashboard.subtitle')}
        action={
          <Link to="/devis" className="btn-primary px-5 py-2.5 text-sm">
            {t('espace.dashboard.newQuote')}
            <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
          </Link>
        }
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.key}
            to={tile.to}
            className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tile.color}`}>
              <FontAwesomeIcon icon={tile.icon} className="h-4 w-4" />
            </span>
            <div className="mt-4 text-3xl font-bold text-primary">
              {loading ? '—' : stats[tile.key] ?? 0}
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-500">
              {t(`espace.dashboard.tiles.${tile.key}.label`)}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-secondary transition group-hover:translate-x-0.5">
              {t(`espace.dashboard.tiles.${tile.key}.cta`)}
              <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('espace.dashboard.upcoming.title')}
              </h2>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {t('espace.dashboard.upcoming.subtitle')}
              </p>
            </div>
            <Link
              to="/espace-client/missions"
              className="hidden text-xs font-bold text-secondary transition hover:text-secondary-700 sm:inline-flex sm:items-center sm:gap-1.5"
            >
              {t('espace.dashboard.viewAll')}
              <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-5 h-24 animate-pulse rounded-xl bg-gray-100" />
          ) : upcomingMissions.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-xs font-medium text-gray-500">
              {t('espace.dashboard.upcoming.empty')}
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {upcomingMissions.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 transition hover:border-secondary/40 hover:bg-secondary-50/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-50 text-secondary">
                      <FontAwesomeIcon icon={faSprayCanSparkles} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-primary">{m.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-gray-500">
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
                  <span className="inline-flex shrink-0 items-center self-start rounded-full bg-secondary-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-700 sm:self-center">
                    {t(`admin.statuses.${m.status}`, { defaultValue: m.status })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 p-6 text-white shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/85 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            {t('espace.dashboard.banner.eyebrow')}
          </div>
          <h2 className="mt-4 text-lg font-bold leading-tight md:text-xl">
            {t('espace.dashboard.banner.title')}
          </h2>
          <p className="mt-3 text-sm font-medium text-white/80">
            {t('espace.dashboard.banner.text')}
          </p>
          <Link to="/devis" className="btn-primary mt-5 inline-flex px-5 py-2.5 text-sm">
            {t('espace.dashboard.banner.cta')}
            <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="text-base font-bold text-primary md:text-lg">
          {t('espace.dashboard.quickActions.title')}
        </h2>
        <p className="mt-1 text-xs font-medium text-gray-500">
          {t('espace.dashboard.quickActions.subtitle')}
        </p>

        <ul className="mt-5 grid gap-2.5 md:grid-cols-2">
          {quickActions.map((a) => (
            <li key={a.key}>
              <Link
                to={a.to}
                className="group flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 transition hover:border-secondary/40 hover:bg-secondary-50/30"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ${a.color}`}
                  >
                    <FontAwesomeIcon icon={a.icon} className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {t(`espace.dashboard.quickActions.items.${a.key}`)}
                  </span>
                </div>
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="h-3 w-3 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-secondary"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}
