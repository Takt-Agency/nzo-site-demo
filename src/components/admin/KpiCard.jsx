import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowTrendUp, faArrowTrendDown } from '@fortawesome/free-solid-svg-icons'

export default function KpiCard({ icon, label, value, delta, format, accent = 'secondary' }) {
  const accentMap = {
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent-700',
    tertiary: 'bg-tertiary-50 text-tertiary-700',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-100 text-amber-700',
  }

  const displayValue =
    format === 'currency'
      ? new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(value)
      : format === 'percent'
        ? `${value}%`
        : value

  const hasDelta = typeof delta === 'number'
  const isPositive = hasDelta && delta >= 0

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentMap[accent]}`}>
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </span>
        {hasDelta && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isPositive ? 'bg-accent/10 text-accent-700' : 'bg-red-50 text-red-600'
            }`}
          >
            <FontAwesomeIcon
              icon={isPositive ? faArrowTrendUp : faArrowTrendDown}
              className="h-2.5 w-2.5"
            />
            {isPositive ? '+' : ''}
            {delta}
            {format === 'percent' ? 'pt' : '%'}
          </span>
        )}
      </div>
      <div className="mt-4 text-2xl font-bold text-primary md:text-3xl">{displayValue}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-500">{label}</div>
    </div>
  )
}
