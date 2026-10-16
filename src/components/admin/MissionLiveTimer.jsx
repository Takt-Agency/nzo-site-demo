import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faTriangleExclamation, faStopwatch } from '@fortawesome/free-solid-svg-icons'

// Live chronometer shown on the admin mission detail while status ===
// 'inProgress'. Elapsed time is derived from `startedAt` (server timestamp)
// so it stays accurate even if the admin refreshes the page mid-mission.
function fmtHms(ms) {
  if (ms < 0) ms = 0
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtDelta(ms) {
  const sign = ms >= 0 ? '+' : '-'
  const abs = Math.abs(ms)
  const h = Math.floor(abs / 3600000)
  const m = Math.floor((abs % 3600000) / 60000)
  if (h > 0) return `${sign}${h}h${String(m).padStart(2, '0')}`
  return `${sign}${m} min`
}

const TONES = {
  ok: {
    wrap: 'bg-accent-50 border-accent-300',
    label: 'text-accent-700',
    timer: 'text-accent-700',
    bar: 'bg-accent',
    icon: faClock,
    title: 'INTERVENTION EN COURS',
  },
  warning: {
    wrap: 'bg-amber-50 border-amber-300',
    label: 'text-amber-700',
    timer: 'text-amber-700',
    bar: 'bg-amber-500',
    icon: faClock,
    title: 'BIENTÔT LA LIMITE',
  },
  over: {
    wrap: 'bg-red-50 border-red-300 animate-pulse',
    label: 'text-red-700',
    timer: 'text-red-700',
    bar: 'bg-red-500',
    icon: faTriangleExclamation,
    title: 'DURÉE DÉPASSÉE',
  },
}

export default function MissionLiveTimer({ startedAt, estimatedHours }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  if (!startedAt) return null
  const startTs = new Date(startedAt).getTime()
  const elapsedMs = now - startTs
  const estimatedMs = (estimatedHours || 0) * 60 * 60 * 1000
  const percent = estimatedMs > 0 ? Math.min(999, (elapsedMs / estimatedMs) * 100) : 0
  const isOver = estimatedMs > 0 && elapsedMs > estimatedMs
  const tone = isOver ? 'over' : percent >= 80 ? 'warning' : 'ok'
  const t = TONES[tone]

  return (
    <div className={`rounded-2xl border-2 p-5 shadow-sm ${t.wrap}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.wrap} border ${t.label}/30`}>
          <FontAwesomeIcon icon={t.icon} className={`h-4 w-4 ${t.label}`} />
        </div>
        <div className="flex-1">
          <div className={`text-[11px] font-bold uppercase tracking-widest ${t.label}`}>
            {t.title}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-gray-500">
            Démarrée à{' '}
            {new Date(startedAt).toLocaleTimeString('fr-CH', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
        <div className="rounded-full bg-white/60 px-2 py-1 text-[10px] font-bold uppercase text-gray-500">
          Live
        </div>
      </div>

      <div className={`mt-4 text-center text-4xl font-bold tabular-nums tracking-wider ${t.timer}`}>
        {fmtHms(elapsedMs)}
      </div>

      {estimatedMs > 0 && (
        <>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/5">
            <div
              className={`h-full transition-all ${t.bar}`}
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-600">Estimé : {estimatedHours}h</span>
            <span className={`font-bold ${t.label}`}>
              {isOver ? fmtDelta(elapsedMs - estimatedMs) : `${Math.round(percent)}%`}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// Static block shown once the mission is completed. Reads the persisted
// `actualDurationMinutes` (computed server-side by the pre-save hook) and
// contrasts it with the original estimate — the number that the monthly
// agent stats report will aggregate.
export function MissionFinalDuration({ actualDurationMinutes, estimatedHours }) {
  if (!actualDurationMinutes) return null
  const h = Math.floor(actualDurationMinutes / 60)
  const min = actualDurationMinutes % 60
  const base = h > 0 ? `${h}h${String(min).padStart(2, '0')}` : `${min} min`
  const estimatedMin = (estimatedHours || 0) * 60
  const delta = actualDurationMinutes - estimatedMin
  const isOver = estimatedMin > 0 && delta > 0
  const isUnder = estimatedMin > 0 && delta < 0
  return (
    <div className="rounded-2xl border-2 border-primary-100 bg-primary-50/50 p-4 text-xs">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faStopwatch} className="h-3.5 w-3.5 text-primary-700" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700">
          Durée réelle
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold text-primary">{base}</div>
      {estimatedMin > 0 && (
        <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold">
          <span className="text-gray-500">Estimé {estimatedHours}h</span>
          <span
            className={
              isOver
                ? 'text-red-600'
                : isUnder
                ? 'text-emerald-600'
                : 'text-gray-500'
            }
          >
            {delta > 0 ? '+' : ''}
            {delta} min
          </span>
        </div>
      )}
    </div>
  )
}
