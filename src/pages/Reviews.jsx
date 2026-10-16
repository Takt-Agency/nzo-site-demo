import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faStar,
  faShieldHalved,
  faAward,
  faBolt,
  faLocationDot,
  faQuoteRight,
  faTableCellsLarge,
  faBuilding,
  faHelmetSafety,
  faSprayCanSparkles,
  faKey,
  faTree,
  faTruckRampBox,
  faRotateLeft,
} from '@fortawesome/free-solid-svg-icons'
import TopBar from '../components/layout/TopBar.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import FinalCTA from '../components/sections/FinalCTA.jsx'
import ReviewCard from '../components/reviews/ReviewCard.jsx'
import { usePublicReviews } from '../lib/usePublicReviews.js'

const serviceFilters = [
  { key: 'all', icon: faTableCellsLarge },
  { key: 'bureaux', icon: faBuilding },
  { key: 'apresChantier', icon: faHelmetSafety },
  { key: 'facades', icon: faSprayCanSparkles },
  { key: 'conciergerie', icon: faKey },
  { key: 'jardins', icon: faTree },
  { key: 'debarras', icon: faTruckRampBox },
]

const sortOptions = ['newest', 'oldest', 'ratingDesc', 'ratingAsc']

const ratingFilters = ['all', '5', '4', '3']

const PAGE_SIZE = 6

