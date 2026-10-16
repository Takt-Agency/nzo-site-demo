import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFilePen,
  faMagnifyingGlass,
  faFileSignature,
  faCalendarCheck,
  faSprayCanSparkles,
  faAward,
} from '@fortawesome/free-solid-svg-icons'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, A11y } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const steps = [
  { key: 'devis', icon: faFilePen },
  { key: 'analyse', icon: faMagnifyingGlass },
  { key: 'validation', icon: faFileSignature },
  { key: 'planification', icon: faCalendarCheck },
  { key: 'intervention', icon: faSprayCanSparkles },
  { key: 'controle', icon: faAward },
]

function StepBadge({ icon, index }) {
  return (
    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg shadow-secondary/10 ring-4 ring-gray-50">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-secondary-700 text-white shadow-inner">
        <FontAwesomeIcon icon={icon} className="h-5 w-5" />
      </span>
      <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
        {String(index + 1).padStart(2, '0')}
      </span>
    </div>
  )
}

export default function Process() {
  const { t } = useTranslation()
  const total = steps.length

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-white via-white to-gray-50/70 py-14 md:py-16 lg:py-20">
      <div className="absolute -top-32 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary-100/40 blur-3xl" />
      <div className="absolute -bottom-32 right-0 -z-10 h-72 w-72 rounded-full bg-accent-100/40 blur-3xl" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(23, 65, 113) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="container">
        <div data-reveal className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-700">
            <span className="h-0.5 w-4 bg-accent-500" />
            {t('process.eyebrow')}
          </div>
          <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-primary md:text-3xl lg:text-4xl">
            {t('process.sectionTitle')}
          </h2>
          <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
            {t('process.sectionDescription')}
          </p>
        </div>

        <ol
          data-reveal
          className="mt-12 hidden md:mt-16 md:grid md:grid-cols-6 md:gap-4"
        >
          {steps.map(({ key, icon }, i) => {
            const isFirst = i === 0
            const isLast = i === total - 1
            return (
              <li
                key={key}
                className="relative flex flex-col items-center text-center"
              >
                <div className="pointer-events-none absolute top-7 left-0 right-0 flex h-0.5">
                  <span
                    className={`h-full flex-1 rounded-full ${
                      isFirst ? 'invisible' : 'bg-gradient-to-r from-secondary-200 via-secondary to-secondary'
                    }`}
                  />
                  <span
                    className={`h-full flex-1 rounded-full ${
                      isLast ? 'invisible' : 'bg-gradient-to-r from-secondary via-secondary to-secondary-200'
                    }`}
                  />
                </div>

                <StepBadge icon={icon} index={i} />

                <h3 className="relative mt-5 text-sm font-bold text-primary md:text-base">
                  {t(`process.steps.${key}.title`)}
                </h3>
                <p className="relative mt-1.5 max-w-[220px] text-xs font-medium leading-relaxed text-gray-600 md:text-[13px]">
                  {t(`process.steps.${key}.description`)}
                </p>
              </li>
            )
          })}
        </ol>

        <div className="mt-10 md:hidden">
          <Swiper
            modules={[Pagination, A11y]}
            spaceBetween={16}
            slidesPerView={1.15}
            centeredSlides
            grabCursor
            pagination={{ clickable: true, el: '.process-mobile-pagination' }}
            breakpoints={{
              480: { slidesPerView: 1.6, centeredSlides: true, spaceBetween: 16 },
              640: { slidesPerView: 2.2, centeredSlides: false, spaceBetween: 20 },
            }}
            className="!pb-2"
          >
            {steps.map(({ key, icon }, i) => (
              <SwiperSlide key={key} className="h-auto">
                <article className="relative flex h-full flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
                  <StepBadge icon={icon} index={i} />

                  <h3 className="mt-5 text-base font-bold text-primary">
                    {t(`process.steps.${key}.title`)}
                  </h3>
                  <p className="mt-1.5 text-sm font-medium leading-relaxed text-gray-600">
                    {t(`process.steps.${key}.description`)}
                  </p>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="process-mobile-pagination mt-5 flex justify-center gap-2" />
        </div>
      </div>
    </section>
  )
}
