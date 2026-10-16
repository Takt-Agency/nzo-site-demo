import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
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
import TopBar from '../components/layout/TopBar.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import FeaturesBar from '../components/sections/FeaturesBar.jsx'
import FinalCTA from '../components/sections/FinalCTA.jsx'
import { serviceImages } from '../assets/images'

const services = [
  { key: 'bureaux', icon: faBuilding, image: serviceImages.bureaux, slug: 'bureaux' },
  { key: 'apresChantier', icon: faHelmetSafety, image: serviceImages.apresChantier, slug: 'apres-chantier' },
  { key: 'facades', icon: faSprayCanSparkles, image: serviceImages.facades, slug: 'facades' },
  { key: 'conciergerie', icon: faKey, image: serviceImages.conciergerie, slug: 'conciergerie' },
  { key: 'garages', icon: faWarehouse, image: serviceImages.garages, slug: 'garages' },
  { key: 'photovoltaique', icon: faSolarPanel, image: serviceImages.photovoltaique, slug: 'photovoltaique' },
  { key: 'arrosage', icon: faSeedling, image: serviceImages.arrosage, slug: 'arrosage' },
  { key: 'animaux', icon: faPaw, image: serviceImages.animaux, slug: 'animaux' },
  { key: 'jardins', icon: faTree, image: serviceImages.jardins, slug: 'jardins' },
  { key: 'debarras', icon: faTruckRampBox, image: serviceImages.debarras, slug: 'debarras' },
]

export default function Services() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden bg-primary-900 py-16 md:py-20 lg:py-24">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900" />
          <div className="absolute -top-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-secondary-500/20 blur-3xl" />
          <div className="absolute -bottom-32 right-1/3 -z-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/85 backdrop-blur">
                <span className="h-0.5 w-4 bg-accent" />
                {t('servicesPage.eyebrow')}
              </div>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
                {t('servicesPage.title')}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/80 md:text-base">
                {t('servicesPage.description')}
              </p>
            </div>
          </div>
        </section>

        <FeaturesBar />

        <section className="bg-gray-50 py-14 md:py-16 lg:py-20">
          <div className="container">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map(({ key, icon, image, slug }) => (
                <article
                  key={key}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-52 w-full overflow-hidden">
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
                    <h2 className="text-base font-bold text-primary">
                      {t(`services.${key}.title`)}
                    </h2>
                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-gray-600 md:text-sm">
                      {t(`services.${key}.tagline`)}
                    </p>

                    <div className="my-4 border-t border-gray-100" />

                    <div className="mt-auto flex items-center justify-between gap-3">
                      <a
                        href={`/services/${slug}`}
                        className="inline-flex items-center gap-1 text-sm font-bold text-primary transition hover:text-secondary"
                      >
                        {t('services.discover')}
                        <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                      </a>
                      <a
                        href="/devis"
                        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-accent/30 transition hover:bg-accent-600"
                      >
                        {t('services.requestQuote')}
                        <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
