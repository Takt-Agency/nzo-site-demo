import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGauge,
  faSprayCanSparkles,
  faCalendarDays,
  faClipboardList,
  faGear,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'
import Logo from '../layout/Logo.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export const agentSidebarItems = [
  { to: '/espace-agent', icon: faGauge, key: 'dashboard', end: true },
  { to: '/espace-agent/missions', icon: faSprayCanSparkles, key: 'missions' },
  { to: '/espace-agent/calendrier', icon: faCalendarDays, key: 'calendrier' },
  { to: '/espace-agent/demandes', icon: faClipboardList, key: 'demandes' },
  { to: '/espace-agent/parametres', icon: faGear, key: 'parametres' },
]

export default function AgentSidebar({ onNavigate }) {
  const { t } = useTranslation()
  const { logout } = useAuth()

  const onSignOut = () => {
    logout()
    // Hard reload so no agent state survives the logout.
    window.location.replace('/')
  }

  return (
    <aside className="flex h-full flex-col bg-primary-900 text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <Logo variant="white" />
        <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
          {t('agent.sidebar.badge')}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
          {t('agent.sidebar.section.main')}
        </div>
        <ul className="space-y-0.5">
          {agentSidebarItems.map(({ to, icon, key, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-accent text-white shadow-sm shadow-accent/30'
                      : 'text-white/75 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                <span className="flex-1">{t(`agent.sidebar.${key}`)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/70 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
          {t('agent.sidebar.signOut')}
        </button>
      </div>
    </aside>
  )
}
