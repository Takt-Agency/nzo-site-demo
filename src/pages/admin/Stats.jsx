import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClock,
  faSprayCanSparkles,
  faStar,
  faSpinner,
  faCircleCheck,
  faTriangleExclamation,
  faChevronLeft,
  faChevronRight,
  faUsers,
  faCashRegister,
  faArrowTrendUp,
  faArrowTrendDown,
  faDownload,
  faTrophy,
  faCrown,
  faMedal,
  faAward,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import { adminApi, getToken } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

// Monthly agent performance report. Left column: month selector + team KPIs.
// Right: per-agent table with hours, missions, punctuality, overtime, rating.
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

// Small chip that renders a signed % change with an up/down arrow + tint.
// null value renders nothing (previous month had 0 → division would be
// meaningless), so the layout collapses cleanly.
function DeltaChip({ pct, positiveIsGood = true }) {
  if (pct == null) return null
  const up = pct > 0
  const good = up === positiveIsGood
  const label = up ? `+${pct}%` : `${pct}%`
  const tone = pct === 0
    ? 'bg-gray-100 text-gray-500'
    : good
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-red-100 text-red-700'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}>
      {pct !== 0 && (
        <FontAwesomeIcon
          icon={up ? faArrowTrendUp : faArrowTrendDown}
          className="h-2.5 w-2.5"
        />
      )}
      {label}
      <span className="text-[9px] font-medium opacity-80">vs M-1</span>
    </span>
  )
}

