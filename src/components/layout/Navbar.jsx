import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faArrowRight,
  faBars,
  faXmark,
  faBuilding,
  faHelmetSafety,
  faSprayCanSparkles,
  faKey,
  faWarehouse,
  faSolarPanel,
  faSeedling,
  faPaw,
  faTree,
  faTruckRampBox,
  faCartShopping,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import Logo from './Logo.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import { navLinks } from '../../data/navigation.js'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const serviceIcons = {
  bureaux: faBuilding,
  apresChantier: faHelmetSafety,
  facades: faSprayCanSparkles,
  conciergerie: faKey,
  garages: faWarehouse,
  photovoltaique: faSolarPanel,
  arrosage: faSeedling,
  animaux: faPaw,
  jardins: faTree,
  debarras: faTruckRampBox,
}

export default function Navbar() {
  const { t } = useTranslation()
  const { count, open: openCart } = useCart()
  const { user } = useAuth()
  // Admins are scoped to /admin only — they don't appear "logged in" in the
  // public navbar. They reach their dashboard by URL/bookmark.
  const publicUser = user && user.role !== 'admin' ? user : null
  const accountHref = publicUser
    ? publicUser.role === 'agent'
      ? '/espace-agent'
      : '/espace-client'
    : '/login'
  const accountInitials = publicUser
    ? `${publicUser.firstName?.[0] || ''}${publicUser.lastName?.[0] || ''}`.toUpperCase()
    : ''
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const closeTimer = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenDropdown(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openMenu = (key) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenDropdown(key)
  }
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120)
  }

  return (
    <header
      className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${
        scrolled ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => {
            const isOpen = openDropdown === link.key
            return (
              <div
                key={link.key}
                className="relative"
                onMouseEnter={() => link.hasDropdown && openMenu(link.key)}
                onMouseLeave={() => link.hasDropdown && scheduleClose()}
              >
                <a
                  href={link.href}
                  className={`nav-link ${isOpen ? 'text-primary' : ''}`}
                  aria-haspopup={link.hasDropdown ? 'menu' : undefined}
                  aria-expanded={link.hasDropdown ? isOpen : undefined}
                >
                  <span>{t(`nav.${link.key}`)}</span>
                  {link.hasDropdown && (
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`h-2.5 w-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </a>

                {link.hasDropdown && link.children && (
                  <div
                    className={`absolute left-1/2 top-full z-50 w-screen max-w-3xl -translate-x-1/2 pt-3 transition duration-150 ${
                      isOpen ? 'pointer-events-auto opacity-100 translate-y-0' : 'pointer-events-none -translate-y-1 opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-4">
                        {link.children.map((child) => {
                          const icon = serviceIcons[child.key]
                          return (
                            <a
                              key={child.key}
                              href={child.href}
                              className="group/item flex items-start gap-3 rounded-xl p-3 transition hover:bg-secondary-50"
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary transition group-hover/item:bg-secondary group-hover/item:text-white">
                                {icon && <FontAwesomeIcon icon={icon} className="h-4 w-4" />}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-bold text-primary group-hover/item:text-secondary">
                                  {t(`services.${child.key}.title`)}
                                </span>
                                <span className="mt-0.5 block text-xs font-medium leading-snug text-gray-500">
                                  {t(`services.${child.key}.description`)}
                                </span>
                              </span>
                            </a>
                          )
                        })}
                      </div>
                      <a
                        href="/services"
                        className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 text-sm font-bold text-primary transition hover:bg-gray-100"
                      >
                        <span>{t('services.viewAll')}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="hidden lg:block">
          <a href="/devis" className="btn-primary">
            {t('nav.cta')}
            <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
          </a>
        </div>

        <div className="flex items-center gap-1 text-primary lg:hidden">
          <button
            type="button"
            onClick={openCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-primary active:scale-95"
            aria-label={t('topbar.cart')}
          >
            <FontAwesomeIcon icon={faCartShopping} className="h-[18px] w-[18px]" />
            {count > 0 && (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                {count}
              </span>
            )}
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-primary">
            <LanguageSwitcher compact />
          </div>

          <a
            href={accountHref}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95 ${
              publicUser
                ? 'bg-accent text-white shadow-sm hover:shadow-md'
                : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
            }`}
            aria-label={publicUser ? `${publicUser.firstName} ${publicUser.lastName}` : t('topbar.login')}
          >
            {publicUser ? (
              <span className="text-[11px] font-bold tracking-wider">
                {accountInitials || <FontAwesomeIcon icon={faUser} className="h-[16px] w-[16px]" />}
              </span>
            ) : (
              <FontAwesomeIcon icon={faUser} className="h-[18px] w-[18px]" />
            )}
          </a>

          <span aria-hidden="true" className="mx-1 h-6 w-px bg-gray-200" />

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition active:scale-95 ${
              mobileOpen
                ? 'bg-primary text-white'
                : 'bg-gradient-to-br from-primary to-secondary text-white hover:shadow-md'
            }`}
          >
            <FontAwesomeIcon
              icon={mobileOpen ? faXmark : faBars}
              className="h-[18px] w-[18px] transition-transform"
            />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white lg:hidden">
          <nav className="container flex flex-col py-2">
            {navLinks.map((link) => {
              const expanded = mobileExpanded === link.key
              if (link.hasDropdown && link.children) {
                return (
                  <div key={link.key} className="border-b border-gray-50 last:border-0">
                    <button
                      type="button"
                      onClick={() => setMobileExpanded(expanded ? null : link.key)}
                      className="flex w-full items-center justify-between py-3 text-sm font-semibold text-gray-700"
                      aria-expanded={expanded}
                    >
                      <span>{t(`nav.${link.key}`)}</span>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {expanded && (
                      <div className="mb-2 grid grid-cols-1 gap-1 pl-3">
                        {link.children.map((child) => {
                          const icon = serviceIcons[child.key]
                          return (
                            <a
                              key={child.key}
                              href={child.href}
                              className="flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-gray-700 hover:bg-secondary-50"
                            >
                              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary-50 text-secondary">
                                {icon && <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />}
                              </span>
                              {t(`services.${child.key}.title`)}
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <a
                  key={link.key}
                  href={link.href}
                  className="border-b border-gray-50 py-3 text-sm font-semibold text-gray-700 last:border-0"
                >
                  {t(`nav.${link.key}`)}
                </a>
              )
            })}
            <a href="/devis" className="btn-primary mt-3 self-start">
              {t('nav.cta')}
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
