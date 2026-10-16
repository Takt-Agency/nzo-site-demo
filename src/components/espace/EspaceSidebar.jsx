import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGauge,
  faFilePen,
  faSprayCanSparkles,
  faClipboardList,
  faTriangleExclamation,
  faFileInvoiceDollar,
  faUserGear,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext.jsx'

export const sidebarItems = [
  { to: '/espace-client', icon: faGauge, key: 'dashboard', end: true },
  { to: '/espace-client/devis', icon: faFilePen, key: 'quotes' },
  { to: '/espace-client/missions', icon: faSprayCanSparkles, key: 'missions' },
  { to: '/espace-client/demandes', icon: faClipboardList, key: 'requests' },
  { to: '/espace-client/reclamations', icon: faTriangleExclamation, key: 'complaints' },
  { to: '/espace-client/factures', icon: faFileInvoiceDollar, key: 'invoices' },
  { to: '/espace-client/profil', icon: faUserGear, key: 'profile' },
]

const accountTypeLabel = {
  particulier: 'Particulier',
  entreprise: 'Entreprise',
  proImmo: 'Pro immo',
  association: 'Association',
}

export default function EspaceSidebar() {
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
    <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-secondary-700 text-sm font-bold tracking-wider text-white shadow-md">
            {initials}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-primary">
              {firstName} {lastName}
            </div>
            <div className="truncate text-[10px] font-bold uppercase tracking-wider text-secondary-700">
              {plan}
            </div>
          </div>
        </div>

        <nav className="p-2">
          <ul className="space-y-0.5">
            {sidebarItems.map(({ to, icon, key, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                  {t(`espace.sidebar.${key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-100 p-2">
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
            {t('espace.sidebar.signOut')}
          </button>
        </div>
      </div>
    </aside>
  )
}

export function EspaceMobileTabs() {
  const { t } = useTranslation()
  return (
    <nav className="-mx-1 overflow-x-auto pb-1 lg:hidden">
      <ul className="flex min-w-max gap-2 px-1">
        {sidebarItems.map(({ to, icon, key, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  isActive
                    ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-primary'
                }`
              }
            >
              <FontAwesomeIcon icon={icon} className="h-3 w-3" />
              {t(`espace.sidebar.${key}`)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
