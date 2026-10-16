import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faAward,
  faHandshake,
  faLeaf,
  faShieldHalved,
  faArrowRight,
  faClipboardList,
  faCalendarCheck,
  faSprayCanSparkles,
  faCircleCheck,
  faFileShield,
  faIdCardClip,
  faStar,
  faBuilding,
  faSeedling,
  faRecycle,
  faDroplet,
  faUsers,
  faGraduationCap,
  faLocationDot,
  faPhone,
  faQuoteRight,
} from '@fortawesome/free-solid-svg-icons'
import TopBar from '../components/layout/TopBar.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import FinalCTA from '../components/sections/FinalCTA.jsx'
import { serviceImages } from '../assets/images'

const values = [
  { key: 'quality', icon: faAward, color: 'text-accent', bg: 'bg-accent/10' },
  { key: 'trust', icon: faHandshake, color: 'text-secondary', bg: 'bg-secondary/10' },
  { key: 'eco', icon: faLeaf, color: 'text-accent-600', bg: 'bg-accent/10' },
  { key: 'reliability', icon: faShieldHalved, color: 'text-secondary-600', bg: 'bg-secondary/10' },
]

const stats = ['founded', 'seat', 'cantons', 'response']

const methodSteps = [
  { key: 'quote', icon: faClipboardList },
  { key: 'schedule', icon: faCalendarCheck },
  { key: 'service', icon: faSprayCanSparkles },
  { key: 'report', icon: faCircleCheck },
]

const guarantees = [
  { key: 'insurance', icon: faFileShield },
  { key: 'declared', icon: faIdCardClip },
  { key: 'registered', icon: faBuilding },
  { key: 'satisfaction', icon: faStar },
]

const ecoItems = [
  { key: 'products', icon: faDroplet },
  { key: 'recycle', icon: faRecycle },
  { key: 'seasonal', icon: faSeedling },
]

const humanItems = [
  { key: 'training', icon: faGraduationCap },
  { key: 'stable', icon: faUsers },
  { key: 'careers', icon: faHandshake },
]

// Services are strictly limited to these two cantons.
const coverageRegions = ['bs', 'bl']

