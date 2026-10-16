import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faArrowLeft,
  faBuilding,
  faHelmetSafety,
  faSprayCanSparkles,
  faKey,
  faWarehouse,
  faSolarPanel,
  faSeedling,
  faPaw,
  faTree,
  faTruckRampBox,
} from '@fortawesome/free-solid-svg-icons'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, A11y } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { serviceImages } from '../../assets/images'

const services = [
  { key: 'bureaux', icon: faBuilding, image: serviceImages.bureaux, href: '/services/bureaux' },
  { key: 'apresChantier', icon: faHelmetSafety, image: serviceImages.apresChantier, href: '/services/apres-chantier' },
  { key: 'facades', icon: faSprayCanSparkles, image: serviceImages.facades, href: '/services/facades' },
  { key: 'conciergerie', icon: faKey, image: serviceImages.conciergerie, href: '/services/conciergerie' },
  { key: 'garages', icon: faWarehouse, image: serviceImages.garages, href: '/services/garages' },
  { key: 'photovoltaique', icon: faSolarPanel, image: serviceImages.photovoltaique, href: '/services/photovoltaique' },
  { key: 'arrosage', icon: faSeedling, image: serviceImages.arrosage, href: '/services/arrosage' },
  { key: 'animaux', icon: faPaw, image: serviceImages.animaux, href: '/services/animaux' },
  { key: 'jardins', icon: faTree, image: serviceImages.jardins, href: '/services/jardins' },
  { key: 'debarras', icon: faTruckRampBox, image: serviceImages.debarras, href: '/services/debarras' },
]

export default function Services() {
  const { t } = useTranslation()
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  return (
    <section className="bg-gray-50 py-16 md:py-20 lg:py-24">
      <div className="container">
        <div data-reveal className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
            <span className="h-0.5 w-4 bg-secondary-500" />
            {t('services.eyebrow')}
          </div>
          <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-primary md:text-3xl lg:text-4xl">
            {t('services.sectionTitle')}
          </h2>
          <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
            {t('services.sectionDescription')}
          </p>
        </div>

        <div className="relative mt-12">
          <button
            ref={prevRef}
            type="button"
            aria-label="Précédent"
            className="absolute -left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-lg ring-1 ring-gray-100 transition hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-primary md:flex"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-[18px] w-[18px]" />
          </button>
          <button
            ref={nextRef}
            type="button"
            aria-label="Suivant"
            className="absolute -right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-lg ring-1 ring-gray-100 transition hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-primary md:flex"
          >
            <FontAwesomeIcon icon={faArrowRight} className="h-[18px] w-[18px]" />
          </button>

          <Swiper
            modules={[Navigation, Pagination, A11y]}
            spaceBetween={24}
            slidesPerView={1.1}
            grabCursor
            pagination={{ clickable: true, el: '.services-pagination' }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current
              swiper.params.navigation.nextEl = nextRef.current
            }}
            navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 24 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
              1280: { slidesPerView: 3.2, spaceBetween: 28 },
            }}
            className="!pb-2"
          >
            {services.map(({ key, icon, image, href }) => (
              <SwiperSlide key={key} className="h-auto">
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-56 w-full overflow-hidden">
                    <img
                      src={image}
                      alt={t(`services.${key}.title`)}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-black/5">
                      <FontAwesomeIcon icon={icon} className="h-5 w-5 text-secondary" />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-bold text-primary">
                      {t(`services.${key}.title`)}
                    </h3>
                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-gray-600">
                      {t(`services.${key}.description`)}
                    </p>

                    <div className="my-5 border-t border-gray-100" />

                    <div className="mt-auto flex items-center justify-between gap-3">
                      <a
                        href={href}
                        className="inline-flex items-center gap-1 text-sm font-bold text-primary transition hover:text-secondary"
                      >
                        {t('services.discover')}
                        <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href="/devis"
                        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold text-white shadow-sm shadow-accent/30 transition hover:bg-accent-600"
                      >
                        {t('services.requestQuote')}
                        <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="services-pagination mt-6 flex justify-center gap-2" />
        </div>

        <div className="mt-12 flex justify-center">
          <a
            href="/services"
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-7 py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
          >
            {t('services.viewAll')}
            <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
