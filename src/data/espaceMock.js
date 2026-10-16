// Mock data for the client portal — to be replaced by Supabase calls in phase 2.
// All structures match what the future API will return so swapping is mechanical.

import { beforeAfter } from '../assets/images'

export const quotes = [
  {
    id: 'DV-2026-042',
    service: 'bureaux',
    surface: 240,
    frequency: 'hebdo',
    address: 'Rue du Rhône 12',
    postalCode: '1204',
    city: 'Genève',
    requestedAt: '2026-05-14T10:30:00',
    startDate: '2026-06-01',
    status: 'quoted',
    amount: 1240,
    currency: 'CHF',
    vatRate: 8.1,
    notes:
      "Bureaux sur 3 étages, accès par badge magnétique. Intervention le soir après 19h, prévoir 2 personnes.",
    validUntil: '2026-06-16',
    staffMessage:
      "Nous proposons un passage hebdomadaire le mercredi soir. Le forfait inclut consommables (papier, savon).",
    timeline: [
      { key: 'submitted', date: '2026-05-14T10:30:00' },
      { key: 'reviewed', date: '2026-05-15T09:15:00' },
      { key: 'quoted', date: '2026-05-16T14:00:00' },
    ],
  },
  {
    id: 'DV-2026-038',
    service: 'facades',
    surface: 180,
    frequency: 'unique',
    address: 'Av. de la Gare 5',
    postalCode: '1003',
    city: 'Lausanne',
    requestedAt: '2026-05-08T16:45:00',
    startDate: '2026-06-10',
    status: 'pending',
    amount: null,
    currency: 'CHF',
    vatRate: 8.1,
    notes:
      "Bâtiment de 4 étages, façade exposée sud, dernière intervention il y a 5 ans. Présence de mousses.",
    validUntil: null,
    staffMessage: null,
    timeline: [{ key: 'submitted', date: '2026-05-08T16:45:00' }],
  },
]

export function findQuoteById(id) {
  return quotes.find((q) => q.id === id)
}

export const missions = [
  {
    id: 'MS-2026-058',
    service: 'bureaux',
    title: 'Nettoyage bureaux — Rue du Rhône',
    description:
      "Entretien hebdomadaire des bureaux : 3 étages, open-spaces, salles de réunion, sanitaires et cuisines. Aspiration, lavage des sols, désinfection, vitres intérieures.",
    surface: 240,
    estimatedDuration: 4,
    address: 'Rue du Rhône 12',
    postalCode: '1204',
    city: 'Genève',
    coordinates: { lat: 46.2044, lng: 6.1432 },
    scheduledDate: '2026-05-22T08:00:00',
    completedDate: null,
    status: 'scheduled',
    team: { name: 'Équipe Genève A', leader: 'Rémi B.', size: 2 },
    quoteId: 'DV-2026-042',
    invoiceId: null,
    photos: [],
    timeline: [
      { key: 'scheduled', date: '2026-05-16T15:00:00' },
      { key: 'in_progress', date: null },
      { key: 'completed', date: null },
    ],
    rating: null,
    clientNotes: null,
  },
  {
    id: 'MS-2026-061',
    service: 'facades',
    title: 'Façades — bâtiment principal',
    description:
      "Nettoyage haute pression de la façade principale, traitement antimousse et hydrofugation. Intervention sur nacelle.",
    surface: 180,
    estimatedDuration: 8,
    address: 'Av. de la Gare 5',
    postalCode: '1003',
    city: 'Lausanne',
    coordinates: { lat: 46.5197, lng: 6.6323 },
    scheduledDate: '2026-05-28T09:30:00',
    completedDate: null,
    status: 'scheduled',
    team: { name: 'Équipe Lausanne B', leader: 'Marc D.', size: 3 },
    quoteId: 'DV-2026-038',
    invoiceId: null,
    photos: [],
    timeline: [
      { key: 'scheduled', date: '2026-05-09T11:00:00' },
      { key: 'in_progress', date: null },
      { key: 'completed', date: null },
    ],
    rating: null,
    clientNotes: null,
  },
  {
    id: 'MS-2026-049',
    service: 'conciergerie',
    title: 'Conciergerie immeuble Vermont',
    description:
      "Nettoyage des parties communes : escaliers, paliers, halls, ascenseur. Sortie et rentrée des containers. Contrôle final avec photos.",
    surface: null,
    estimatedDuration: 3,
    address: 'Rue Vermont 22',
    postalCode: '1202',
    city: 'Genève',
    coordinates: { lat: 46.2238, lng: 6.1394 },
    scheduledDate: '2026-05-12T07:00:00',
    completedDate: '2026-05-12T10:15:00',
    status: 'completed',
    team: { name: 'Équipe Genève B', leader: 'Anna S.', size: 2 },
    quoteId: null,
    invoiceId: 'FA-2026-118',
    photos: [
      {
        id: 'p1',
        kind: 'before',
        url: beforeAfter.avant,
        caption: 'Hall principal',
        uploadedAt: '2026-05-12T07:05:00',
      },
      {
        id: 'p3',
        kind: 'before',
        url: beforeAfter.avant,
        caption: 'Cage d\'escaliers',
        uploadedAt: '2026-05-12T07:08:00',
      },
      {
        id: 'p2',
        kind: 'after',
        url: beforeAfter.apres,
        caption: 'Hall principal',
        uploadedAt: '2026-05-12T10:10:00',
      },
      {
        id: 'p4',
        kind: 'after',
        url: beforeAfter.apres,
        caption: 'Cage d\'escaliers',
        uploadedAt: '2026-05-12T10:12:00',
      },
    ],
    timeline: [
      { key: 'scheduled', date: '2026-05-05T14:00:00' },
      { key: 'in_progress', date: '2026-05-12T07:00:00' },
      { key: 'completed', date: '2026-05-12T10:15:00' },
    ],
    rating: 5,
    clientNotes: 'Travail soigné, équipe ponctuelle et discrète. Hall vraiment impeccable.',
  },
]

export function findMissionById(id) {
  return missions.find((m) => m.id === id)
}

export const notifications = [
  {
    id: 'n1',
    type: 'new_quote',
    title: 'Devis #DV-2026-042 reçu',
    text: 'Estimation 1 240 CHF · Valable jusqu\'au 16 juin.',
    link: '/espace-client/devis/DV-2026-042',
    date: '2026-05-16T14:00:00',
    read: false,
  },
  {
    id: 'n2',
    type: 'mission_completed',
    title: 'Mission Conciergerie terminée',
    text: 'Rapport et photos disponibles dans Mes missions.',
    link: '/espace-client/missions',
    date: '2026-05-15T18:20:00',
    read: false,
  },
  {
    id: 'n3',
    type: 'invoice_issued',
    title: 'Facture #FA-2026-118 émise',
    text: 'Montant 890 CHF — échéance le 11 juin 2026.',
    link: '/espace-client/factures',
    date: '2026-05-12T10:00:00',
    read: false,
  },
  {
    id: 'n4',
    type: 'mission_scheduled',
    title: 'Mission planifiée — Nettoyage bureaux',
    text: 'Vendredi 22 mai à 08:00 · Rue du Rhône 12, Genève.',
    link: '/espace-client/missions',
    date: '2026-05-10T09:30:00',
    read: true,
  },
  {
    id: 'n5',
    type: 'welcome',
    title: 'Bienvenue chez Nzo Immo Clean',
    text: 'Votre espace client est prêt. Découvrez nos prestations.',
    link: '/services',
    date: '2026-05-01T08:00:00',
    read: true,
  },
]
