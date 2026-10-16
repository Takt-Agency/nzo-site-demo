// Single source of truth for the per-service devis fields — used by both the
// client-facing quote form (pages/Devis.jsx) and the admin manual-devis modal
// (components/admin/AdminDevisFormModal.jsx). Keep the two forms in sync by
// only editing this file.

export const SERVICES = [
  'bureaux',
  'apresChantier',
  'facades',
  'conciergerie',
  'garages',
  'photovoltaique',
  'arrosage',
  'animaux',
  'jardins',
  'debarras',
]

export const FREQUENCIES = ['unique', 'hebdo', 'bimensuel', 'mensuel']

export const AUDIENCES = ['particulier', 'entreprise', 'proImmo', 'association']

// Which detail fields to show at step 2 per service. Order matters — controls
// render order in the form. Fields not listed here are hidden for that service
// (e.g. `rooms` is only shown for bureaux/apresChantier).
export const SERVICE_STEP2_FIELDS = {
  bureaux: ['surface', 'rooms', 'frequency', 'startDate', 'notes'],
  apresChantier: ['surface', 'rooms', 'startDate', 'notes'],
  facades: ['surface', 'startDate', 'notes'],
  conciergerie: ['surface', 'buildingUnits', 'frequency', 'startDate', 'notes'],
  garages: ['surface', 'parkingSpaces', 'frequency', 'startDate', 'notes'],
  photovoltaique: ['panelCount', 'roofType', 'startDate', 'notes'],
  arrosage: ['plantCount', 'plantLocation', 'visitFrequency', 'startDate', 'endDate', 'notes'],
  animaux: ['petType', 'petCount', 'visitsPerDay', 'startDate', 'endDate', 'notes'],
  jardins: ['surface', 'frequency', 'startDate', 'notes'],
  debarras: ['volume', 'locationType', 'startDate', 'notes'],
}

// Required-to-proceed fields per service. Frequency is handled separately —
// only enforced when audience is not 'particulier' AND the service supports it.
export const SERVICE_REQUIRED = {
  bureaux: ['surface'],
  apresChantier: ['surface'],
  facades: ['surface'],
  conciergerie: ['surface'],
  garages: ['surface'],
  photovoltaique: ['panelCount'],
  arrosage: ['plantCount', 'endDate'],
  animaux: ['petType', 'petCount', 'endDate'],
  jardins: ['surface'],
  debarras: ['volume'],
}

export const PLANT_LOCATIONS = ['interieur', 'balcon', 'jardin', 'mixte']
export const VISIT_FREQUENCIES = ['quotidien', 'deuxJours', 'deuxParSemaine', 'ponctuel']
// Cats & small animals only (no dogs: the service is indoor visits, no walks).
// 'chien' stays translatable so older quotes still display correctly.
export const PET_TYPES = ['chat', 'petit', 'autre']
export const VISITS_PER_DAY = ['1', '2']
export const ROOF_TYPES = ['plat', 'incline', 'tuile']
export const LOCATION_TYPES = ['cave', 'grenier', 'appartement', 'bureau', 'garage', 'autre']

// Which keys go into the `serviceDetails` object when submitting a devis.
// Everything outside this list stays at the devis root (surface, startDate,
// endDate, frequency, notes, rooms).
export const SERVICE_DETAIL_KEYS = [
  'panelCount',
  'roofType',
  'plantCount',
  'plantLocation',
  'visitFrequency',
  'petType',
  'petCount',
  'visitsPerDay',
  'buildingUnits',
  'parkingSpaces',
  'volume',
  'locationType',
]

export function serviceHasField(service, field) {
  return (SERVICE_STEP2_FIELDS[service] || []).includes(field)
}
