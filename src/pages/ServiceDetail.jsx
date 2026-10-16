import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faChevronRight,
  faCircleCheck,
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
import FinalCTA from '../components/sections/FinalCTA.jsx'
import { serviceImages } from '../assets/images'

const serviceMap = {
  bureaux: { key: 'bureaux', icon: faBuilding, image: serviceImages.bureaux },
  'apres-chantier': { key: 'apresChantier', icon: faHelmetSafety, image: serviceImages.apresChantier },
  facades: { key: 'facades', icon: faSprayCanSparkles, image: serviceImages.facades },
  conciergerie: { key: 'conciergerie', icon: faKey, image: serviceImages.conciergerie },
  garages: { key: 'garages', icon: faWarehouse, image: serviceImages.garages },
  photovoltaique: { key: 'photovoltaique', icon: faSolarPanel, image: serviceImages.photovoltaique },
  arrosage: { key: 'arrosage', icon: faSeedling, image: serviceImages.arrosage },
  animaux: { key: 'animaux', icon: faPaw, image: serviceImages.animaux },
  jardins: { key: 'jardins', icon: faTree, image: serviceImages.jardins },
  debarras: { key: 'debarras', icon: faTruckRampBox, image: serviceImages.debarras },
}

const allServices = [
  { slug: 'bureaux', key: 'bureaux', icon: faBuilding, image: serviceImages.bureaux },
  { slug: 'apres-chantier', key: 'apresChantier', icon: faHelmetSafety, image: serviceImages.apresChantier },
  { slug: 'facades', key: 'facades', icon: faSprayCanSparkles, image: serviceImages.facades },
  { slug: 'conciergerie', key: 'conciergerie', icon: faKey, image: serviceImages.conciergerie },
  { slug: 'garages', key: 'garages', icon: faWarehouse, image: serviceImages.garages },
  { slug: 'photovoltaique', key: 'photovoltaique', icon: faSolarPanel, image: serviceImages.photovoltaique },
  { slug: 'arrosage', key: 'arrosage', icon: faSeedling, image: serviceImages.arrosage },
  { slug: 'animaux', key: 'animaux', icon: faPaw, image: serviceImages.animaux },
  { slug: 'jardins', key: 'jardins', icon: faTree, image: serviceImages.jardins },
  { slug: 'debarras', key: 'debarras', icon: faTruckRampBox, image: serviceImages.debarras },
]

export default function ServiceDetail() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const service = serviceMap[slug]

  if (!service) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar />
        <Navbar />
        <main className="container py-24 text-center">
          <h1 className="text-2xl font-bold text-primary">{t('serviceDetail.notFound')}</h1>
          <Link to="/services" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-secondary hover:underline">
            {t('serviceDetail.backToServices')}
            <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const { key, icon, image } = service
  const includes = t(`services.${key}.includes`, { returnObjects: true })
  const audience = t(`services.${key}.audience`, { returnObjects: true })
  const related = allServices.filter((s) => s.key !== key).slice(0, 3)

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden">
          <img
            src={image}
            alt={t(`services.${key}.title`)}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-900/95 via-primary-900/80 to-primary-900/40" />

          <div className="container py-16 md:py-20 lg:py-24">
            <nav className="flex items-center gap-2 text-xs font-semibold text-white/70">
              <Link to="/" className="transition hover:text-white">
                {t('nav.accueil')}
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5" />
              <Link to="/services" className="transition hover:text-white">
                {t('nav.services')}
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5" />
              <span className="text-white">{t(`services.${key}.title`)}</span>
            </nav>

            <div className="mt-6 max-w-2xl">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/30">
                <FontAwesomeIcon icon={icon} className="h-6 w-6" />
              </span>
              <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
                {t(`services.${key}.title`)}
              </h1>
              <p className="mt-4 text-sm font-medium leading-relaxed text-white/85 md:text-base">
                {t(`services.${key}.tagline`)}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <a href="/devis" className="btn-primary px-6 py-3 text-sm md:text-base">
                  {t('serviceDetail.requestQuote')}
                  <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
                </a>
                <a href="/contact" className="btn-outline px-6 py-3 text-sm md:text-base">
                  {t('serviceDetail.contactUs')}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 md:py-16 lg:py-20">
          <div className="container">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary-700">
                  <span className="h-0.5 w-4 bg-secondary-500" />
                  {t('serviceDetail.overviewEyebrow')}
                </div>
                <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-primary md:text-3xl">
                  {t(`services.${key}.overviewTitle`)}
                </h2>
                <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
                  {t(`services.${key}.longDescription`)}
                </p>

                <h3 className="mt-8 text-base font-bold text-primary md:text-lg">
                  {t('serviceDetail.audienceTitle')}
                </h3>
                <ul className="mt-3 space-y-2">
                  {Array.isArray(audience) &&
                    audience.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-gray-50 p-7 shadow-sm ring-1 ring-gray-100 md:p-9">
                <h3 className="text-base font-bold text-primary md:text-lg">
                  {t('serviceDetail.includesTitle')}
                </h3>
                <p className="mt-1 text-xs font-medium text-gray-500 md:text-sm">
                  {t('serviceDetail.includesSubtitle')}
                </p>
                <ul className="mt-5 space-y-3">
                  {Array.isArray(includes) &&
                    includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                          <FontAwesomeIcon icon={faCircleCheck} className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm font-medium leading-relaxed text-gray-700">
                          {item}
                        </span>
                      </li>
                    ))}
                </ul>

                <a
                  href="/devis"
                  className="btn-primary mt-7 w-full px-6 py-3 text-sm md:text-base"
                >
                  {t('serviceDetail.requestQuote')}
                  <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-14 md:py-16 lg:py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-accent-700">
                <span className="h-0.5 w-4 bg-accent-500" />
                {t('serviceDetail.relatedEyebrow')}
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-primary md:text-3xl">
                {t('serviceDetail.relatedTitle')}
              </h2>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map(({ slug: rSlug, key: rKey, icon: rIcon, image: rImage }) => (
                <a
                  key={rKey}
                  href={`/services/${rSlug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={rImage}
                      alt={t(`services.${rKey}.title`)}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md">
                      <FontAwesomeIcon icon={rIcon} className="h-4 w-4 text-secondary" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-primary group-hover:text-secondary">
                      {t(`services.${rKey}.title`)}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-gray-600">
                      {t(`services.${rKey}.description`)}
                    </p>
                  </div>
                </a>
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