export default function Stats() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(() => monthOffset(0))

  const { data, loading } = useApi(() => adminApi.listAgentStats(month), [month])
  const items = data?.items || []
  const summary = data?.summary || {}
  const deltas = data?.deltas || {}
  const podium = data?.podium || []

  const shiftMonth = (delta) => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const openAgent = (agentId) => {
    navigate(`/admin/stats/${agentId}?month=${encodeURIComponent(month)}`)
  }

  // Download CSV — has to be a fetch() (rather than a plain <a href>)
  // because we need the Authorization header. We build a Blob URL and
  // trigger a temporary anchor click for a filename-preserving download.
  const [downloading, setDownloading] = useState(false)
  const downloadCsv = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const url = `${API_URL}/admin/stats/agents/export.csv?month=${encodeURIComponent(month)}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `agents-stats-${month}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
    } catch (err) {
      alert('Export impossible : ' + (err.message || 'erreur inconnue'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="Performance"
        title="Stats mensuelles des agents"
        description="Vue d'ensemble mensuelle des heures, missions et satisfaction client par agent."
        action={
          <button
            type="button"
            onClick={downloadCsv}
            disabled={downloading || items.length === 0}
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-white px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-primary"
          >
            <FontAwesomeIcon
              icon={downloading ? faSpinner : faDownload}
              className={`h-3 w-3 ${downloading ? 'animate-spin' : ''}`}
            />
            Export CSV
          </button>
        }
      />

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

      {/* Team-wide KPIs — chips show M-vs-M-1 change. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={faUsers}
          tone="primary"
          label="Agents actifs"
          value={`${summary.activeAgents ?? 0} / ${items.length}`}
          hint="Ayant fait au moins 1 mission"
          delta={<DeltaChip pct={deltas.activeAgents} />}
        />
        <KpiCard
          icon={faClock}
          tone="accent"
          label="Heures cumulées"
          value={fmtHours(summary.totalHours)}
          hint={`Moy. ${fmtHours(summary.avgHoursPerAgent)}/agent actif`}
          delta={<DeltaChip pct={deltas.totalHours} />}
        />
        <KpiCard
          icon={faSprayCanSparkles}
          tone="secondary"
          label="Missions terminées"
          value={summary.missionsCompleted ?? 0}
          delta={<DeltaChip pct={deltas.missionsCompleted} />}
        />
        <KpiCard
          icon={faCashRegister}
          tone="amber"
          label="Chiffre d'affaires"
          value={fmtMoney(summary.revenue)}
          hint={`${summary.overtimeCount || 0} mission(s) en dépassement`}
          delta={<DeltaChip pct={deltas.revenue} />}
        />
      </div>

      {/* Top-3 podium — visible only when we have at least one ranked
          agent. Layout mimics a Formula-1 podium: #2 left, #1 centre (taller),
          #3 right, so the eye lands on the champion first. */}
      {podium.length > 0 && (
        <div className="overflow-hidden rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 via-white to-orange-50 shadow-sm">
          <div className="flex items-center justify-between border-b border-yellow-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faTrophy} className="h-4 w-4 text-yellow-500" />
              <h2 className="text-sm font-bold text-primary">Top 3 du mois</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600">
              Basé sur heures + note client
            </span>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            {/* Reorder so rank 2 is left, rank 1 is centre, rank 3 is right,
                and pad missing spots so the layout doesn't collapse. */}
            {[podium[1], podium[0], podium[2]].filter(Boolean).map((p) => {
              const isChamp = p.rank === 1
              const medal = p.rank === 1 ? faCrown : p.rank === 2 ? faMedal : faAward
              const medalColor =
                p.rank === 1
                  ? 'text-yellow-500'
                  : p.rank === 2
                  ? 'text-gray-400'
                  : 'text-orange-600'
              const bgFrom =
                p.rank === 1 ? 'from-yellow-100' : p.rank === 2 ? 'from-gray-100' : 'from-orange-100'
              return (
                <button
                  key={p.agentId}
                  type="button"
                  onClick={() => openAgent(p.agentId)}
                  className={`flex flex-col items-center gap-2 rounded-xl bg-gradient-to-b ${bgFrom} to-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md ${
                    isChamp ? 'ring-2 ring-yellow-300' : ''
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-white shadow ${isChamp ? 'ring-4 ring-yellow-200' : ''}`}>
                    <FontAwesomeIcon icon={medal} className={`h-6 w-6 ${medalColor}`} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    #{p.rank}
                  </div>
                  <div className="text-sm font-bold text-primary">{p.name}</div>
                  <div className="text-[11px] font-semibold text-gray-500">
                    {p.role} · {p.missionsCompleted} mission{p.missionsCompleted > 1 ? 's' : ''}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-primary">
                      {fmtHours(p.totalHours)}
                    </span>
                    {p.ratingAvg != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-primary">
                        <FontAwesomeIcon icon={faStar} className="h-2.5 w-2.5 text-yellow-500" />
                        {p.ratingAvg.toFixed(1)}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-bold text-primary">Détail par agent</h2>
          <div className="text-[11px] font-semibold text-gray-500">
            Cliquez sur une ligne pour voir le détail
          </div>
        </div>

        {loading && items.length === 0 ? (
          <div className="p-10 text-center">
            <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm font-semibold text-gray-500">
            Aucun agent enregistré.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Agent</th>
                  <th className="px-3 py-3 text-right">Missions</th>
                  <th className="px-3 py-3 text-right">Heures</th>
                  <th className="px-3 py-3 text-right">Moy./mission</th>
                  <th className="px-3 py-3 text-right">Delta vs estimé</th>
                  <th className="px-3 py-3 text-right">Dépassement</th>
                  <th className="px-3 py-3 text-right">Ponctualité</th>
                  <th className="px-3 py-3 text-right">Note</th>
                  <th className="px-4 py-3 text-right">CA</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr
                    key={a.agentId}
                    className="cursor-pointer border-t border-gray-100 transition hover:bg-primary-50/40"
                    onClick={() => openAgent(a.agentId)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-primary">{a.name}</div>
                      <div className="mt-0.5 text-[11px] text-gray-500">
                        {a.role} · {a.missionsUpcoming} à venir
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-primary">
                      {a.missionsCompleted}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-accent-700">
                      {fmtHours(a.totalHours)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700">
                      {a.avgDurationMinutes ? `${a.avgDurationMinutes} min` : '—'}
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-semibold ${
                        a.estimatedVsActualDeltaMinutes > 0
                          ? 'text-red-600'
                          : a.estimatedVsActualDeltaMinutes < 0
                          ? 'text-emerald-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {a.missionsCompleted > 0
                        ? fmtDelta(a.estimatedVsActualDeltaMinutes)
                        : '—'}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {a.overtimeRate != null ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                            a.overtimeRate > 0.3
                              ? 'bg-red-100 text-red-700'
                              : a.overtimeRate > 0.1
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {a.overtimeRate > 0.1 && (
                            <FontAwesomeIcon icon={faTriangleExclamation} className="h-2.5 w-2.5" />
                          )}
                          {fmtPercent(a.overtimeRate)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {a.punctualityRate != null ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                            a.punctualityRate >= 0.9
                              ? 'bg-emerald-100 text-emerald-700'
                              : a.punctualityRate >= 0.7
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" />
                          {fmtPercent(a.punctualityRate)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {a.ratingAvg != null ? (
                        <span className="inline-flex items-center gap-1 font-bold text-primary">
                          <FontAwesomeIcon icon={faStar} className="h-3 w-3 text-yellow-400" />
                          {a.ratingAvg.toFixed(1)}
                          <span className="text-[10px] font-semibold text-gray-500">
                            ({a.ratingCount})
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 font-bold text-primary">
                        {fmtMoney(a.revenue)}
                        <FontAwesomeIcon
                          icon={faChevronRight}
                          className="h-3 w-3 text-gray-300"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ icon, tone, label, value, hint, delta }) {
  const TONES = {
    primary: { icon: 'text-primary-700', bg: 'bg-primary-50' },
    accent: { icon: 'text-accent-700', bg: 'bg-accent-50' },
    secondary: { icon: 'text-secondary-700', bg: 'bg-secondary-50' },
    amber: { icon: 'text-amber-700', bg: 'bg-amber-50' },
  }
  const t = TONES[tone] || TONES.primary
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.bg}`}>
          <FontAwesomeIcon icon={icon} className={`h-4 w-4 ${t.icon}`} />
        </div>
        {delta}
      </div>
      <div className="mt-3 text-xl font-bold text-primary">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
      {hint ? <div className="mt-1 text-[10px] text-gray-400">{hint}</div> : null}
    </div>
  )
}

