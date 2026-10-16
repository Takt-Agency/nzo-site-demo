import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBagShopping,
  faLeaf,
  faTruck,
  faRotateLeft,
  faBell,
  faArrowRight,
  faClock,
  faSprayCanSparkles,
} from '@fortawesome/free-solid-svg-icons'
import TopBar from '../components/layout/TopBar.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import Footer from '../components/layout/Footer.jsx'

// The shop is intentionally disabled while the backend / fulfilment side is
// still being wired. We keep the public layout (topbar, navbar, footer) so
// visitors don't lose context — only the catalog body is replaced by a
// branded "coming soon" panel.
const trustItems = [
  { icon: faTruck, label: 'Livraison rapide', hint: 'En Suisse sous 48 h' },
  { icon: faLeaf, label: 'Produits écologiques', hint: 'Biodégradables et certifiés' },
  { icon: faRotateLeft, label: 'Retours 14 jours', hint: 'Satisfait ou remboursé' },
]

export default function Shop() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-primary-900 py-14 md:py-16 lg:py-20">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900" />
          <div className="absolute -top-32 left-1/4 -z-10 h-72 w-72 rounded-full bg-secondary-500/20 blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />

          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/85 backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                {t('shop.eyebrow', { defaultValue: 'BOUTIQUE EN LIGNE' })}
              </div>
              <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl lg:text-4xl">
                {t('shop.title', { defaultValue: 'Nos produits de nettoyage' })}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-white/80 md:text-base">
                {t('shop.subtitle', {
                  defaultValue:
                    "Sélection professionnelle pour entretenir vos espaces au quotidien — écologique et efficace.",
                })}
              </p>
            </div>
          </div>
        </section>

        {/* Coming soon panel */}
        <section className="bg-gray-50 py-12 md:py-16 lg:py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-100">
              {/* Decorative top stripe */}
              <div className="relative h-3 overflow-hidden bg-gradient-to-r from-primary-700 via-secondary-700 to-accent">
                <div className="absolute inset-0 animate-pulse opacity-50" />
              </div>

              <div className="px-6 py-10 text-center md:px-12 md:py-14">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-700 text-white shadow-lg shadow-accent/30">
                  <FontAwesomeIcon icon={faBagShopping} className="h-8 w-8" />
                </div>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-700">
                  <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                  Bientôt disponible
                </div>

                <h2 className="mt-4 text-2xl font-bold tracking-tight text-primary md:text-3xl">
                  Notre boutique ouvre très prochainement
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed text-gray-600 md:text-base">
                  Nous préparons une sélection de produits de nettoyage professionnels,
                  écologiques et certifiés — livrés directement chez vous partout en Suisse.
                  Revenez très bientôt pour découvrir notre catalogue complet.
                </p>

                {/* Trust badges */}
                <ul className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                  {trustItems.map(({ icon, label, hint }) => (
                    <li
                      key={label}
                      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3 text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-700">
                        <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                      </span>
                      <div className="leading-tight">
                        <div className="text-xs font-bold text-primary">{label}</div>
                        <div className="text-[11px] font-medium text-gray-500">{hint}</div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* CTAs */}
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    to="/devis"
                    className="btn-primary px-6 py-3 text-sm"
                  >
                    <FontAwesomeIcon icon={faSprayCanSparkles} className="h-3 w-3" />
                    Demander un devis service
                    <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-primary hover:text-primary"
                  >
                    <FontAwesomeIcon icon={faBell} className="h-3 w-3" />
                    Être averti à l'ouverture
                  </Link>
                </div>

                <div className="mt-8 text-[11px] font-medium text-gray-400">
                  En attendant, découvrez nos services de nettoyage professionnel partout en
                  Suisse.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
