import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faFileLines,
  faShieldHalved,
  faFileContract,
  faCookieBite,
  faClock,
} from '@fortawesome/free-solid-svg-icons'
import TopBar from '../../components/layout/TopBar.jsx'
import Navbar from '../../components/layout/Navbar.jsx'
import Footer from '../../components/layout/Footer.jsx'

const pageIcons = {
  mentions: faFileLines,
  privacy: faShieldHalved,
  cgv: faFileContract,
  cookies: faCookieBite,
}

export default function LegalPage({ pageKey }) {
  const { t } = useTranslation()
  const base = `legal.${pageKey}`
  const sections = t(`${base}.sections`, { returnObjects: true })
  const safeSections = Array.isArray(sections) ? sections : []
  const icon = pageIcons[pageKey] || faFileLines

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <Navbar />

      <main className="py-10 md:py-14 lg:py-16">
        <div className="container max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
            {t('legal.backHome')}
          </Link>

          <header className="mt-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary-700">
              <FontAwesomeIcon icon={icon} className="h-3 w-3" />
              {t(`${base}.eyebrow`)}
            </div>
            <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-primary md:text-3xl lg:text-4xl">
              {t(`${base}.title`)}
            </h1>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
              {t(`${base}.lastUpdate`)}
            </div>
          </header>

          <article className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-10">
            <p className="text-sm font-medium leading-relaxed text-gray-700 md:text-base">
              {t(`${base}.intro`)}
            </p>

            <div className="mt-8 space-y-7">
              {safeSections.map((section, i) => (
                <section key={i}>
                  <h2 className="text-base font-bold text-primary md:text-lg">
                    {section.title}
                  </h2>
                  <div className="mt-2 space-y-3 text-sm font-medium leading-relaxed text-gray-600 md:text-[15px]">
                    {Array.isArray(section.body) ? (
                      section.body.map((paragraph, j) => <p key={j}>{paragraph}</p>)
                    ) : (
                      <p>{section.body}</p>
                    )}
                    {Array.isArray(section.list) && (
                      <ul className="ml-1 list-disc space-y-1.5 pl-5">
                        {section.list.map((item, k) => (
                          <li key={k}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-secondary-100 bg-secondary-50/40 p-4 md:p-5">
              <div className="text-sm font-bold text-primary">
                {t('legal.contactBox.title')}
              </div>
              <p className="mt-1 text-xs font-medium text-gray-600 md:text-sm">
                {t('legal.contactBox.text')}
              </p>
              <Link
                to="/contact"
                className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-secondary transition hover:text-secondary-700"
              >
                {t('legal.contactBox.cta')}
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}
