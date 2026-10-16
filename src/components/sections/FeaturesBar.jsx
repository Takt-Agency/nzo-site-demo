import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faListCheck, faLeaf, faFileLines } from '@fortawesome/free-solid-svg-icons'

const features = [
  { icon: faUsers, color: 'text-secondary', titleKey: 'features.equipeTitle', textKey: 'features.equipeText' },
  { icon: faListCheck, color: 'text-accent', titleKey: 'features.prestationsTitle', textKey: 'features.prestationsText' },
  { icon: faLeaf, color: 'text-accent', titleKey: 'features.ecoTitle', textKey: 'features.ecoText' },
  { icon: faFileLines, color: 'text-tertiary', titleKey: 'features.devisTitle', textKey: 'features.devisText' },
]

export default function FeaturesBar() {
  const { t } = useTranslation()

  return (
    <section className="bg-primary-800 text-white">
      <div className="container grid grid-cols-1 gap-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon, color, titleKey, textKey }) => (
          <div key={titleKey} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
              <FontAwesomeIcon icon={icon} className={`h-[18px] w-[18px] ${color}`} />
            </div>
            <div>
              <div className="text-sm font-bold">{t(titleKey)}</div>
              <div className="text-xs font-medium text-white/80">{t(textKey)}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
