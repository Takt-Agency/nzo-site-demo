import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faPhone,
  faClock,
  faStar,
  faShieldHalved,
  faBolt,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { contactInfo } from '../../data/navigation.js'
import { REVIEWS_ENABLED, usePublicReviews } from '../../lib/usePublicReviews.js'

export default function FinalCTA() {
  const { t } = useTranslation()
  const whatsappUrl = `https://wa.me/${contactInfo.whatsapp.replace(/[^\d]/g, '')}`
  // Rating comes from real approved reviews only; none yet -> "reviews soon".
  const { loading, stats } = usePublicReviews()
  const ratingValue = loading
    ? '…'
    : stats.total > 0
      ? `${stats.average.toFixed(1)}/5`
      : t('trust.reviewsSoon')
  const trustItems = [
    { icon: faBolt, value: t('finalCta.trust.response.value'), label: t('finalCta.trust.response.label') },
    // Reviews hidden for now -> show the service area (BS · BL) instead.
    REVIEWS_ENABLED
      ? { icon: faStar, value: ratingValue, label: t('finalCta.trust.rating.label') }
      : { icon: faLocationDot, value: 'BS · BL', label: t('about.stats.cantons.label') },
    { icon: faShieldHalved, value: t('finalCta.trust.guarantee.value'), label: t('finalCta.trust.guarantee.label') },
  ]

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-14 md:py-16 lg:py-20">
      <div className="container">
        <div data-reveal className="relative isolate overflow-hidden rounded-[2rem] bg-primary-900 px-6 py-12 shadow-2xl shadow-primary-900/20 md:px-10 md:py-14 lg:px-14 lg:py-16">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900" />
          <div className="absolute -top-40 -left-20 -z-10 h-72 w-72 rounded-full bg-secondary-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 -z-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-[0.06]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/90 backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                {t('finalCta.eyebrow')}
              </div>

              <h2 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl lg:text-4xl">
                {t('finalCta.title')}
              </h2>
              <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-white/75 md:text-base">
                {t('finalCta.description')}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <a href="/devis" className="btn-primary px-7 py-3.5 text-sm md:text-base">
                  {t('finalCta.ctaPrimary')}
                  <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-[#25D366]/30 transition hover:bg-[#1ebd5c] md:text-base"
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-white/80 md:text-sm">
                <a
                  href={`tel:${contactInfo.phoneTel}`}
                  className="flex items-center gap-2 transition hover:text-accent"
                >
                  <FontAwesomeIcon icon={faPhone} className="h-3 w-3 text-accent" />
                  {contactInfo.phone}
                </a>
                <span className="h-3 w-px bg-white/20" />
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="h-3 w-3 text-accent" />
                  {contactInfo.hours}
                </span>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {trustItems.map(({ icon, value, label }) => (
                <li
                  key={label}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:border-accent/50 hover:bg-white/[0.08]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent transition group-hover:bg-accent group-hover:text-white">
                    <FontAwesomeIcon icon={icon} className="h-5 w-5" />
                  </span>
                  <div className="leading-tight">
                    <div className="text-base font-bold text-white md:text-lg">
                      {value}
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                      {label}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
