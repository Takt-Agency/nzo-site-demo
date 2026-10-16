import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faStar, faCircleCheck, faWandMagicSparkles, faLocationDot } from '@fortawesome/free-solid-svg-icons'
import { serviceImages } from '../../assets/images'
import { REVIEWS_ENABLED, usePublicReviews } from '../../lib/usePublicReviews.js'

export default function Hero() {
  const { t } = useTranslation()
  // Real approved reviews only — no rating is shown until clients leave some.
  const { loading, stats } = usePublicReviews()
  const hasReviews = stats.total > 0

  return (
    <section className="relative isolate overflow-hidden bg-primary-900">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900" />
      <div className="absolute -top-32 -left-32 -z-10 h-96 w-96 rounded-full bg-secondary-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-3xl" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="container py-16 md:py-20 lg:py-28">
        <div className="grid items-stretch gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div data-reveal className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 backdrop-blur">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                {t('hero.highlight')}
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-bold leading-[1.1] tracking-tight text-white first-letter:uppercase md:text-3xl lg:text-4xl xl:text-5xl">
              {t('hero.title')}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm font-medium leading-relaxed text-white/80 md:text-base lg:mx-0">
              {t('hero.description')}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start">
              <a href="/devis" className="btn-primary px-6 py-3 text-sm md:text-base">
                {t('hero.ctaPrimary')}
                <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
              </a>
              <a href="/services" className="btn-outline px-6 py-3 text-sm md:text-base">
                {t('hero.ctaSecondary')}
                <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/95 lg:justify-start">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleCheck} className="h-[18px] w-[18px] text-accent" />
                <span className="font-semibold">{t('hero.founded')}</span>
              </div>
              {REVIEWS_ENABLED && !loading && (
                <>
                  <span className="hidden h-4 w-px bg-white/20 sm:block" />
                  {hasReviews ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FontAwesomeIcon
                            key={i}
                            icon={faStar}
                            className={`h-4 w-4 ${i < Math.round(stats.average) ? 'text-yellow-400' : 'text-white/20'}`}
                          />
                        ))}
                      </div>
                      <span className="font-bold">{stats.average.toFixed(1)}/5</span>
                      <span className="text-white/70">
                        {t('trust.reviewsCount', { count: stats.total })}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faStar} className="h-4 w-4 text-white/40" />
                      <span className="text-white/70">{t('trust.reviewsSoon')}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div data-reveal className="relative mx-auto w-full max-w-md lg:max-w-none lg:h-full"
            style={{ transitionDelay: '120ms' }}
          >
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-accent/30 via-secondary-500/20 to-tertiary-500/30 blur-2xl" />

            <div className="absolute -top-4 -right-4 z-10 hidden h-24 w-24 rotate-12 rounded-2xl border border-white/10 bg-white/5 backdrop-blur sm:block" />
            <div className="absolute -bottom-6 -left-6 z-10 hidden h-32 w-32 -rotate-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur sm:block" />

            <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10 lg:h-full">
              <img
                src={serviceImages.facades}
                alt="Façades"
                className="aspect-[4/5] w-full object-cover lg:aspect-auto lg:h-full"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 via-transparent to-transparent" />
            </div>

            {hasReviews && (
              <div className="absolute left-4 top-6 z-20 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:left-6 lg:-left-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
                  <FontAwesomeIcon icon={faStar} className="h-[18px] w-[18px] text-accent" />
                </div>
                <div className="leading-tight">
                  <div className="text-lg font-bold text-primary-900">{stats.average.toFixed(1)}/5</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {t('trust.reviewsCount', { count: stats.total })}
                  </div>
                </div>
              </div>
            )}

            <div className="absolute -bottom-4 right-4 z-20 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:right-6 lg:-right-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100">
                <FontAwesomeIcon icon={faLocationDot} className="h-5 w-5 text-secondary-600" />
              </div>
              <div className="leading-tight">
                <div className="text-lg font-bold text-primary-900">{t('hero.foundedCity')}</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {t('hero.foundedShort')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
