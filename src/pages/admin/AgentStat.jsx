import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCalendarCheck,
  faCashRegister,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faClock,
  faGaugeHigh,
  faHourglassHalf,
  faSpinner,
  faSprayCanSparkles,
  faStar,
  faTriangleExclamation,
  faUserClock,
  faUserSlash,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function monthOffset(offset) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function labelForMonth(str) {
  const [y, m] = str.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' })
}

function fmtHours(h) {
  return `${(h || 0).toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} h`
}

function fmtMoney(v) {
  return `${(v || 0).toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CHF`
}

function fmtPercent(v) {
  if (v == null) return '—'
  return `${Math.round(v * 100)}%`
}

function fmtDelta(minutes) {
  if (minutes === 0) return 'pile'
  const sign = minutes > 0 ? '+' : '-'
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (h > 0) return `${sign}${h}h${String(m).padStart(2, '0')}`
  return `${sign}${m} min`
}

function fmtMinutes(minutes) {
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const sign = minutes < 0 ? '-' : ''
  if (h > 0) return `${sign}${h}h${String(m).padStart(2, '0')}`
  return `${sign}${m} min`
}

// Ring gauge showing the composite performance score. Circumference-based
// stroke offset avoids pulling in a chart lib for one component.
function ScoreRing({ score, letter }) {
  const size = 160
  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - (score || 0) / 100)
  const color =
    score >= 90 ? '#059669' : score >= 75 ? '#0ea5e9' : score >= 60 ? '#f59e0b' : '#dc2626'
  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <div className="text-4xl font-bold" style={{ color }}>
          {score}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          / 100
        </div>
        <div
          className="mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {letter}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, tone, label, value, hint }) {
  const TONES = {
    primary: { icon: 'text-primary-700', bg: 'bg-primary-50' },
    accent: { icon: 'text-accent-700', bg: 'bg-accent-50' },
    secondary: { icon: 'text-secondary-700', bg: 'bg-secondary-50' },
    amber: { icon: 'text-amber-700', bg: 'bg-amber-50' },
    emerald: { icon: 'text-emerald-700', bg: 'bg-emerald-50' },
    red: { icon: 'text-red-700', bg: 'bg-red-50' },
  }
  const t = TONES[tone] || TONES.primary
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.bg}`}>
        <FontAwesomeIcon icon={icon} className={`h-4 w-4 ${t.icon}`} />
      </div>
      <div className="mt-3 text-xl font-bold text-primary">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
      {hint ? <div className="mt-1 text-[10px] text-gray-400">{hint}</div> : null}
    </div>
  )
}

export default function AgentStat() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const month = searchParams.get('month') || monthOffset(0)

  const { data, loading } = useApi(() => adminApi.getAgentStats(id, month), [id, month])

  const agent = data?.agent
  const summary = data?.summary
  const performance = data?.performance
  const breakdown = data?.breakdown
  const missions = data?.missions || []

  const shiftMonth = (delta) => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    setSearchParams({ month: next })
  }

  const maxWeekHours = useMemo(() => {
    if (!breakdown?.hoursByWeek?.length) return 1
    return Math.max(1, ...breakdown.hoursByWeek.map((w) => w.hours))
  }, [breakdown])

  const maxWeekdayCount = useMemo(() => {
    if (!breakdown?.missionsByWeekday?.length) return 1
    return Math.max(1, ...breakdown.missionsByWeekday.map((w) => w.count))
  }, [breakdown])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/stats"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-sm ring-1 ring-gray-100 transition hover:bg-primary-50"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
        </Link>
        <AdminPageHeader
          eyebrow="Performance agent"
          title={agent?.name || '…'}
          subtitle={
            agent
              ? `${agent.role?.toUpperCase()} · ${agent.email || 'sans email'} · rapport mensuel`
              : 'Chargement…'
          }
        />
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary transition hover:bg-gray-100"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" />
        </button>
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-secondary-700">Mois</div>
          <div className="mt-0.5 text-lg font-bold capitalize text-primary">
            {labelForMonth(month)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={month === monthOffset(0)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary transition hover:bg-gray-100 disabled:opacity-30"
        >
          <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading && !data ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !summary ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <div className="text-sm font-semibold text-gray-500">
            Cet agent n'a pas de compte utilisateur — les statistiques ne peuvent pas être calculées.
          </div>
        </div>
      ) : (
        <>
          {/* Performance score + breakdown */}
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Note globale
              </div>
              <div className="mt-2 flex items-center justify-center">
                <ScoreRing score={performance?.score || 0} letter={performance?.letter || '—'} />
              </div>
              <div className="mt-3 text-center text-[11px] text-gray-500">
                Calculée à partir de 5 critères pondérés
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 lg:col-span-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Décomposition
              </div>
              <ul className="mt-3 space-y-3">
                {(performance?.breakdown || []).map((b) => {
                  const barColor =
                    b.score >= 80
                      ? 'bg-emerald-500'
                      : b.score >= 60
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  return (
                    <li key={b.key}>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-primary">
                          {b.label}
                          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500">
                            {Math.round(b.weight * 100)}%
                          </span>
                          {!b.hasData && (
                            <span className="text-[10px] font-normal italic text-gray-400">
                              (données manquantes)
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-primary">
                          {b.score}
                          <span className="text-[10px] text-gray-400"> /100</span>
                        </div>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full ${barColor} transition-all`}
                          style={{ width: `${b.score}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={faSprayCanSparkles}
              tone="primary"
              label="Missions terminées"
              value={summary.missionsCompleted}
              hint={`${summary.missionsUpcoming} à venir · ${summary.missionsCancelled} annulée(s)`}
            />
            <StatCard
              icon={faClock}
              tone="accent"
              label="Heures travaillées"
              value={fmtHours(summary.totalHours)}
              hint={`Estimé: ${fmtHours(summary.totalEstimatedHours)} · ${fmtDelta(
                summary.estimatedVsActualDeltaMinutes,
              )}`}
            />
            <StatCard
              icon={faCalendarCheck}
              tone="secondary"
              label="Jours travaillés"
              value={`${summary.workDays} / ${summary.expectedWorkDays}`}
              hint={`Présence: ${fmtPercent(summary.presenceRate)}`}
            />
            <StatCard
              icon={faCashRegister}
              tone="amber"
              label="Chiffre d'affaires"
              value={fmtMoney(summary.revenue)}
              hint={`Moy. ${fmtMoney(summary.avgRevenuePerMission)}/mission`}
            />

            <StatCard
              icon={faUserClock}
              tone={
                summary.punctualityRate == null
                  ? 'primary'
                  : summary.punctualityRate >= 0.9
                  ? 'emerald'
                  : summary.punctualityRate >= 0.7
                  ? 'amber'
                  : 'red'
              }
              label="Ponctualité"
              value={fmtPercent(summary.punctualityRate)}
              hint={
                summary.avgStartDelayMinutes != null
                  ? `Retard moyen: ${fmtMinutes(summary.avgStartDelayMinutes)}`
                  : 'Aucune donnée'
              }
            />
            <StatCard
              icon={faHourglassHalf}
              tone={
                summary.overtimeRate == null
                  ? 'primary'
                  : summary.overtimeRate > 0.3
                  ? 'red'
                  : summary.overtimeRate > 0.1
                  ? 'amber'
                  : 'emerald'
              }
              label="Taux dépassement"
              value={fmtPercent(summary.overtimeRate)}
              hint={`${summary.overtimeCount} dépassement(s) · ${summary.underrunCount} plus vite`}
            />
            <StatCard
              icon={faStar}
              tone="amber"
              label="Note client moyenne"
              value={summary.ratingAvg != null ? summary.ratingAvg.toFixed(2) : '—'}
              hint={
                summary.ratingCount > 0
                  ? `${summary.ratingCount} avis · ${summary.fiveStarCount} × 5★`
                  : 'Aucun avis'
              }
            />
            <StatCard
              icon={faUserSlash}
              tone={
                summary.cancelRate == null
                  ? 'primary'
                  : summary.cancelRate > 0.2
                  ? 'red'
                  : summary.cancelRate > 0.05
                  ? 'amber'
                  : 'emerald'
              }
              label="Taux annulation"
              value={fmtPercent(summary.cancelRate)}
              hint={`${summary.missionsCancelled} annulée(s) sur ${
                summary.missionsCancelled + summary.missionsCompleted
              }`}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Weekly hours */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary">Heures par semaine</h3>
                <FontAwesomeIcon icon={faGaugeHigh} className="h-4 w-4 text-primary-300" />
              </div>
              <div className="mt-4 flex items-end gap-2" style={{ height: 140 }}>
                {(breakdown?.hoursByWeek || []).map((w) => (
                  <div key={w.week} className="flex flex-1 flex-col items-center">
                    <div className="text-[10px] font-semibold text-gray-500">
                      {w.hours > 0 ? `${w.hours}h` : ''}
                    </div>
                    <div
                      className="mt-1 w-full rounded-t-lg bg-gradient-to-t from-accent-500 to-accent-300 transition-all"
                      style={{
                        height: `${(w.hours / maxWeekHours) * 100}%`,
                        minHeight: w.hours > 0 ? 4 : 2,
                      }}
                    />
                    <div className="mt-1 text-[10px] font-bold text-gray-500">S{w.week}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekday distribution */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary">Missions par jour</h3>
                <FontAwesomeIcon icon={faCalendarCheck} className="h-4 w-4 text-primary-300" />
              </div>
              <div className="mt-4 flex items-end gap-2" style={{ height: 140 }}>
                {(breakdown?.missionsByWeekday || []).map((w) => (
                  <div key={w.weekday} className="flex flex-1 flex-col items-center">
                    <div className="text-[10px] font-semibold text-gray-500">
                      {w.count > 0 ? w.count : ''}
                    </div>
                    <div
                      className="mt-1 w-full rounded-t-lg bg-gradient-to-t from-secondary-500 to-secondary-300 transition-all"
                      style={{
                        height: `${(w.count / maxWeekdayCount) * 100}%`,
                        minHeight: w.count > 0 ? 4 : 2,
                      }}
                    />
                    <div className="mt-1 text-[10px] font-bold text-gray-500">{w.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Punctuality histogram */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-sm font-bold text-primary">Répartition des arrivées</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-emerald-50 p-3">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-emerald-700">
                  <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                  À l'heure (±15 min)
                </div>
                <div className="mt-1 text-2xl font-bold text-emerald-700">
                  {summary.punctualCount}
                </div>
              </div>
              <div className="rounded-xl bg-secondary-50 p-3">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-secondary-700">
                  <FontAwesomeIcon icon={faUserClock} className="h-3 w-3" />
                  En avance
                </div>
                <div className="mt-1 text-2xl font-bold text-secondary-700">
                  {summary.earlyCount}
                </div>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-red-700">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="h-3 w-3" />
                  En retard (&gt;15 min)
                </div>
                <div className="mt-1 text-2xl font-bold text-red-700">{summary.lateCount}</div>
              </div>
            </div>
          </div>

          {/* Missions list */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-bold text-primary">Missions terminées ce mois</h3>
            </div>
            {missions.length === 0 ? (
              <div className="p-8 text-center text-sm font-semibold text-gray-500">
                Aucune mission terminée sur la période.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Mission</th>
                      <th className="px-3 py-3 text-right">Date</th>
                      <th className="px-3 py-3 text-right">Durée</th>
                      <th className="px-3 py-3 text-right">Delta</th>
                      <th className="px-3 py-3 text-right">Retard</th>
                      <th className="px-3 py-3 text-right">Note</th>
                      <th className="px-4 py-3 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missions.map((m) => (
                      <tr key={m.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/missions/${m.id}`}
                            className="font-bold text-primary hover:underline"
                          >
                            {m.title}
                          </Link>
                          <div className="mt-0.5 text-[11px] text-gray-500">
                            {m.clientName || '—'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-gray-600">
                          {new Date(m.date).toLocaleDateString('fr-CH', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-primary">
                          {m.actualDurationMinutes
                            ? fmtMinutes(m.actualDurationMinutes)
                            : '—'}
                        </td>
                        <td
                          className={`px-3 py-3 text-right font-semibold ${
                            m.deltaMinutes == null
                              ? 'text-gray-400'
                              : m.deltaMinutes > 0
                              ? 'text-red-600'
                              : m.deltaMinutes < 0
                              ? 'text-emerald-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {m.deltaMinutes != null ? fmtDelta(m.deltaMinutes) : '—'}
                        </td>
                        <td
                          className={`px-3 py-3 text-right text-xs font-semibold ${
                            m.startDelayMinutes == null
                              ? 'text-gray-400'
                              : m.startDelayMinutes > 15
                              ? 'text-red-600'
                              : m.startDelayMinutes < -5
                              ? 'text-secondary-700'
                              : 'text-emerald-600'
                          }`}
                        >
                          {m.startDelayMinutes != null
                            ? fmtMinutes(m.startDelayMinutes)
                            : '—'}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {m.clientFeedback?.rating ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-primary">
                              <FontAwesomeIcon icon={faStar} className="h-3 w-3 text-yellow-400" />
                              {m.clientFeedback.rating}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">
                          {m.amount ? fmtMoney(m.amount) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
