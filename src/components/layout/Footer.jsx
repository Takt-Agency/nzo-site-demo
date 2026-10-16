import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPhone,
  faEnvelope,
  faClock,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons'
import {
  faFacebookF,
  faInstagram,
  faLinkedinIn,
  faWhatsapp,
} from '@fortawesome/free-brands-svg-icons'
import {
  contactInfo,
  socialLinks,
  footerUsefulLinks,
  footerLegalLinks,
  navLinks,
} from '../../data/navigation.js'
import Logo from './Logo.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'

const socialIcons = {
  facebook: faFacebookF,
  instagram: faInstagram,
  linkedin: faLinkedinIn,
  whatsapp: faWhatsapp,
}

const usefulLabelKey = (key) => {
  if (key === 'devis') return 'footer.useful.devis'
  if (key === 'espace') return 'footer.useful.espace'
  return `nav.${key}`
}

export default function Footer() {
  const { t } = useTranslation()
  const services = navLinks.find((l) => l.key === 'services')?.children ?? []
  const year = new Date().getFullYear()

  return (
    <footer className="bg-primary-900 text-white/90">
      <div className="container py-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo variant="white" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
              {t('footer.tagline')}
            </p>

            <div className="mt-6 flex items-start gap-3 text-sm">
              <FontAwesomeIcon icon={faLocationDot} className="mt-0.5 h-4 w-4 text-accent" />
              <div className="leading-relaxed text-white/80">
                <div>{contactInfo.address.line1}</div>
                <div>{contactInfo.address.line2}</div>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                {t('footer.followUs')}
              </div>
              <div className="mt-3 flex items-center gap-3">
                {socialLinks.map(({ key, href, label }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-accent hover:text-white hover:ring-accent"
                  >
                    <FontAwesomeIcon icon={socialIcons[key]} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
              {t('footer.servicesTitle')}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {services.map(({ key, href }) => (
                <li key={key}>
                  <a href={href} className="text-white/85 transition hover:text-accent">
                    {t(`services.${key}.title`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
              {t('footer.usefulTitle')}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {footerUsefulLinks.map(({ key, href }) => (
                <li key={key}>
                  <a href={href} className="text-white/85 transition hover:text-accent">
                    {t(usefulLabelKey(key))}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
              {t('footer.contactTitle')}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${contactInfo.phoneTel}`}
                  className="flex items-center gap-3 text-white/85 transition hover:text-accent"
                >
                  <FontAwesomeIcon icon={faPhone} className="h-3.5 w-3.5 text-accent" />
                  {contactInfo.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-3 text-white/85 transition hover:text-accent"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="h-3.5 w-3.5 text-accent" />
                  {contactInfo.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${contactInfo.whatsapp.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-3 text-white/85 transition hover:text-accent"
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-accent" />
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-3 text-white/85">
                <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5 text-accent" />
                {t('topbar.hours')}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-white/60 md:flex-row">
            <div>{t('footer.copyright', { year })}</div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {footerLegalLinks.map(({ key, href }) => (
                <a key={key} href={href} className="transition hover:text-white">
                  {t(`footer.legal.${key}`)}
                </a>
              ))}
              <LanguageSwitcher dropUp />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
