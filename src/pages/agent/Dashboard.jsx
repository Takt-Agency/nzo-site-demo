import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarDay,
  faSprayCanSparkles,
  faCheck,
  faClock,
  faLocationDot,
  faPhone,
  faArrowRight,
  faCircleExclamation,
  faShieldHalved,
  faEnvelopeOpenText,
  faClipboardList,
  faStar,
  faStopwatch,
  faTriangleExclamation,
  faXmark,
  faPaperPlane,
  faEye,
  faPlay,
} from '@fortawesome/free-solid-svg-icons'
import { agentApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'

function formatTime(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-CH', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}

function formatDay(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-CH', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(iso))
}

function fmtDuration(min) {
  const abs = Math.abs(min || 0)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  return `${m} min`
}

function StatusPill({ status }) {
  const { t } = useTranslation()
  const cls =
    {
      scheduled: 'bg-secondary/10 text-secondary-700 ring-secondary/30',
      inProgress: 'bg-accent/10 text-accent-700 ring-accent/30',
      completed: 'bg-gray-100 text-gray-600 ring-gray-200',
      cancelled: 'bg-red-50 text-red-700 ring-red-200',
    }[status] || 'bg-secondary/10 text-secondary-700 ring-secondary/30'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${cls}`}
    >
      {t(`agent.statuses.${status}`, { defaultValue: status })}
    </span>
  )
}

function MissionRow({ m }) {
  return (
    <Link
      to={`/espace-agent/missions/${m.id}`}
      className="block rounded-xl p-3 transition hover:bg-secondary-50/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-primary">{formatTime(m.date)}</span>
            <StatusPill status={m.status} />
          </div>
          <div className="mt-1 truncate text-sm font-bold text-primary">{m.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-gray-500">
            <span>{m.clientName}</span>
            {m.city && (
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faLocationDot} className="h-2.5 w-2.5" />
                {m.city}
              </span>
            )}
            {m.clientPhone && (
              <a
                href={`tel:${m.clientPhone.replace(/\s/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-secondary hover:text-secondary-700"
              >
                <FontAwesomeIcon icon={faPhone} className="h-2.5 w-2.5" />
                {m.clientPhone}
              </a>
            )}
          </div>
        </div>
        <FontAwesomeIcon icon={faArrowRight} className="mt-2 h-3 w-3 text-gray-400" />
      </div>
    </Link>
  )
}

// Spreadsheet-style missions table — replaces the two separate lists on the
// agent dashboard so the agent can scan Heure / Mission / Client / Ville /
// Statut in aligned columns and hit "View" or "Start" directly per row.
function MissionsTable({ missions, emptyIcon, emptyLabel }) {
  const { t } = useTranslation()
  if (!missions?.length) {
    return (
      <div className="mt-4 rounded-xl bg-gray-50 p-6 text-center">
        <FontAwesomeIcon icon={emptyIcon || faCalendarDay} className="h-6 w-6 text-gray-300" />
        <p className="mt-2 text-xs font-semibold text-gray-500">{emptyLabel}</p>
      </div>
    )
  }
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
      {/* Wrapping the <table> in an overflow-x wrapper lets the layout stay
          clean on narrow screens (tablet portrait) — desktop shows the full
          grid without a scrollbar. */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-primary-50 text-[10px] font-bold uppercase tracking-wider text-primary-700">
            <tr>
              <th className="border-r border-primary-100 px-3 py-2.5 text-left">
                {t('agent.dashboard.colTime', 'Heure')}
              </th>
              <th className="border-r border-primary-100 px-3 py-2.5 text-left">
                {t('agent.dashboard.colMission', 'Mission')}
              </th>
              <th className="border-r border-primary-100 px-3 py-2.5 text-left">
                {t('agent.dashboard.colClient', 'Client')}
              </th>
              <th className="border-r border-primary-100 px-3 py-2.5 text-left">
                {t('agent.dashboard.colCity', 'Ville')}
              </th>
              <th className="border-r border-primary-100 px-3 py-2.5 text-left">
                {t('agent.dashboard.colStatus', 'Statut')}
              </th>
              <th className="px-3 py-2.5 text-right">
                {t('agent.dashboard.colActions', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {missions.map((m, i) => {
              const isStartable = m.status === 'scheduled'
              return (
                <tr
                  key={m.id}
                  className={`${i % 2 === 1 ? 'bg-gray-50/50' : ''} transition hover:bg-secondary-50/40`}
                >
                  <td className="border-r border-gray-100 px-3 py-2.5 align-middle">
                    <div className="text-xs font-bold text-primary">{formatTime(m.date)}</div>
                    <div className="text-[10px] font-semibold text-gray-500">
                      {formatDay(m.date)}
                    </div>
                  </td>
                  <td className="border-r border-gray-100 px-3 py-2.5 align-middle">
                    <div className="font-bold text-primary">{m.title}</div>
                    {m.address ? (
                      <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
                        <FontAwesomeIcon icon={faLocationDot} className="h-2.5 w-2.5" />
                        {m.address}
                      </div>
                    ) : null}
                  </td>
                  <td className="border-r border-gray-100 px-3 py-2.5 align-middle">
                    <div className="font-semibold text-primary">{m.clientName || '—'}</div>
                    {m.clientPhone ? (
                      <a
                        href={`tel:${m.clientPhone.replace(/\s/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-secondary hover:text-secondary-700"
                      >
                        <FontAwesomeIcon icon={faPhone} className="h-2.5 w-2.5" />
                        {m.clientPhone}
                      </a>
                    ) : null}
                  </td>
                  <td className="border-r border-gray-100 px-3 py-2.5 align-middle text-xs font-medium text-gray-600">
                    {m.city || '—'}
                  </td>
                  <td className="border-r border-gray-100 px-3 py-2.5 align-middle">
                    <StatusPill status={m.status} />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      {isStartable ? (
                        <Link
                          to={`/espace-agent/missions/${m.id}`}
                          title={t('agent.dashboard.actionStart', 'Démarrer')}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-sm transition hover:bg-accent-600"
                        >
                          <FontAwesomeIcon icon={faPlay} className="h-3 w-3" />
                        </Link>
                      ) : null}
                      <Link
                        to={`/espace-agent/missions/${m.id}`}
                        title={t('agent.dashboard.actionView', 'Voir')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-primary transition hover:border-primary hover:bg-primary hover:text-white"
                      >
                        <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Live chronometer — ticks every second so the elapsed value keeps advancing
// while the tab stays open, without hitting the backend for every update.
function useLiveElapsed(startedAt) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!startedAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])
  if (!startedAt) return null
  return Math.max(0, Math.round((now - new Date(startedAt).getTime()) / 60000))
}

function ActiveMissionCard({ mission }) {
  const { t } = useTranslation()
  const elapsed = useLiveElapsed(mission.startedAt)
  const estimated = mission.estimatedMinutes || 0
  const isOvertime = estimated > 0 && elapsed != null && elapsed > estimated
  const progressPct = estimated > 0 && elapsed != null ? Math.min(100, (elapsed / estimated) * 100) : 0

  return (
    <Link
      to={`/espace-agent/missions/${mission.id}`}
      className="block overflow-hidden rounded-2xl bg-gradient-to-br from-accent-600 via-accent-500 to-accent-400 p-5 text-white shadow-md transition hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            {t('agent.dashboard.activeTitle')}
          </div>
          <h3 className="mt-2 truncate text-lg font-bold">{mission.title}</h3>
          <p className="mt-0.5 truncate text-xs font-medium text-white/85">
            {mission.clientName}
            {mission.city ? ` · ${mission.city}` : ''}
          </p>
        </div>
        <FontAwesomeIcon icon={faStopwatch} className="mt-1 h-5 w-5 text-white/85" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/15 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/75">
            {t('agent.dashboard.activeElapsed')}
          </div>
          <div className="mt-1 text-xl font-bold">
            {elapsed != null ? fmtDuration(elapsed) : '—'}
          </div>
        </div>
        <div className="rounded-xl bg-white/15 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/75">
            {t('agent.dashboard.activeEstimated')}
          </div>
          <div className="mt-1 text-xl font-bold">
            {estimated > 0 ? fmtDuration(estimated) : '—'}
          </div>
        </div>
      </div>

      {estimated > 0 ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25">
          <div
            className={`h-full transition-all ${isOvertime ? 'bg-red-200' : 'bg-white'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      ) : null}

      {isOvertime ? (
        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-100">
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-3 w-3" />
          {t('agent.dashboard.activeOvertime')} +{fmtDuration(elapsed - estimated)}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-end gap-1 text-xs font-bold">
        {t('agent.dashboard.activeContinue')}
        <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
      </div>
    </Link>
  )
}

const ALERT_ICON = {
  chat: faEnvelopeOpenText,
  clipboard: faClipboardList,
  today: faCalendarDay,
}

const ALERT_LINK = {
  messages: '/espace-agent/missions',
  demandes: '/espace-agent/demandes',
  todayScheduled: '/espace-agent/missions',
}

// Sits inside the navy hero — chips use a semi-transparent white surface
// so they read against the gradient without visually escaping the card.
function HeroAlerts({ alerts }) {
  if (!alerts?.length) return null
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {alerts.map((a) => (
        <Link
          key={a.key}
          to={ALERT_LINK[a.key] || '/espace-agent'}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25"
        >
          <FontAwesomeIcon
            icon={ALERT_ICON[a.icon] || faCircleExclamation}
            className="h-3 w-3"
          />
          {a.label}
        </Link>
      ))}
    </div>
  )
}

// SOS composer — click the fixed FAB, fill an optional note, geolocation is
// captured opportunistically so the admin has a starting point for help.
function SosModal({ open, onClose, onSent }) {
  const { t } = useTranslation()
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) {
      setNote('')
      setError(null)
      setSending(false)
    }
  }, [open])

  const send = async () => {
    setSending(true)
    setError(null)
    const payload = { note: note.trim() || undefined }
    // Best-effort geolocation — user is asked once, then we roll on regardless.
    try {
      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('unavailable'))
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 })
      })
      payload.lat = pos.coords.latitude
      payload.lng = pos.coords.longitude
    } catch {
      /* no coords is fine — backend accepts null */
    }
    try {
      await agentApi.fireSos(payload)
      onSent?.()
      onClose()
    } catch (e) {
      setError(e.message || 'Erreur')
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
            <FontAwesomeIcon icon={faShieldHalved} className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-red-800">
              {t('agent.dashboard.sosConfirmTitle')}
            </div>
            <p className="mt-1 text-xs text-red-700">
              {t('agent.dashboard.sosConfirmBody')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-red-700 hover:bg-red-100"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500">
            {t('agent.dashboard.sosNoteLabel')}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Situation, danger, besoin d'assistance…"
            className="mt-1 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-2 text-sm text-primary focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
          {error ? (
            <div className="mt-2 text-xs font-semibold text-red-700">{error}</div>
          ) : null}
        </div>

        <div className="flex gap-2 border-t border-gray-100 bg-gray-50 p-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
          >
            {t('agent.dashboard.sosCancel')}
          </button>
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
            {sending ? '…' : t('agent.dashboard.sosSend')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AgentDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const fetcher = useCallback(() => agentApi.dashboard(), [])
  const { data, loading, error, reload } = useApi(fetcher)
  const [sosOpen, setSosOpen] = useState(false)
  const [sosBanner, setSosBanner] = useState(false)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
        <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
        {error.message}
      </div>
    )
  }

  const k = data.kpis
  const today = data.today || []
  const upcoming = data.upcoming || []
  const alerts = data.alerts || []
  const activeMission = data.activeMission

  return (
    <div className="space-y-5">
      {/* Success banner after SOS sent — auto-fades on next reload */}
      {sosBanner ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
          {t('agent.dashboard.sosSent')}
        </div>
      ) : null}

      {/* Hero — alerts live inside so a single "1 message" chip doesn't
          float alone above a big navy block */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 p-6 text-white shadow-md">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
          {t('agent.dashboard.eyebrow')}
        </div>
        <h1 className="mt-1 text-xl font-bold leading-tight md:text-2xl">
          {t('agent.dashboard.greeting', { name: user?.firstName || '' })} 👋
        </h1>
        <p className="mt-1 max-w-xl text-sm font-medium text-white/80">
          {t('agent.dashboard.summaryToday', { count: k.todayCount })}
          {k.upcomingCount > 0
            ? t('agent.dashboard.summaryUpcomingExtra', { count: k.upcomingCount })
            : t('agent.dashboard.summaryDot')}
        </p>
        <HeroAlerts alerts={alerts} />
      </div>

      {/* Active mission takes precedence when the agent is on-site */}
      {activeMission ? <ActiveMissionCard mission={activeMission} /> : null}

      {/* KPI grid — enriched with monthly hours & rating */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: t('agent.dashboard.kpiToday'),
            value: k.todayCount,
            icon: faCalendarDay,
            color: 'text-accent',
          },
          {
            label: t('agent.dashboard.kpiInProgress'),
            value: k.inProgress,
            icon: faSprayCanSparkles,
            color: 'text-secondary',
          },
          {
            label: t('agent.dashboard.kpiUpcoming'),
            value: k.upcomingCount,
            icon: faClock,
            color: 'text-primary-700',
          },
          {
            label: t('agent.dashboard.kpiCompletedMonth'),
            value: k.completedThisMonth,
            icon: faCheck,
            color: 'text-emerald-600',
          },
          {
            label: t('agent.dashboard.monthlyHours'),
            value: k.monthlyHours != null ? `${k.monthlyHours} h` : '—',
            icon: faStopwatch,
            color: 'text-accent-700',
          },
          {
            label: t('agent.dashboard.monthlyRating'),
            value: k.monthlyRatingAvg != null ? k.monthlyRatingAvg.toFixed(2) : '—',
            icon: faStar,
            color: 'text-amber-500',
          },
          {
            label: t('agent.dashboard.unreadMessages'),
            value: k.unreadMessages || 0,
            icon: faEnvelopeOpenText,
            color: 'text-secondary-700',
          },
          {
            label: t('agent.dashboard.openDemandes'),
            value: k.pendingDemandes || 0,
            icon: faClipboardList,
            color: 'text-amber-700',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <FontAwesomeIcon icon={kpi.icon} className={`h-3 w-3 ${kpi.color}`} />
              {kpi.label}
            </div>
            <div className="mt-2 text-2xl font-bold text-primary">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Two stacked spreadsheet-style tables — one per horizon. Full width
          on all screen sizes because the columns don't compress well side-
          by-side on desktop; stacking preserves readable rows. */}
      <div className="space-y-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-primary md:text-lg">
              {t('agent.dashboard.todayTitle')}
            </h2>
            <Link
              to="/espace-agent/missions"
              className="text-xs font-bold text-secondary transition hover:text-secondary-700"
            >
              {t('agent.dashboard.viewAll')}
            </Link>
          </div>
          <MissionsTable
            missions={today}
            emptyIcon={faCalendarDay}
            emptyLabel={t('agent.dashboard.todayEmpty')}
          />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-base font-bold text-primary md:text-lg">
            {t('agent.dashboard.upcomingTitle')}
          </h2>
          <MissionsTable
            missions={upcoming}
            emptyIcon={faClock}
            emptyLabel={t('agent.dashboard.upcomingEmpty')}
          />
        </div>
      </div>

      {/* SOS floating button — bottom-right, doesn't overlap sidebar/nav */}
      <button
        type="button"
        onClick={() => setSosOpen(true)}
        aria-label={t('agent.dashboard.sosButton')}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg ring-4 ring-red-100 transition hover:bg-red-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-200"
      >
        <FontAwesomeIcon icon={faShieldHalved} className="h-4 w-4" />
        {t('agent.dashboard.sosButton')}
      </button>

      <SosModal
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        onSent={() => {
          setSosBanner(true)
          setTimeout(() => setSosBanner(false), 5000)
          reload?.()
        }}
      />
    </div>
  )
}
