import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGauge,
  faUsers,
  faFilePen,
  faSprayCanSparkles,
  faCalendarDays,
  faFileInvoiceDollar,
  faClipboardList,
  faTriangleExclamation,
  faUsersGear,
  faGear,
  faBoxArchive,
  faStar,
  faRightFromBracket,
  faMapLocationDot,
  faShieldHalved,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons'
import Logo from '../layout/Logo.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

// `countKey` maps each menu item to the field on the counts payload coming
// from the backend (admin.sidebarCounts). Items without a key never show a
// badge.
//
// `tone` controls badge color so urgent things (reclamations) read red,
// pending paperwork (factures) reads amber, and the rest stays accent.
export const adminSidebarItems = [
  { to: '/admin', icon: faGauge, key: 'dashboard', end: true },
  { to: '/admin/clients', icon: faUsers, key: 'clients' },
  { to: '/admin/devis', icon: faFilePen, key: 'devis', countKey: 'devis', tone: 'accent' },
  {
    to: '/admin/missions',
    icon: faSprayCanSparkles,
    key: 'missions',
    countKey: 'missions',
    tone: 'secondary',
  },
  { to: '/admin/planning', icon: faCalendarDays, key: 'planning' },
  { to: '/admin/carte', icon: faMapLocationDot, key: 'carte' },
  { to: '/admin/sos', icon: faShieldHalved, key: 'sos', countKey: 'sos', tone: 'red' },
  {
    to: '/admin/factures',
    icon: faFileInvoiceDollar,
    key: 'factures',
    countKey: 'factures',
    tone: 'amber',
  },
  {
    to: '/admin/demandes',
    icon: faClipboardList,
    key: 'demandes',
    countKey: 'demandes',
    tone: 'accent',
  },
  {
    to: '/admin/reclamations',
    icon: faTriangleExclamation,
    key: 'reclamations',
    countKey: 'reclamations',
    tone: 'red',
  },
  { to: '/admin/equipe', icon: faUsersGear, key: 'equipe' },
  { to: '/admin/avis', icon: faStar, key: 'avis', countKey: 'reviews', tone: 'amber' },
  { to: '/admin/stats', icon: faChartLine, key: 'stats' },
  { to: '/admin/archives', icon: faBoxArchive, key: 'archives' },
  { to: '/admin/parametres', icon: faGear, key: 'parametres' },
]

const TONE_CLASSES = {
  accent: 'bg-accent text-white',
  secondary: 'bg-secondary text-white',
  amber: 'bg-amber-500 text-white',
  red: 'bg-red-500 text-white',
}

export default function AdminSidebar({ onNavigate, counts = {} }) {
  const { t } = useTranslation()
  const { logout } = useAuth()

  const onSignOut = () => {
    logout()
    window.location.replace('/')
  }

  return (
    <aside className="flex h-full flex-col bg-primary-900 text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <Logo variant="white" />
        <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
          {t('admin.sidebar.badge')}
        </span>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto p-3">
        <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
          {t('admin.sidebar.section.main')}
        </div>
        <ul className="space-y-0.5">
          {adminSidebarItems.map(({ to, icon, key, end, countKey, tone }) => {
            const count = countKey ? counts[countKey] : undefined
            const showBadge = typeof count === 'number' && count > 0
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                        : 'text-white/75 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                  <span className="flex-1">{t(`admin.sidebar.${key}`)}</span>
                  {showBadge ? (
                    <span
                      className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${
                        TONE_CLASSES[tone] || TONE_CLASSES.accent
                      }`}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/70 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
          {t('admin.sidebar.signOut')}
        </button>
      </div>
    </aside>
  )
}
