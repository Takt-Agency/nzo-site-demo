import { REVIEWS_ENABLED } from '../lib/usePublicReviews.js'

// "Avis clients" link — hidden while REVIEWS_ENABLED is false.
const reviewsLink = REVIEWS_ENABLED ? [{ key: 'avis', href: '/avis' }] : []

export const navLinks = [
  { key: 'accueil', href: '/' },
  {
    key: 'services',
    href: '/services',
    hasDropdown: true,
    children: [
      { key: 'bureaux', href: '/services/bureaux' },
      { key: 'apresChantier', href: '/services/apres-chantier' },
      { key: 'facades', href: '/services/facades' },
      { key: 'conciergerie', href: '/services/conciergerie' },
      { key: 'garages', href: '/services/garages' },
      { key: 'photovoltaique', href: '/services/photovoltaique' },
      { key: 'arrosage', href: '/services/arrosage' },
      { key: 'animaux', href: '/services/animaux' },
      { key: 'jardins', href: '/services/jardins' },
      { key: 'debarras', href: '/services/debarras' },
    ],
  },
  { key: 'apropos', href: '/a-propos' },
  { key: 'boutique', href: '/boutique' },
  ...reviewsLink,
  { key: 'contact', href: '/contact' },
]

export const contactInfo = {
  phone: '+41 79 936 21 73',
  phoneTel: '+41799362173',
  email: 'info@nzoimmoclean.ch',
  website: 'www.nzoimmoclean.ch',
  whatsapp: '+41799362173',
  address: {
    line1: 'Gellertpark 6',
    line2: '4052 Basel, Suisse',
    // Full address used in Google Maps URLs — the string is geocoded server-
    // side, which is more reliable than routing by lat/lng (Google can nudge
    // to the correct building entrance instead of a bare coord).
    full: 'Gellertpark 6, 4052 Basel, Suisse',
  },
  // Precise coordinates of Gellertpark 6, Basel — verified against OSM /
  // Swisstopo. Kept for the Leaflet marker + map centre.
  coordinates: { lat: 47.5487, lng: 7.6103 },
  hours: 'Lun–Ven 8:00–17:00',
}

export const socialLinks = [
  { key: 'facebook', href: 'https://facebook.com', label: 'Facebook' },
  { key: 'instagram', href: 'https://instagram.com', label: 'Instagram' },
  { key: 'linkedin', href: 'https://linkedin.com', label: 'LinkedIn' },
  { key: 'whatsapp', href: 'https://wa.me/41799362173', label: 'WhatsApp' },
]

export const footerUsefulLinks = [
  { key: 'apropos', href: '/a-propos' },
  { key: 'boutique', href: '/boutique' },
  ...reviewsLink,
  { key: 'contact', href: '/contact' },
  { key: 'devis', href: '/devis' },
  { key: 'espace', href: '/espace-client' },
]

export const footerLegalLinks = [
  { key: 'mentions', href: '/mentions-legales' },
  { key: 'privacy', href: '/confidentialite' },
  { key: 'cgv', href: '/cgv' },
  { key: 'cookies', href: '/cookies' },
]
