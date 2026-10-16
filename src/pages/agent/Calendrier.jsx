import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faChevronRight,
  faCalendarDay,
  faLocationDot,
  faClock,
  faPhone,
  faSprayCanSparkles,
  faArrowRight,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { agentApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const STATUS_TONE = {
  scheduled: 'bg-secondary',
  inProgress: 'bg-accent',
  completed: 'bg-emerald-600',
  cancelled: 'bg-gray-300',
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatTime(iso) {
  return new Intl.DateTimeFormat('fr-CH', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}

function formatLongDate(d) {
  return new Intl.DateTimeFormat('fr-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

// Build a 6x7 grid of dates for a given month, starting on Monday.
function buildGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  // JS: Sunday=0, Monday=1, …; we want Monday-first so shift.
  const dayOfWeek = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - dayOfWeek)
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    cells.push(d)
  }
  return cells
}

export default function AgentCalendrier() {
  const { t } = useTranslation()
  const WEEKDAYS = t('agent.calendrier.weekdays', { returnObjects: true })
  const MONTHS = t('agent.calendrier.months', { returnObjects: true })

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)

  const fetcher = useCallback(() => agentApi.listMissions(), [])
  const { data, loading, error } = useApi(fetcher)
  const missions = data?.items || []

  // Group missions by ISO day key for fast lookup in the grid.
  const missionsByDay = useMemo(() => {
    const map = new Map()
    for (const m of missions) {
      const d = new Date(m.date)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(m)
    }
    // Sort within each day by time.
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.date) - new Date(b.date))
    }
    return map
  }, [missions])

  const missionsOfMonth = useMemo(() => {
    return missions.filter((m) => {
      const d = new Date(m.date)
      return d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth()
    })
  }, [missions, cursor])

  const cells = useMemo(
    () => buildGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  )

  const selectedKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`
  const dayMissions = missionsByDay.get(selectedKey) || []

  const prevMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
  const nextMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-700">
            {t('agent.calendrier.eyebrow')}
          </div>
          <h1 className="mt-1 text-xl font-bold text-primary md:text-2xl">{t('agent.calendrier.title')}</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            {t('agent.calendrier.monthlyCount', { count: missionsOfMonth.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={goToday}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border-2 border-secondary px-4 py-2 text-xs font-bold text-secondary transition hover:bg-secondary hover:text-white sm:self-end"
        >
          <FontAwesomeIcon icon={faCalendarDay} className="h-3 w-3" />
          {t('agent.calendrier.today')}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
          {error.message}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Month grid */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-primary md:text-lg">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                aria-label={t('agent.calendrier.prevMonth')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-primary"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label={t('agent.calendrier.nextMonth')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-primary"
              >
                <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-1 py-1.5 text-center">
                {d}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              const inMonth = d.getMonth() === cursor.getMonth()
              const isToday = sameDay(d, today)
              const isSelected = sameDay(d, selectedDate)
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
              const dayList = missionsByDay.get(key) || []
              const hasMissions = dayList.length > 0
              const isWeekend = i % 7 >= 5
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDate(new Date(d))}
                  className={`group relative flex aspect-square flex-col rounded-xl p-1.5 text-left transition md:aspect-auto md:min-h-[78px] md:p-2 ${
                    isSelected
                      ? 'bg-accent text-white shadow-sm shadow-accent/30 ring-2 ring-accent'
                      : isToday
                      ? 'bg-accent/10 ring-1 ring-accent/30 hover:bg-accent/15'
                      : inMonth
                      ? isWeekend
                        ? 'bg-gray-50 hover:bg-gray-100'
                        : 'bg-white hover:bg-secondary-50/40 ring-1 ring-gray-100'
                      : 'bg-gray-50/50 text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-white'
                          : isToday
                          ? 'text-accent-700'
                          : inMonth
                          ? 'text-primary'
                          : 'text-gray-300'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    {hasMissions && (
                      <span
                        className={`hidden h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none md:inline-flex ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-accent text-white'
                        }`}
                      >
                        {dayList.length}
                      </span>
                    )}
                  </div>
                  {hasMissions && (
                    <div className="mt-auto hidden flex-col gap-0.5 md:flex">
                      {dayList.slice(0, 2).map((m) => (
                        <span
                          key={m.id}
                          className={`truncate rounded px-1 py-0.5 text-[9px] font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : `${STATUS_TONE[m.status] || 'bg-gray-300'} text-white`
                          }`}
                        >
                          {formatTime(m.date)} {m.title}
                        </span>
                      ))}
                      {dayList.length > 2 && (
                        <span
                          className={`text-[9px] font-bold ${
                            isSelected ? 'text-white/85' : 'text-gray-500'
                          }`}
                        >
                          +{dayList.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  {hasMissions && (
                    <span
                      className={`mt-1 inline-block h-1 w-1 rounded-full md:hidden ${
                        isSelected ? 'bg-white' : 'bg-accent'
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-100 pt-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              {t('agent.statuses.scheduled')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" />
              {t('agent.statuses.inProgress')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              {t('agent.statuses.completed')}
            </span>
          </div>
        </div>

        {/* Day detail */}
        <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 lg:sticky lg:top-20 lg:self-start">
          <div className="text-[10px] font-bold uppercase tracking-wider text-accent-700">
            {t('agent.calendrier.selectedDay')}
          </div>
          <h2 className="mt-1 text-base font-bold capitalize text-primary md:text-lg">
            {formatLongDate(selectedDate)}
          </h2>
          <div className="mt-1 text-xs font-medium text-gray-500">
            {dayMissions.length === 0
              ? t('agent.calendrier.dayNoMission')
              : t('agent.calendrier.dayMissionCount', { count: dayMissions.length })}
          </div>

          {loading && (
            <div className="mt-4 space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          )}

          {!loading && dayMissions.length === 0 && (
            <div className="mt-4 rounded-xl bg-gray-50 p-6 text-center">
              <FontAwesomeIcon icon={faSprayCanSparkles} className="h-6 w-6 text-gray-300" />
              <p className="mt-2 text-xs font-semibold text-gray-500">
                {t('agent.calendrier.dayEmptyHint')}
              </p>
            </div>
          )}

          {!loading && dayMissions.length > 0 && (
            <ul className="mt-4 space-y-2.5">
              {dayMissions.map((m) => (
                <li key={m.id}>
                  <Link
                    to={`/espace-agent/missions/${m.id}`}
                    className="block rounded-xl border border-gray-100 p-3 transition hover:border-accent/40 hover:bg-accent/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex h-2 w-2 rounded-full ${
                              STATUS_TONE[m.status] || 'bg-gray-300'
                            }`}
                          />
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                            <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5 text-accent" />
                            {formatTime(m.date)}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {t('agent.calendrier.hoursShort', { count: m.duration })}
                          </span>
                        </div>
                        <div className="mt-1 truncate text-sm font-bold text-primary">
                          {m.title}
                        </div>
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
                      <FontAwesomeIcon icon={faArrowRight} className="mt-1.5 h-3 w-3 text-gray-400" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
