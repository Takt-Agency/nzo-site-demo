import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faEnvelope, faClock, faCartShopping, faUser } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { contactInfo } from '../../data/navigation.js'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'

export default function TopBar() {
  const { t } = useTranslation()
  const { count, open } = useCart()
  const { user } = useAuth()
  // Admins are scoped to /admin only — they appear anonymous on the public site.
  const publicUser = user && user.role !== 'admin' ? user : null
  const accountHref = publicUser
    ? publicUser.role === 'agent'
      ? '/espace-agent'
      : '/espace-client'
    : '/login'
  const accountInitials = publicUser
    ? `${publicUser.firstName?.[0] || ''}${publicUser.lastName?.[0] || ''}`.toUpperCase()
    : ''

  return (
    <div className="hidden bg-primary text-white md:block">
      <div className="container flex h-10 items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-5">
          <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 transition hover:text-accent">
            <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
            <span>{contactInfo.phone}</span>
          </a>
          <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-1.5 transition hover:text-accent">
            <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3" />
            <span>{contactInfo.email}</span>
          </a>
          <span className="flex items-center gap-1.5 text-white/85">
            <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
            <span>{t('topbar.hours')}</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <span className="h-3.5 w-px bg-white/20" />
          <button
            type="button"
            onClick={open}
            className="relative flex items-center gap-1.5 transition hover:text-accent"
            aria-label={t('topbar.cart')}
          >
            <FontAwesomeIcon icon={faCartShopping} className="h-3 w-3" />
            <span>{t('topbar.cart')}</span>
            {count > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
                {count}
              </span>
            )}
          </button>
          <span className="h-3.5 w-px bg-white/20" />
          {publicUser ? (
            <Link
              to={accountHref}
              className="flex items-center gap-2 transition hover:text-accent"
              aria-label={t('espace.sidebar.profile', { defaultValue: 'Mon espace' })}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold tracking-wider text-white ring-1 ring-white/30">
                {accountInitials || <FontAwesomeIcon icon={faUser} className="h-2.5 w-2.5" />}
              </span>
              <span className="font-semibold">{publicUser.firstName}</span>
            </Link>
          ) : (
            <a href="/login" className="flex items-center gap-1.5 transition hover:text-accent">
              <FontAwesomeIcon icon={faUser} className="h-3 w-3" />
              <span>{t('topbar.login')}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
