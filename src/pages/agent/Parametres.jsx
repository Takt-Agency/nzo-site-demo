import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faGlobe, faArrowRight, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import PasswordModal from '../../components/shared/PasswordModal.jsx'
import LanguageModal from '../../components/shared/LanguageModal.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

function SettingsCard({ icon, color, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-start gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md md:p-6"
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${color}`}
      >
        <FontAwesomeIcon icon={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-primary md:text-base">{title}</h2>
          <FontAwesomeIcon
            icon={faArrowRight}
            className="h-3 w-3 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-accent"
          />
        </div>
        <p className="mt-1 text-xs font-medium leading-snug text-gray-500">{description}</p>
      </div>
    </button>
  )
}

export default function AgentParametres() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [modal, setModal] = useState(null) // 'password' | 'language'

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-700">
          {t('agent.parametres.eyebrow')}
        </div>
        <h1 className="mt-1 text-xl font-bold text-primary md:text-2xl">{t('agent.parametres.title')}</h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          {t('agent.parametres.subtitle')}
        </p>
      </div>

      {/* Quick account card */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-accent to-accent-700 p-5 text-white shadow-lg shadow-accent/20 md:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-sm font-bold ring-2 ring-white/30 backdrop-blur-sm">
            {`${user?.firstName?.[0] || 'A'}${user?.lastName?.[0] || ''}`.toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
              {t('agent.parametres.accountBadge')}
            </div>
            <div className="truncate text-base font-bold leading-tight md:text-lg">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="truncate text-xs font-medium text-white/85">{user?.email}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SettingsCard
          icon={faLock}
          color="bg-gradient-to-br from-primary-700 to-secondary-700"
          title={t('agent.parametres.securityTitle')}
          description={t('agent.parametres.securityDesc')}
          onClick={() => setModal('password')}
        />
        <SettingsCard
          icon={faGlobe}
          color="bg-gradient-to-br from-emerald-500 to-emerald-700"
          title={t('agent.parametres.languageTitle')}
          description={t('agent.parametres.languageDesc')}
          onClick={() => setModal('language')}
        />
      </div>

      <div className="rounded-2xl border-2 border-dashed border-accent/20 bg-accent/5 p-4 text-xs font-medium leading-relaxed text-gray-600">
        <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5 h-3 w-3 text-accent-700" />
        <strong className="font-bold text-accent-700">{t('agent.parametres.managedByAdmin')}</strong>
        {t('agent.parametres.managedByAdminText1')}
        <a href="/espace-agent/demandes/nouvelle" className="underline">
          {t('agent.parametres.managedByAdminLink')}
        </a>
        {t('agent.parametres.managedByAdminText2')}
      </div>

      {modal === 'password' && <PasswordModal onClose={() => setModal(null)} />}
      {modal === 'language' && <LanguageModal mode="agent" onClose={() => setModal(null)} />}
    </div>
  )
}