export default function Reviews() {
  const { t } = useTranslation()
  const [service, setService] = useState('all')
  const [rating, setRating] = useState('all')
  const [sort, setSort] = useState('newest')
  const [visible, setVisible] = useState(PAGE_SIZE)
  // Only real reviews (approved in Admin > Avis) — never mock data. With none
  // yet, the page shows "reviews soon" instead of a score.
  const { loading, reviews, stats } = usePublicReviews()
  const hasReviews = stats.total > 0

  const filtered = useMemo(() => {
    let list = reviews.filter((r) => {
      if (service !== 'all' && r.service !== service) return false
      if (rating !== 'all' && r.rating < Number(rating)) return false
      return true
    })

    switch (sort) {
      case 'oldest':
        list = [...list].sort((a, b) => new Date(a.date) - new Date(b.date))
        break
      case 'ratingDesc':
        list = [...list].sort((a, b) => b.rating - a.rating || new Date(b.date) - new Date(a.date))
        break
      case 'ratingAsc':
        list = [...list].sort((a, b) => a.rating - b.rating || new Date(b.date) - new Date(a.date))
        break
      default:
        list = [...list].sort((a, b) => new Date(b.date) - new Date(a.date))
    }
    return list
  }, [service, rating, sort, reviews])

  const shown = filtered.slice(0, visible)
  const hasMore = visible < filtered.length

  const resetFilters = () => {
    setService('all')
    setRating('all')
    setSort('newest')
    setVisible(PAGE_SIZE)
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden bg-primary-900 py-14 md:py-16 lg:py-20">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900" />
          <div className="absolute -top-32 left-1/4 -z-10 h-72 w-72 rounded-full bg-secondary-500/20 blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 text-white/5 bg-dots"
          />

          <div className="container">
            <div data-reveal className="mx-auto max-w-3xl text-center">
              <div className="eyebrow-dark">
                <span className="eyebrow-bar text-accent" />
                {t('reviews.eyebrow')}
              </div>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
                {t('reviews.title')}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-white/80 md:text-base">
                {t('reviews.subtitle')}
              </p>

              {!loading && hasReviews && (
                <div className="mt-8 inline-flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-5 backdrop-blur">
                  <div className="text-5xl font-bold leading-none text-white">
                    {stats.average.toFixed(1)}
                    <span className="text-2xl text-white/50">/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        className={`h-4 w-4 ${
                          i < Math.round(stats.average) ? 'text-yellow-400' : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-white/70">
                    {t('trust.reviewsCount', { count: stats.total })}
                  </div>
                </div>
              )}
              {!loading && !hasReviews && (
                <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white/85 backdrop-blur">
                  <FontAwesomeIcon icon={faStar} className="h-3.5 w-3.5 text-white/40" />
                  {t('trust.reviewsSoon')}
                </div>
              )}
            </div>

          </div>
        </section>

        <section className="bg-gray-50 py-12 md:py-14 lg:py-16">
          <div className="container">
            {loading ? null : !hasReviews ? (
              <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent-700">
                  <FontAwesomeIcon icon={faQuoteRight} className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-lg font-bold text-primary">{t('trust.reviewsSoon')}</h2>
                <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-gray-500">
                  {t('reviews.empty.text')}
                </p>
              </div>
            ) : (
            <>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-secondary-700">
                  {t('reviews.filterByService')}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    aria-label={t('reviews.filterByRating')}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-primary transition focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    {ratingFilters.map((r) => (
                      <option key={r} value={r}>
                        {t(`reviews.ratings.${r}`)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label={t('reviews.sort')}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-primary transition focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    {sortOptions.map((s) => (
                      <option key={s} value={s}>
                        {t(`reviews.sortOptions.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {serviceFilters.map(({ key, icon }) => {
                  const active = service === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setService(key)}
                      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                        active
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'bg-gray-100 text-gray-600 hover:bg-secondary-50 hover:text-secondary-700'
                      }`}
                    >
                      <FontAwesomeIcon icon={icon} className="h-3 w-3" />
                      {key === 'all'
                        ? t('reviews.allServices')
                        : t(`services.${key}.title`)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-gray-500">
              <span>{t('reviews.resultsCount', { count: filtered.length })}</span>
              {(service !== 'all' || rating !== 'all' || sort !== 'newest') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-secondary transition hover:text-secondary-700"
                >
                  <FontAwesomeIcon icon={faRotateLeft} className="h-3 w-3" />
                  {t('reviews.resetFilters')}
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="mt-12 flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <FontAwesomeIcon icon={faQuoteRight} className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-bold text-primary">
                  {t('reviews.noResults.title')}
                </h3>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  {t('reviews.noResults.text')}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {shown.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="btn-ghost px-7 py-3 text-sm"
                    >
                      {t('reviews.loadMore')}
                    </button>
                  </div>
                )}
              </>
            )}
            </>
            )}
          </div>
        </section>

        {/* Stats moved here from the hero — at the bottom of the page so
            visitors first see the actual reviews, then the headline numbers. */}
        <section className="bg-white py-12 md:py-14">
          <div className="container">
            <ul
              data-reveal
              className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4"
            >
              {[
                {
                  icon: faStar,
                  // Real average only; no approved reviews -> "reviews soon".
                  value: loading
                    ? '…'
                    : hasReviews
                      ? `${stats.average.toFixed(1)}/5`
                      : t('trust.reviewsSoon'),
                  label: t('reviews.stats.rating.label'),
                  color: 'text-yellow-500',
                  bg: 'bg-yellow-50',
                },
                {
                  icon: faLocationDot,
                  value: t('hero.foundedCity'),
                  label: t('hero.foundedShort'),
                  color: 'text-secondary',
                  bg: 'bg-secondary-50',
                },
                {
                  icon: faBolt,
                  value: t('finalCta.trust.response.value'),
                  label: t('finalCta.trust.response.label'),
                  color: 'text-accent-700',
                  bg: 'bg-accent/10',
                },
                {
                  icon: faAward,
                  value: t('reviews.stats.experience.value'),
                  label: t('reviews.stats.experience.label'),
                  color: 'text-primary',
                  bg: 'bg-primary/10',
                },
              ].map(({ icon, value, label, color, bg }, i) => (
                <li
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md md:p-6"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}
                  >
                    <FontAwesomeIcon icon={icon} className={`h-4 w-4 ${color}`} />
                  </span>
                  <div className="text-2xl font-bold text-primary md:text-3xl">{value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {label}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Global score breakdown — only meaningful with real reviews. */}
        {hasReviews && (
        <section className="bg-white pb-14 pt-2 md:pb-16">
          <div className="container">
            <div
              data-reveal
              className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 p-8 text-white shadow-xl md:p-12"
            >
              {/* Decorative blurs */}
              <div className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 -z-10 h-72 w-72 rounded-full bg-secondary-500/20 blur-3xl" />

              <div className="grid items-center gap-8 md:grid-cols-[1fr_auto] md:gap-12">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
                    <FontAwesomeIcon icon={faShieldHalved} className="h-2.5 w-2.5 text-accent" />
                    Note globale
                  </div>
                  <h2 className="mt-3 text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
                    La satisfaction de nos clients en un chiffre
                  </h2>
                  <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-white/75 md:text-base">
                    Moyenne calculée sur l'ensemble des avis vérifiés et publiés sur le site —
                    chacun est laissé par un client après une mission effectuée.
                  </p>

                  {/* Breakdown by rating */}
                  <ul className="mt-6 max-w-md space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((r) => Math.round(r.rating) === star).length
                      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                      return (
                        <li key={star} className="flex items-center gap-3 text-xs font-medium">
                          <span className="inline-flex w-10 shrink-0 items-center gap-1 text-white/85">
                            {star}
                            <FontAwesomeIcon icon={faStar} className="h-2.5 w-2.5 text-yellow-400" />
                          </span>
                          <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <span
                              className="absolute inset-y-0 left-0 rounded-full bg-yellow-400 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          <span className="w-12 shrink-0 text-right text-white/70">
                            {count > 0 ? `${count}` : '0'}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* Big average score */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 -z-10 rounded-full bg-accent/15 blur-3xl" />
                  <div className="relative flex h-56 w-56 flex-col items-center justify-center rounded-full bg-white/10 ring-4 ring-white/20 backdrop-blur-sm md:h-60 md:w-60">
                    <div className="flex items-baseline gap-1 text-white">
                      <span className="text-5xl font-bold leading-none md:text-6xl">
                        {stats.average.toFixed(1)}
                      </span>
                      <span className="text-xl font-bold text-white/70">/5</span>
                    </div>
                    <div className="mt-2 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const filled = i < Math.round(stats.average)
                        return (
                          <FontAwesomeIcon
                            key={i}
                            icon={faStar}
                            className={`h-4 w-4 ${filled ? 'text-yellow-400' : 'text-white/20'}`}
                          />
                        )
                      })}
                    </div>
                    <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
                      {t('trust.reviewsCount', { count: stats.total })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
