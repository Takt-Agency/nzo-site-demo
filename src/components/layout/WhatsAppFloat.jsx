import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { contactInfo } from '../../data/navigation.js'

// Hide the floating WhatsApp button inside the internal dashboards (admin
// and agent espace) — it's only meant for public-facing pages and the
// client area where customers may want to reach support quickly.
const HIDDEN_PREFIXES = ['/admin', '/espace-agent']

export default function WhatsAppFloat() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null
  }
  const number = contactInfo.whatsapp.replace(/[^0-9]/g, '')
  const message = encodeURIComponent(t('whatsappFloat.message'))
  const href = `https://wa.me/${number}?text=${message}`
  const label = t('whatsappFloat.aria')

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/40 ring-4 ring-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1ebe5b] hover:shadow-2xl"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40"
      />
      <FontAwesomeIcon icon={faWhatsapp} className="h-7 w-7" />
    </a>
  )
}
