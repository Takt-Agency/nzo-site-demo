import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faListCheck } from '@fortawesome/free-solid-svg-icons'

// Same source of truth as pages/Devis.jsx — which detail fields are meaningful
// per service. Keeps display and form aligned.
const SERVICE_FIELDS = {
  bureaux: ['surface', 'rooms', 'frequency', 'startDate'],
  apresChantier: ['surface', 'rooms', 'startDate'],
  facades: ['surface', 'startDate'],
  conciergerie: ['surface', 'buildingUnits', 'frequency', 'startDate'],
  garages: ['surface', 'parkingSpaces', 'frequency', 'startDate'],
  photovoltaique: ['panelCount', 'roofType', 'startDate'],
  arrosage: ['plantCount', 'plantLocation', 'visitFrequency', 'startDate', 'endDate'],
  animaux: ['petType', 'petCount', 'visitsPerDay', 'startDate', 'endDate'],
  jardins: ['surface', 'frequency', 'startDate'],
  debarras: ['volume', 'locationType', 'startDate'],
}

// Fields whose value is a translatable option key (e.g. petType → 'chat') and
// map to a namespaced label. Non-listed fields are shown as-is.
const OPTION_NAMESPACES = {
  frequency: 'devis.frequencies',
  plantLocation: 'devis.plantLocations',
  visitFrequency: 'devis.visitFrequencies',
  petType: 'devis.petTypes',
  visitsPerDay: 'devis.visitsPerDay',
  roofType: 'devis.roofTypes',
  locationType: 'devis.locationTypes',
}

// Units appended after the raw numeric value.
const UNITS = {
  surface: 'm²',
  volume: 'm³',
}

function formatDate(iso, locale) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(locale || 'fr-CH', { dateStyle: 'medium' }).format(new Date(iso))
  } catch {
    return '—'
  }
}

// `data` is the devis or mission object (surface, endDate, serviceDetails, …).
// `service` picks the field set. If a field is absent from data, we skip it.
export default function ServiceDetailsBlock({ service, data, title }) {
  const { t, i18n } = useTranslation()
  if (!service || !data) return null

  const fields = SERVICE_FIELDS[service] || []
  const details = data.serviceDetails || {}

  const resolve = (field) => {
    // Existing top-level fields on the devis/mission model.
    if (field === 'surface') return data.surface > 0 ? data.surface : null
    if (field === 'startDate') return data.startDate
    if (field === 'endDate') return data.endDate
    if (field === 'frequency') return data.frequency
    if (field === 'rooms') return Array.isArray(data.rooms) && data.rooms.length > 0 ? data.rooms : null
    // Everything else lives inside serviceDetails.
    return details[field]
  }

  const rendered = fields
    .map((field) => {
      const raw = resolve(field)
      if (raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)) return null

      const label = t(`devis.fields.${field}_${service}`, {
        defaultValue: t(`devis.fields.${field}`, { defaultValue: field }),
      })

      let value
      if (field === 'startDate' || field === 'endDate') {
        value = formatDate(raw, i18n.language)
      } else if (field === 'rooms') {
        value = raw
          .map((r) => `${t(`devis.rooms.${r.key}`, { defaultValue: r.key })} × ${r.count}`)
          .join(', ')
      } else if (OPTION_NAMESPACES[field]) {
        value = t(`${OPTION_NAMESPACES[field]}.${raw}`, { defaultValue: raw })
      } else if (UNITS[field]) {
        value = `${raw} ${UNITS[field]}`
      } else {
        value = String(raw)
      }

      return { field, label, value }
    })
    .filter(Boolean)

  if (rendered.length === 0) return null

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
        <FontAwesomeIcon icon={faListCheck} className="h-4 w-4 text-secondary" />
        {title || t('devis.prestationDetails', { defaultValue: 'Détails de la prestation' })}
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {rendered.map(({ field, label, value }) => (
          <div key={field} className="rounded-xl border border-gray-100 p-3">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {label}
            </dt>
            <dd className="mt-1 text-sm font-bold text-primary">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// Small helper for the KPI-row use case: is the "Surface" or "Frequency" KPI
// relevant for this service? Lets pages hide those cards for services where
// they don't apply.
export function serviceHasField(service, field) {
  return (SERVICE_FIELDS[service] || []).includes(field)
}
