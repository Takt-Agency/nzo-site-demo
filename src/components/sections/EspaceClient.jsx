import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faArrowRight,
  faBuilding,
  faSprayCanSparkles,
  faKey,
  faBell,
  faArrowTrendUp,
} from '@fortawesome/free-solid-svg-icons'

const features = ['realtime', 'notifications', 'photos', 'documents']

const missions = [
  {
    icon: faBuilding,
    titleKey: 'homeEspace.missions.bureaux.title',
    cityKey: 'homeEspace.missions.bureaux.city',
    statusKey: 'homeEspace.status.inProgress',
    statusColor: 'bg-secondary-100 text-secondary-700',
    progress: 65,
    progressColor: 'bg-secondary',
  },
  {
    icon: faSprayCanSparkles,
    titleKey: 'homeEspace.missions.facades.title',
    cityKey: 'homeEspace.missions.facades.city',
    statusKey: 'homeEspace.status.planned',
    statusColor: 'bg-gray-100 text-gray-600',
    progress: 15,
    progressColor: 'bg-gray-300',
  },
  {
    icon: faKey,
    titleKey: 'homeEspace.missions.conciergerie.title',
    cityKey: 'homeEspace.missions.conciergerie.city',
    statusKey: 'homeEspace.status.done',
    statusColor: 'bg-accent-50 text-accent-700',
    progress: 100,
    progressColor: 'bg-accent',
  },
]

export default function EspaceClient() {
  const { t } = useTranslation()

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-gray-50 to-white py-14 md:py-16 lg:py-20">
      <div className="absolute -top-32 right-0 -z-10 h-72 w-72 rounded-full bg-secondary-100/60 blur-3xl" />

      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div data-reveal>
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary-700">
              <span className="h-0.5 w-4 bg-secondary-500" />
              {t('homeEspace.eyebrow')}
            </div>
            <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-primary md:text-3xl lg:text-4xl">
              {t('homeEspace.title')}
            </h2>
            <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
              {t('homeEspace.description')}
            </p>

            <ul className="mt-7 space-y-3.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-gray-700 md:text-base">
                    {t(`homeEspace.features.${f}`)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <a
                href="/espace-client"
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-6 py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
              >
                {t('homeEspace.cta')}
                <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div data-reveal className="relative" style={{ transitionDelay: '120ms' }}>
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-secondary/15 via-transparent to-accent/15 blur-2xl" />

            <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <span className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </span>
                <div className="mx-auto rounded-md bg-white px-3 py-1 text-[11px] font-medium text-gray-500 ring-1 ring-gray-200">
                  espace.nzoimmoclean.ch
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-primary">{t('homeEspace.dashboard.title')}</h3>
                  <span className="rounded-full bg-secondary-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-700">
                    {t('homeEspace.dashboard.activeBadge')}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {missions.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-100 bg-white p-3.5 transition hover:shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary">
                          <FontAwesomeIcon icon={m.icon} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="truncate text-sm font-bold text-primary">
                              {t(m.titleKey)}
                            </h4>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${m.statusColor}`}
                            >
                              {t(m.statusKey)}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs font-medium text-gray-500">
                            {t(m.cityKey)}
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${m.progressColor}`}
                              style={{ width: `${m.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -top-4 right-3 z-10 flex items-center gap-2.5 rounded-2xl bg-primary-900 px-4 py-2.5 text-white shadow-xl sm:right-6 lg:-right-6">
              <FontAwesomeIcon icon={faArrowTrendUp} className="h-3 w-3 text-accent" />
              <div className="leading-tight">
                <div className="text-[9px] font-bold uppercase tracking-wider text-white/60">
                  {t('homeEspace.kpi.label')}
                </div>
                <div className="text-base font-bold">{t('homeEspace.kpi.value')}</div>
              </div>
            </div>

            <div className="absolute -bottom-4 left-3 z-10 flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-xl ring-1 ring-gray-100 sm:left-6 lg:-left-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white">
                <FontAwesomeIcon icon={faBell} className="h-3.5 w-3.5" />
              </span>
              <div className="leading-tight">
                <div className="text-xs font-bold text-primary">
                  {t('homeEspace.notification.title')}
                </div>
                <div className="text-[10px] font-medium text-gray-500">
                  {t('homeEspace.notification.time')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
