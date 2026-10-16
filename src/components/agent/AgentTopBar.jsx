import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext.jsx'
import LanguageSwitcher from '../layout/LanguageSwitcher.jsx'
import NotificationBell from '../espace/NotificationBell.jsx'

export default function AgentTopBar({ onOpenMobileNav }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const firstName = user?.firstName || ''
  const lastName = user?.lastName || ''
  const initials = `${firstName[0] || 'A'}${lastName[0] || ''}`.toUpperCase()

  const onSignOut = () => {
    logout()
    window.location.replace('/')
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-primary transition hover:bg-gray-100 lg:hidden"
        aria-label={t('agent.topbar.openMenu')}
      >
        <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
      </button>

      <div className="hidden flex-1 md:block" />

      <div className="ml-auto flex items-center gap-2 text-primary">
        <LanguageSwitcher compact />

        <NotificationBell />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-full bg-gray-50 px-2 py-1.5 transition hover:bg-gray-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-700 text-[11px] font-bold tracking-wider text-white">
              {initials}
            </span>
            <span className="hidden text-left text-xs leading-tight sm:block">
              <span className="block font-bold text-primary">
                {firstName} {lastName}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-accent-700">
                {t('agent.topbar.role')}
              </span>
            </span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-100">
                <div className="border-b border-gray-100 px-4 py-3">
                  <div className="text-sm font-bold text-primary">
                    {firstName} {lastName}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-500">{user?.email}</div>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="h-3.5 w-3.5" />
                  {t('agent.topbar.signOut')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
