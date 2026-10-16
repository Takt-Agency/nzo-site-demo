import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import TopBar from '../layout/TopBar.jsx'
import Navbar from '../layout/Navbar.jsx'
import Footer from '../layout/Footer.jsx'
import EspaceSidebar, { EspaceMobileTabs } from './EspaceSidebar.jsx'
import NotificationBell from './NotificationBell.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const accountTypeLabel = {
  particulier: 'Particulier',
  entreprise: 'Entreprise',
  proImmo: 'Pro immo',
  association: 'Association',
}

export default function EspaceLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const firstName = user?.firstName || ''
  const lastName = user?.lastName || ''
  const initials = `${firstName[0] || '?'}${lastName[0] || ''}`.toUpperCase()
  const plan = accountTypeLabel[user?.accountType] || 'Particulier'

  const onSignOut = () => {
    logout()
    window.location.replace('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <Navbar />

      <main className="py-6 md:py-8 lg:py-10">
        <div className="container">
          <div className="grid gap-5 lg:grid-cols-[260px_1fr] lg:gap-6">
            <EspaceSidebar />

            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100 lg:hidden">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-secondary-700 text-xs font-bold tracking-wider text-white shadow-sm">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-primary">
                    {firstName} {lastName}
                  </div>
                  <div className="truncate text-[10px] font-bold uppercase tracking-wider text-secondary-700">
                    {plan}
                  </div>
                </div>
                <NotificationBell />
                <button
                  type="button"
                  onClick={onSignOut}
                  aria-label={t('espace.sidebar.signOut')}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3 hidden items-center justify-end lg:mb-4 lg:flex">
                <NotificationBell />
              </div>

              <EspaceMobileTabs />

              <div className="mt-3 lg:mt-0">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
