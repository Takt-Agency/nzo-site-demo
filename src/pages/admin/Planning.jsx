import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faChevronRight,
  faCalendarDays,
  faUser,
  faClock,
  faLocationDot,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const STATUS_TONE = {
  scheduled: 'border-secondary/50 bg-secondary-50 text-secondary-900',
  inProgress: 'border-accent/50 bg-accent/10 text-accent-900',
  completed: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  cancelled: 'border-gray-200 bg-gray-50 text-gray-500',
}

// --- Date helpers -----------------------------------------------------------
function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// Return a Date for Monday of the week containing `d`.
function startOfWeek(d) {
  const x = startOfDay(d)
  const day = (x.getDay() + 6) % 7 // Monday=0
  x.setDate(x.getDate() - day)
  return x
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function formatShort(d) {
  return new Intl.DateTimeFormat('fr-CH', { day: '2-digit', month: 'short' }).format(d)
}

function formatLongRange(a, b) {
  const sameMonth = a.getMonth() === b.getMonth()
  const sameYear = a.getFullYear() === b.getFullYear()
  const fmt = (date, opts) => new Intl.DateTimeFormat('fr-CH', opts).format(date)
  if (sameMonth && sameYear) {
    return `${a.getDate()} – ${b.getDate()} ${fmt(a, { month: 'long', year: 'numeric' })}`
  }
  return `${fmt(a, { day: 'numeric', month: 'short' })} – ${fmt(b, { day: 'numeric', month: 'short', year: 'numeric' })}`
}

function formatMonthLabel(d) {
  return new Intl.DateTimeFormat('fr-CH', { month: 'long', year: 'numeric' }).format(d)
}

function formatTime(iso) {
  return new Intl.DateTimeFormat('fr-CH', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}

// Preserves the time-of-day when moving a mission to another calendar day so
// the admin doesn't accidentally clear the schedule slot.
function withDate(iso, targetDate) {
  const src = new Date(iso)
  const out = new Date(targetDate)
  out.setHours(src.getHours(), src.getMinutes(), 0, 0)
  return out.toISOString()
}

// --- Mission card -----------------------------------------------------------
function MissionCard({ mission, onDragStart, onDragEnd, dragging, compact }) {
  const tone = STATUS_TONE[mission.status] || STATUS_TONE.scheduled
  return (
    <Link
      to={`/admin/missions/${mission.id}`}
      draggable={mission.status !== 'completed' && mission.status !== 'cancelled'}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', mission.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart?.(mission.id)
      }}
      onDragEnd={onDragEnd}
      className={`block rounded-lg border ${tone} px-2 py-1.5 text-[11px] font-semibold leading-tight shadow-sm transition ${
        dragging ? 'opacity-40' : 'hover:-translate-y-0.5 hover:shadow-md'
      } ${compact ? 'truncate' : ''}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
        <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
        {formatTime(mission.date)}
      </div>
      <div className="mt-0.5 truncate text-primary">{mission.title}</div>
      {!compact && mission.city && (
        <div className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-gray-500">
          <FontAwesomeIcon icon={faLocationDot} className="h-2 w-2" />
          {mission.city}
        </div>
      )}
      {!compact && mission.staff?.length > 0 && (
        <div className="mt-1 flex items-center gap-1 truncate text-[10px] text-gray-500">
          <FontAwesomeIcon icon={faUser} className="h-2 w-2" />
          {mission.staff.slice(0, 2).join(', ')}
          {mission.staff.length > 2 ? ` +${mission.staff.length - 2}` : ''}
        </div>
      )}
    </Link>
  )
}

// --- Week view --------------------------------------------------------------
function WeekView({ anchor, missions, onDrop, dragId, setDragId, t }) {
  const start = useMemo(() => startOfWeek(anchor), [anchor])
  const days = useMemo(() => [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(start, i)), [start])
  const today = startOfDay(new Date())

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
      {days.map((d) => {
        const dayMissions = missions
          .filter((m) => sameDay(new Date(m.date), d))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
        const isToday = sameDay(d, today)
        return (
          <div
            key={d.toISOString()}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/plain')
              if (id) onDrop(id, d)
            }}
            className={`rounded-2xl bg-white p-3 shadow-sm ring-1 transition ${
              isToday ? 'ring-2 ring-accent' : 'ring-gray-100'
            }`}
          >
            <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {new Intl.DateTimeFormat('fr-CH', { weekday: 'short' }).format(d)}
                </div>
                <div
                  className={`text-lg font-bold ${
                    isToday ? 'text-accent' : 'text-primary'
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>
              <div className="text-[10px] font-medium text-gray-400">
                {dayMissions.length}
              </div>
            </div>

            <div className="mt-2 min-h-[10rem] space-y-1.5">
              {dayMissions.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-100 py-6 text-center text-[10px] font-medium text-gray-300">
                  {t('admin.planning.dropHere')}
                </div>
              ) : (
                dayMissions.map((m) => (
                  <MissionCard
                    key={m.id}
                    mission={m}
                    dragging={dragId === m.id}
                    onDragStart={setDragId}
                    onDragEnd={() => setDragId(null)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Month view -------------------------------------------------------------
function MonthView({ anchor, missions, onDrop, dragId, setDragId, t }) {
  const grid = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7
    const gridStart = addDays(first, -offset)
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  }, [anchor])
  const today = startOfDay(new Date())

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((d, i) => {
          const inMonth = d.getMonth() === anchor.getMonth()
          const isToday = sameDay(d, today)
          const dayMissions = missions
            .filter((m) => sameDay(new Date(m.date), d))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
          return (
            <div
              key={i}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/plain')
                if (id) onDrop(id, d)
              }}
              className={`min-h-[6.5rem] border-b border-r border-gray-100 p-1.5 transition ${
                inMonth ? 'bg-white' : 'bg-gray-50/50'
              } ${isToday ? 'bg-accent-50/60' : ''}`}
            >
              <div
                className={`text-xs font-bold ${
                  isToday
                    ? 'text-accent'
                    : inMonth
                      ? 'text-primary'
                      : 'text-gray-300'
                }`}
              >
                {d.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {dayMissions.slice(0, 3).map((m) => (
                  <MissionCard
                    key={m.id}
                    mission={m}
                    dragging={dragId === m.id}
                    onDragStart={setDragId}
                    onDragEnd={() => setDragId(null)}
                    compact
                  />
                ))}
                {dayMissions.length > 3 && (
                  <div className="rounded bg-gray-100 px-1.5 py-0.5 text-center text-[9px] font-bold text-gray-500">
                    +{dayMissions.length - 3}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Page -------------------------------------------------------------------
export default function AdminPlanning() {
  const { t } = useTranslation()
  const [view, setView] = useState('week') // 'week' | 'month'
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const [agentFilter, setAgentFilter] = useState('all')
  const [dragId, setDragId] = useState(null)
  const [toast, setToast] = useState(null)

  const missionsFetcher = useCallback(() => adminApi.listMissions(), [])
  const {
    data: missionsData,
    loading,
    error,
    reload,
  } = useApi(missionsFetcher)

  const agentsFetcher = useCallback(() => adminApi.listAgents(), [])
  const { data: agentsData } = useApi(agentsFetcher)

  const allMissions = missionsData?.items || []
  const agents = agentsData?.items || []

  // Filter by agent — 'all', 'unassigned', or an agent id/name.
  const missions = useMemo(() => {
    let list = allMissions
    if (agentFilter === 'unassigned') {
      list = list.filter(
        (m) => (!m.staff || m.staff.length === 0) && (!m.staffUserIds || m.staffUserIds.length === 0),
      )
    } else if (agentFilter !== 'all') {
      list = list.filter(
        (m) =>
          m.staffUserIds?.includes(agentFilter) ||
          m.staff?.some((n) => n === agents.find((a) => a.userId === agentFilter)?.name),
      )
    }
    return list
  }, [allMissions, agentFilter, agents])

  const handleDrop = async (id, targetDate) => {
    const mission = allMissions.find((m) => m.id === id)
    if (!mission) return
    // No-op if dropped on the same day.
    if (sameDay(new Date(mission.date), targetDate)) {
      setDragId(null)
      return
    }
    const newDateIso = withDate(mission.date, targetDate)
    try {
      await adminApi.updateMission(id, { date: newDateIso })
      setToast({
        type: 'ok',
        message: t('admin.planning.rescheduled', { date: formatShort(targetDate) }),
      })
      reload()
    } catch (e) {
      setToast({
        type: 'err',
        message: t('admin.planning.rescheduleFailed', { error: e.message || '' }),
      })
    } finally {
      setDragId(null)
      setTimeout(() => setToast(null), 3500)
    }
  }

  // Navigation — jumps a week (in week view) or a month (in month view).
  const goPrev = () =>
    setAnchor((d) => (view === 'week' ? addDays(d, -7) : new Date(d.getFullYear(), d.getMonth() - 1, 1)))
  const goNext = () =>
    setAnchor((d) => (view === 'week' ? addDays(d, 7) : new Date(d.getFullYear(), d.getMonth() + 1, 1)))
  const goToday = () => setAnchor(startOfDay(new Date()))

  const headerLabel =
    view === 'week'
      ? formatLongRange(startOfWeek(anchor), addDays(startOfWeek(anchor), 6))
      : formatMonthLabel(anchor)

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow={t('admin.planning.eyebrow')}
        title={t('admin.planning.title')}
        description={t('admin.planning.subtitle')}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2 h-3.5 w-3.5" />
          {error.message}
        </div>
      )}

      {toast && (
        <div
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
            toast.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
              : 'bg-red-50 text-red-800 ring-1 ring-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
            aria-label={t('admin.planning.prev')}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-100"
          >
            {t('admin.planning.today')}
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
            aria-label={t('admin.planning.next')}
          >
            <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <FontAwesomeIcon icon={faCalendarDays} className="h-3.5 w-3.5 text-secondary" />
          {headerLabel}
        </div>

        <div className="flex-1" />

        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
        >
          <option value="all">{t('admin.planning.filters.allAgents')}</option>
          <option value="unassigned">{t('admin.planning.filters.unassigned')}</option>
          {agents.map((a) => (
            <option key={a.id} value={a.userId || a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <div className="flex overflow-hidden rounded-lg ring-1 ring-gray-200">
          {['week', 'month'].map((v) => {
            const active = view === v
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  active
                    ? 'bg-secondary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t(`admin.planning.views.${v}`)}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : view === 'week' ? (
        <WeekView
          anchor={anchor}
          missions={missions}
          onDrop={handleDrop}
          dragId={dragId}
          setDragId={setDragId}
          t={t}
        />
      ) : (
        <MonthView
          anchor={anchor}
          missions={missions}
          onDrop={handleDrop}
          dragId={dragId}
          setDragId={setDragId}
          t={t}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-3 text-xs shadow-sm ring-1 ring-gray-100">
        <div className="font-bold uppercase tracking-wider text-gray-500">
          {t('admin.statuses.scheduled')} :
        </div>
        {['scheduled', 'inProgress', 'completed', 'cancelled'].map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full border ${STATUS_TONE[s]?.split(' ').slice(0, 2).join(' ')}`}
            />
            <span className="font-semibold text-gray-600">
              {t(`admin.statuses.${s}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