export default function About() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />

      <main>
        {/* Hero — épuré : eyebrow + titre + sous-titre + CTA + puces de confiance */}
        <section className="relative isolate overflow-hidden bg-primary-900 py-16 md:py-20 lg:py-24">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900" />
          <div className="absolute -top-32 -left-32 -z-10 h-80 w-80 rounded-full bg-secondary-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />

          <div className="container">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/85 backdrop-blur">
                  <span className="h-0.5 w-4 bg-accent" />
                  {t('about.eyebrow')}
                </div>
                <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
                  {t('about.title')}
                </h1>
                <p className="mt-4 text-sm font-medium leading-relaxed text-white/85 md:text-base">
                  {t('about.subtitle')}
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {['swiss', 'certified', 'since'].map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/90 backdrop-blur"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {t(`about.heroChips.${k}`)}
                    </span>
                  ))}
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a href="/services" className="btn-primary px-6 py-3 text-sm md:text-base">
                    {t('about.cta')}
                    <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href="/devis"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/10 md:text-base"
                  >
                    {t('about.ctaSecondary')}
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-accent/20 via-transparent to-secondary-500/20 blur-2xl" />
                <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
                  <img
                    src={serviceImages.bureaux}
                    alt=""
                    className="aspect-[5/4] w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-5 left-4 z-10 rounded-2xl bg-white px-5 py-4 shadow-xl sm:left-6 lg:-left-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {t('about.heroBadge.label')}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {t('about.heroBadge.value')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notre histoire — texte long déplacé du hero */}
        <section className="bg-white py-14 md:py-16 lg:py-20">
          <div className="container">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
              {/* Image + petit encart chiffre */}
              <div className="relative lg:col-span-5">
                <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-accent/10 via-transparent to-secondary-500/10 blur-2xl" />
                <div className="overflow-hidden rounded-3xl shadow-xl ring-1 ring-gray-100">
                  <img
                    src={serviceImages.apresChantier}
                    alt=""
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-5 right-4 z-10 rounded-2xl bg-white px-5 py-4 shadow-xl sm:right-6 lg:-right-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {t('about.story.badge.label')}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {t('about.story.badge.value')}
                  </div>
                </div>
              </div>

              {/* Texte + citation */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <span className="h-0.5 w-4 bg-primary" />
                  {t('about.story.eyebrow')}
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-primary md:text-3xl lg:text-4xl">
                  {t('about.story.title')}
                </h2>
                <div className="mt-6 space-y-5 text-sm font-medium leading-relaxed text-gray-700 md:text-base">
                  <p>{t('about.story.p1')}</p>
                  <p>{t('about.story.p2')}</p>
                </div>

                {/* Pull-quote */}
                <figure className="mt-8 rounded-2xl border-l-4 border-accent bg-accent-50/60 p-5 md:p-6">
                  <FontAwesomeIcon
                    icon={faQuoteRight}
                    className="h-5 w-5 text-accent"
                  />
                  <blockquote className="mt-3 text-sm font-semibold italic leading-relaxed text-primary md:text-base">
                    {t('about.story.quote.text')}
                  </blockquote>
                  <figcaption className="mt-3 text-[11px] font-bold uppercase tracking-wider text-accent-700">
                    — {t('about.story.quote.author')}
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-white py-14 md:py-16 lg:py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary-700">
                <span className="h-0.5 w-4 bg-secondary-500" />
                {t('about.values.eyebrow')}
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-primary md:text-3xl lg:text-4xl">
                {t('about.values.title')}
              </h2>
              <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
                {t('about.values.subtitle')}
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map(({ key, icon, color, bg }) => (
                <div
                  key={key}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                    <FontAwesomeIcon icon={icon} className={`h-5 w-5 ${color}`} />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-primary">
                    {t(`about.values.items.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-gray-600 md:text-sm">
                    {t(`about.values.items.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-primary py-14 md:py-16 text-white">
          <div className="container">
            <div className="grid grid-cols-2 gap-y-8 gap-x-4 text-center lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s}>
                  <div className="text-3xl font-bold text-accent md:text-4xl lg:text-5xl">
                    {t(`about.stats.${s}.value`)}
                  </div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/70 md:text-sm">
                    {t(`about.stats.${s}.label`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Method — 4 steps */}
        <section className="bg-white py-14 md:py-16 lg:py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-accent-700">
                <span className="h-0.5 w-4 bg-accent-500" />
                {t('about.method.eyebrow')}
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-primary md:text-3xl lg:text-4xl">
                {t('about.method.title')}
              </h2>
              <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
                {t('about.method.subtitle')}
              </p>
            </div>

            <div className="relative mt-12">
              <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent lg:block" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {methodSteps.map(({ key, icon }, i) => (
                  <div
                    key={key}
                    className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/20">
                        <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                      </span>
                      <span className="text-2xl font-bold text-accent-100">
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-primary">
                      {t(`about.method.steps.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-gray-600 md:text-sm">
                      {t(`about.method.steps.${key}.description`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Guarantees / Trust badges */}
        <section className="bg-gray-50 py-14 md:py-16 lg:py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary-700">
                <span className="h-0.5 w-4 bg-secondary-500" />
                {t('about.guarantees.eyebrow')}
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-primary md:text-3xl lg:text-4xl">
                {t('about.guarantees.title')}
              </h2>
              <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
                {t('about.guarantees.subtitle')}
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {guarantees.map(({ key, icon }) => (
                <div
                  key={key}
                  className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-700 text-white shadow-lg shadow-secondary-500/20">
                    <FontAwesomeIcon icon={icon} className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-sm font-bold text-primary">
                    {t(`about.guarantees.items.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-gray-600">
                    {t(`about.guarantees.items.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commitments — 2 columns (eco + human) */}
        <section className="bg-white py-14 md:py-16 lg:py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-accent-700">
                <span className="h-0.5 w-4 bg-accent-500" />
                {t('about.commitments.eyebrow')}
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-primary md:text-3xl lg:text-4xl">
                {t('about.commitments.title')}
              </h2>
              <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
                {t('about.commitments.subtitle')}
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {/* Ecological column */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-50 via-white to-accent-50/50 p-7 ring-1 ring-accent-100 md:p-8">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white shadow-lg shadow-accent/25">
                      <FontAwesomeIcon icon={faLeaf} className="h-5 w-5" />
                    </span>
                    <h3 className="text-xl font-bold text-primary">
                      {t('about.commitments.eco.title')}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm font-medium leading-relaxed text-gray-700">
                    {t('about.commitments.eco.description')}
                  </p>
                  <ul className="mt-6 space-y-4">
                    {ecoItems.map(({ key, icon }) => (
                      <li key={key} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-accent-700 shadow-sm ring-1 ring-accent-100">
                          <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <div className="text-sm font-bold text-primary">
                            {t(`about.commitments.eco.items.${key}.title`)}
                          </div>
                          <div className="mt-1 text-xs font-medium leading-relaxed text-gray-600">
                            {t(`about.commitments.eco.items.${key}.description`)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Human column */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary-50 via-white to-secondary-50/50 p-7 ring-1 ring-secondary-100 md:p-8">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-secondary-500/10 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-white shadow-lg shadow-secondary/25">
                      <FontAwesomeIcon icon={faUsers} className="h-5 w-5" />
                    </span>
                    <h3 className="text-xl font-bold text-primary">
                      {t('about.commitments.human.title')}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm font-medium leading-relaxed text-gray-700">
                    {t('about.commitments.human.description')}
                  </p>
                  <ul className="mt-6 space-y-4">
                    {humanItems.map(({ key, icon }) => (
                      <li key={key} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-secondary-700 shadow-sm ring-1 ring-secondary-100">
                          <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <div className="text-sm font-bold text-primary">
                            {t(`about.commitments.human.items.${key}.title`)}
                          </div>
                          <div className="mt-1 text-xs font-medium leading-relaxed text-gray-600">
                            {t(`about.commitments.human.items.${key}.description`)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage — where we operate */}
        <section className="bg-gray-50 py-14 md:py-16 lg:py-20">
          <div className="container">
            <div className="grid gap-10 lg:grid-cols-5 lg:items-center">
              <div className="lg:col-span-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <span className="h-0.5 w-4 bg-primary" />
                  {t('about.coverage.eyebrow')}
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-primary md:text-3xl lg:text-4xl">
                  {t('about.coverage.title')}
                </h2>
                <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
                  {t('about.coverage.subtitle')}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-800"
                  >
                    <FontAwesomeIcon icon={faPhone} className="h-3.5 w-3.5" />
                    {t('about.coverage.cta')}
                  </a>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {coverageRegions.map((r) => (
                    <div
                      key={r}
                      className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-700">
                        <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-sm font-bold text-primary">
                          {t(`about.coverage.regions.${r}.name`)}
                        </div>
                        <div className="mt-0.5 text-[11px] font-medium text-gray-500">
                          {t(`about.coverage.regions.${r}.cities`)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
