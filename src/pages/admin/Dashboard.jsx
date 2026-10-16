import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMoneyBillTrendUp,
  faFilePen,
  faSprayCanSparkles,
  faFileInvoiceDollar,
  faUsers,
  faTriangleExclamation,
  faArrowRight,
  faCalendarDay,
  faCircleCheck,
  faUserPlus,
  faSackDollar,
  faPlus,
  faPhone,
  faRepeat,
  faLocationDot,
  faCakeCandles,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import NewMissionModal from '../../components/admin/NewMissionModal.jsx'
import KpiCard from '../../components/admin/KpiCard.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CH', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatRelative(iso) {
  const diff = (new Date(iso) - new Date()) / 1000
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
  const abs = Math.abs(diff)
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  return rtf.format(Math.round(diff / 86400), 'day')
}

const activityIcons = {
  quote: { icon: faFilePen, color: 'bg-secondary/10 text-secondary' },
  mission: { icon: faCircleCheck, color: 'bg-accent/10 text-accent-700' },
  invoice: { icon: faFileInvoiceDollar, color: 'bg-tertiary-50 text-tertiary-700' },
  complaint: { icon: faTriangleExclamation, color: 'bg-red-50 text-red-600' },
  client: { icon: faUserPlus, color: 'bg-secondary/10 text-secondary' },
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const fetcher = useCallback(() => adminApi.dashboard(), [])
  const { data, loading, error, reload } = useApi(fetcher)
  const [newMissionOpen, setNewMissionOpen] = useState(false)
  // Prefill payload passed to the modal when clicking "Planifier" on a
  // recurring mission — same client/service/details, suggested next date.
  const [modalPrefill, setModalPrefill] = useState(null)

  // Today's birthdays — fetched once on mount and re-fetched every 30 min
  // (in case the admin leaves the page open across midnight).
  const [birthdays, setBirthdays] = useState([])
  useEffect(() => {
    let cancelled = false
    const load = () =>
      adminApi
        .todaysBirthdays()
        .then((res) => {
          if (!cancelled) setBirthdays(res.items || [])
        })
        .catch(() => {
          /* silent — non-critical widget */
        })
    load()
    const iv = setInterval(load, 30 * 60_000)
    return () => {
      cancelled = true
      clearInterval(iv)
    }
  }, [])

  const kpis = data?.kpis || {
    revenueMonth: 0,
    revenueDelta: 0,
    revenueTotal: 0,
    completedMissionsCount: 0,
    newQuotes: 0,
    activeMissions: 0,
    pendingInvoices: 0,
    openComplaints: 0,
    newClients: 0,
    conversionRate: 0,
  }
  const revenueSeries = data?.revenueSeries || []
  const upcomingMissions = data?.upcomingMissions || []
  const newDevis = data?.newDevis || []
  const recentActivity = data?.recentActivity || []
  const recurringToSchedule = data?.recurringToSchedule || []
  const max = revenueSeries.length ? Math.max(...revenueSeries.map((s) => s.value), 1) : 1
  const firstName = user?.firstName || ''

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={t('admin.dashboard.eyebrow')}
        title={t('admin.dashboard.greeting', { name: firstName })}
        description={t('admin.dashboard.subtitle')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setNewMissionOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border-2 border-secondary bg-white px-4 py-2 text-xs font-bold text-secondary transition hover:bg-secondary hover:text-white"
              title="Créer une mission suite à un appel téléphonique"
            >
              <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
              Nouvelle mission
            </button>
            <Link to="/admin/devis" className="btn-primary px-5 py-2.5 text-sm">
              {t('admin.dashboard.reviewQuotes')}
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
          </div>
        }
      />

      {newMissionOpen && (
        <NewMissionModal
          onClose={() => {
            setNewMissionOpen(false)
            setModalPrefill(null)
          }}
          prefill={modalPrefill}
          onSuccess={() => reload?.()}
        />
      )}

      {/* Today's birthdays — shown only when at least one agent celebrates.
          Kept lightweight (no icon-heavy card) since it can appear alongside
          the KPI grid without stealing focus. */}
      {birthdays.length > 0 && (
        <div className="rounded-2xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 via-white to-yellow-50 p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 ring-2 ring-pink-200">
                <FontAwesomeIcon icon={faCakeCandles} className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-600">
                  Aujourd'hui
                </div>
                <div className="mt-0.5 text-base font-bold text-primary">
                  {birthdays.length === 1
                    ? `🎂 C'est l'anniversaire de ${birthdays[0].name}`
                    : `🎂 ${birthdays.length} anniversaires aujourd'hui`}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {birthdays.map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm ring-1 ring-pink-100"
                    >
                      {b.name}
                      {b.age > 0 && b.age < 120 ? (
                        <span className="text-pink-500">· {b.age} ans</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Link
              to="/admin/agents"
              className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-primary/90 md:self-center"
            >
              Voir les agents
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      )}

      {/* Total revenue hero — sum of all completed missions, all time */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-accent to-accent-700 p-6 shadow-lg shadow-accent/20 md:p-7">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white ring-2 ring-white/30 backdrop-blur-sm">
              <FontAwesomeIcon icon={faSackDollar} className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                {t('admin.kpi.revenueTotal', { defaultValue: "Chiffre d'affaires total" })}
              </div>
              <div className="mt-1 text-3xl font-bold leading-tight text-white md:text-4xl">
                {new Intl.NumberFormat('fr-CH', {
                  style: 'currency',
                  currency: 'CHF',
                  maximumFractionDigits: 0,
                }).format(kpis.revenueTotal)}
              </div>
              <div className="mt-1 text-xs font-medium text-white/80">
                {t('admin.kpi.revenueTotalHint', {
                  defaultValue: 'Sur {{count}} mission(s) terminée(s)',
                  count: kpis.completedMissionsCount,
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 rounded-2xl bg-white/15 px-5 py-3 text-white ring-1 ring-white/20 backdrop-blur-sm md:items-end">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              {t('admin.kpi.revenueMonth')}
            </div>
            <div className="text-lg font-bold leading-tight md:text-xl">
              {new Intl.NumberFormat('fr-CH', {
                style: 'currency',
                currency: 'CHF',
                maximumFractionDigits: 0,
              }).format(kpis.revenueMonth)}
            </div>
            {kpis.revenueDelta !== 0 && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/85">
                {kpis.revenueDelta >= 0 ? '+' : ''}
                {kpis.revenueDelta}% vs mois dernier
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={faMoneyBillTrendUp}
          label={t('admin.kpi.revenueMonth')}
          value={kpis.revenueMonth}
          delta={kpis.revenueDelta}
          format="currency"
          accent="accent"
        />
        <KpiCard
          icon={faFilePen}
          label={t('admin.kpi.newQuotes')}
          value={kpis.newQuotes}
          accent="secondary"
        />
        <KpiCard
          icon={faSprayCanSparkles}
          label={t('admin.kpi.activeMissions')}
          value={kpis.activeMissions}
          accent="tertiary"
        />
        <KpiCard
          icon={faFileInvoiceDollar}
          label={t('admin.kpi.pendingInvoices')}
          value={kpis.pendingInvoices}
          accent="amber"
        />
        <KpiCard
          icon={faUsers}
          label={t('admin.kpi.newClients')}
          value={kpis.newClients}
          accent="secondary"
        />
        <KpiCard
          icon={faTriangleExclamation}
          label={t('admin.kpi.openComplaints')}
          value={kpis.openComplaints}
          accent="red"
        />
        <KpiCard
          icon={faMoneyBillTrendUp}
          label={t('admin.kpi.conversionRate')}
          value={kpis.conversionRate}
          format="percent"
          accent="accent"
        />
        <div className="rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 p-5 text-white shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">
            {t('admin.kpi.shortcut')}
          </div>
          <Link
            to="/admin/clients"
            className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-accent"
          >
            {t('admin.dashboard.manageClients')}
            <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('admin.dashboard.revenue.title')}
              </h2>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {t('admin.dashboard.revenue.subtitle')}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                kpis.revenueDelta >= 0 ? 'bg-accent/10 text-accent-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {kpis.revenueDelta >= 0 ? '+' : ''}
              {kpis.revenueDelta}%
            </span>
          </div>

          {loading ? (
            <div className="mt-6 h-48 animate-pulse rounded-xl bg-gray-100" />
          ) : revenueSeries.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-gray-200 px-4 py-12 text-center text-xs font-medium text-gray-500">
              Pas encore de revenu enregistré.
            </p>
          ) : (
            <div className="mt-6 flex h-48 items-end gap-2 md:gap-3">
              {revenueSeries.map((s, i) => {
                const height = (s.value / max) * 100
                const isLast = i === revenueSeries.length - 1
                return (
                  <div key={`${s.month}-${i}`} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={`relative w-full overflow-hidden rounded-t-md transition-all ${
                        isLast
                          ? 'bg-gradient-to-t from-secondary to-secondary-500'
                          : 'bg-secondary-100'
                      }`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    >
                      {isLast && s.value > 0 && (
                        <span className="absolute inset-x-0 -top-7 text-center text-[11px] font-bold text-secondary-700">
                          {new Intl.NumberFormat('fr-CH', { notation: 'compact' }).format(s.value)} CHF
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {s.month}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-primary md:text-lg">
              {t('admin.dashboard.activity.title')}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {t('admin.dashboard.activity.recent')}
            </span>
          </div>

          {loading ? (
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-xs font-medium text-gray-500">
              Aucune activité récente.
            </p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {recentActivity.slice(0, 5).map((a) => {
                const style = activityIcons[a.type] || activityIcons.client
                return (
                  <li key={a.id} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.color}`}
                    >
                      <FontAwesomeIcon icon={style.icon} className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-snug text-primary">{a.text}</p>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        {formatRelative(a.time)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Recurring missions — the last completed occurrence per (client,
          service) with a weekly/bi-monthly/monthly frequency, with no
          future occurrence scheduled yet. Admin picks agents + date and
          books the next round without retyping the whole form. */}
      {recurringToSchedule.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 bg-secondary-50/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <FontAwesomeIcon icon={faRepeat} className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-primary md:text-base">
                  Missions récurrentes à programmer
                </h2>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {recurringToSchedule.length} intervention
                  {recurringToSchedule.length > 1 ? 's' : ''} en attente d'une nouvelle date
                </p>
              </div>
            </div>
          </div>
          <ul className="divide-y divide-gray-100">
            {recurringToSchedule.map((r) => {
              const FREQ_LABEL = {
                hebdo: 'Hebdomadaire',
                bimensuel: 'Bi-mensuel',
                mensuel: 'Mensuel',
              }
              const FREQ_COLOR = {
                hebdo: 'bg-accent/10 text-accent-700',
                bimensuel: 'bg-secondary/10 text-secondary-700',
                mensuel: 'bg-tertiary-50 text-tertiary-700',
              }
              return (
                <li
                  key={r.lastMissionId}
                  className="flex flex-wrap items-center gap-3 px-6 py-4 transition hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-primary">{r.title}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          FREQ_COLOR[r.frequency] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <FontAwesomeIcon icon={faRepeat} className="h-2.5 w-2.5" />
                        {FREQ_LABEL[r.frequency] || r.frequency}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-gray-500">
                      <span>{r.clientName}</span>
                      {r.city && (
                        <span className="inline-flex items-center gap-1">
                          <FontAwesomeIcon icon={faLocationDot} className="h-2.5 w-2.5" />
                          {r.city}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" />
                        Dernière :{' '}
                        {new Intl.DateTimeFormat('fr-CH', {
                          day: '2-digit',
                          month: 'short',
                        }).format(new Date(r.lastCompletedAt || r.lastDate))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-secondary-700">
                        Prochaine suggérée
                      </div>
                      <div className="text-sm font-bold text-primary">
                        {new Intl.DateTimeFormat('fr-CH', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        }).format(new Date(r.suggestedDate))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalPrefill({
                          userId: r.clientId,
                          service: r.service,
                          title: r.title,
                          address: r.address,
                          city: r.city,
                          date: r.suggestedDate,
                          duration: r.duration,
                          amount: r.amount,
                          // Carry the per-service extras verbatim (frequency,
                          // plantCount, panelCount…) so the admin doesn't
                          // have to re-enter them — they're identical to the
                          // last occurrence by design.
                          details: r.serviceDetails || {},
                        })
                        setNewMissionOpen(true)
                      }}
                      className="btn-primary shrink-0 px-4 py-2 text-xs"
                    >
                      <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                      Planifier
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('admin.dashboard.upcoming.title')}
              </h2>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {t('admin.dashboard.upcoming.subtitle')}
              </p>
            </div>
            <Link
              to="/admin/missions"
              className="text-xs font-bold text-secondary transition hover:text-secondary-700"
            >
              {t('admin.viewAll')} →
            </Link>
          </div>

          {upcomingMissions.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-xs font-medium text-gray-500">
              Aucune mission planifiée.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {upcomingMissions.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 transition hover:border-secondary/40 hover:bg-secondary-50/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        MS-{m.id.slice(-6).toUpperCase()}
                      </span>
                      <StatusBadge status={m.status} label={t(`admin.statuses.${m.status}`)} />
                    </div>
                    <div className="mt-1 truncate text-sm font-bold text-primary">
                      {m.clientName}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCalendarDay} className="h-2.5 w-2.5 text-accent" />
                        {formatDate(m.date)}
                      </span>
                      <span>{m.address}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('admin.dashboard.newDevis.title')}
              </h2>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {t('admin.dashboard.newDevis.subtitle')}
              </p>
            </div>
            <Link
              to="/admin/devis"
              className="text-xs font-bold text-secondary transition hover:text-secondary-700"
            >
              {t('admin.viewAll')} →
            </Link>
          </div>

          {newDevis.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-xs font-medium text-gray-500">
              Aucun devis à traiter.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {newDevis.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 transition hover:border-secondary/40 hover:bg-secondary-50/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link to="/admin/devis" className="block min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        DV-{d.id.slice(-6).toUpperCase()}
                      </span>
                      <StatusBadge status={d.status} label={t(`admin.statuses.${d.status}`)} />
                    </div>
                    <div className="mt-1 truncate text-sm font-bold text-primary">
                      {d.clientName}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-gray-500">
                      <span>
                        {t(`services.${d.service}.title`, { defaultValue: d.service })} · {d.surface} m²
                      </span>
                      <span>{d.city}</span>
                    </div>
                  </Link>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="hidden h-3 w-3 text-gray-300 sm:block"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
