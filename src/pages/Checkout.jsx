import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faArrowRight,
  faCircleCheck,
  faTruck,
  faShieldHalved,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import TopBar from '../components/layout/TopBar.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import ProductImage from '../components/shop/ProductImage.jsx'
import { useCart, formatPrice, buildWhatsAppMessage, buildEmailBody } from '../context/CartContext.jsx'
import { contactInfo } from '../data/navigation.js'

const SHIPPING_FREE_THRESHOLD = 50
const SHIPPING_COST = 9.9

export default function Checkout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, subtotal, clear } = useCart()
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    notes: '',
    consent: false,
  })

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const shippingCost = subtotal >= SHIPPING_FREE_THRESHOLD || items.length === 0 ? 0 : SHIPPING_COST
  const total = subtotal + shippingCost

  const onSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    clear()
  }

  const whatsappHref = `https://wa.me/${contactInfo.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
    buildWhatsAppMessage(items, subtotal, t),
  )}`
  const emailHref = `mailto:${contactInfo.email}?subject=${encodeURIComponent(
    t('shop.cart.emailSubject'),
  )}&body=${encodeURIComponent(buildEmailBody(items, subtotal, t))}`

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 transition focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20'
  const labelClass = 'block text-sm font-semibold text-primary'

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <Navbar />
        <main className="container py-16 md:py-24">
          <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30">
              <FontAwesomeIcon icon={faCircleCheck} className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-2xl font-bold text-primary">
              {t('shop.checkout.success.title')}
            </h1>
            <p className="mt-3 text-sm font-medium text-gray-600 md:text-base">
              {t('shop.checkout.success.message')}
            </p>
            <Link to="/boutique" className="btn-primary mt-7 px-6 py-3 text-sm">
              {t('shop.checkout.success.cta')}
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <Navbar />
        <main className="container py-16 md:py-24">
          <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
            <h1 className="text-2xl font-bold text-primary">{t('shop.cart.emptyTitle')}</h1>
            <p className="mt-3 text-sm font-medium text-gray-600">{t('shop.cart.emptyText')}</p>
            <Link to="/boutique" className="btn-primary mt-7 px-6 py-3 text-sm">
              {t('shop.cart.browse')}
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <Navbar />

      <main className="py-10 md:py-14 lg:py-16">
        <div className="container max-w-6xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 transition hover:text-primary"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
            {t('shop.checkout.back')}
          </button>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-primary md:text-3xl">
            {t('shop.checkout.title')}
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-600">
            {t('shop.checkout.subtitle')}
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
            <form
              onSubmit={onSubmit}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8"
            >
              <h2 className="text-lg font-bold text-primary">
                {t('shop.checkout.shippingTitle')}
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className={labelClass}>
                    {t('contact.fields.firstName')} *
                  </label>
                  <input
                    id="firstName"
                    required
                    value={form.firstName}
                    onChange={(e) => update({ firstName: e.target.value })}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className={labelClass}>
                    {t('contact.fields.lastName')} *
                  </label>
                  <input
                    id="lastName"
                    required
                    value={form.lastName}
                    onChange={(e) => update({ lastName: e.target.value })}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    {t('contact.fields.email')} *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update({ email: e.target.value })}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>
                    {t('contact.fields.phone')} *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => update({ phone: e.target.value })}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelClass}>
                    {t('devis.fields.address')} *
                  </label>
                  <input
                    id="address"
                    required
                    value={form.address}
                    onChange={(e) => update({ address: e.target.value })}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className={labelClass}>
                    {t('devis.fields.postalCode')} *
                  </label>
                  <input
                    id="postalCode"
                    required
                    value={form.postalCode}
                    onChange={(e) => update({ postalCode: e.target.value })}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>
                <div>
                  <label htmlFor="city" className={labelClass}>
                    {t('devis.fields.city')} *
                  </label>
                  <input
                    id="city"
                    required
                    value={form.city}
                    onChange={(e) => update({ city: e.target.value })}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className={labelClass}>
                    {t('shop.checkout.notesLabel')}
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                    placeholder={t('shop.checkout.notesPlaceholder')}
                    className={`mt-2 resize-y ${inputClass}`}
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-xs font-medium text-gray-600 sm:col-span-2">
                  <input
                    type="checkbox"
                    required
                    checked={form.consent}
                    onChange={(e) => update({ consent: e.target.checked })}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span>
                    {t('shop.checkout.consent')} <span className="text-accent">*</span>
                  </span>
                </label>
              </div>

              <button type="submit" className="btn-primary mt-7 w-full px-6 py-3.5 text-sm md:text-base">
                {t('shop.checkout.submit')}
                <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
              </button>

              <div className="my-7 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <span className="h-px flex-1 bg-gray-200" />
                {t('shop.checkout.altDivider')}
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#25D366]/30 transition hover:bg-[#1ebd5c]"
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
                  {t('shop.checkout.viaWhatsapp')}
                </a>
                <a
                  href={emailHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary px-5 py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                  {t('shop.checkout.viaEmail')}
                </a>
              </div>
            </form>

            <aside className="self-start rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-7 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-primary">
                {t('shop.checkout.summaryTitle')}
              </h2>

              <ul className="mt-5 divide-y divide-gray-100">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <ProductImage category={item.category} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-xs font-bold text-primary">
                        {t(item.nameKey)}
                      </div>
                      <div className="text-[11px] font-medium text-gray-500">
                        {t('shop.checkout.qty', { count: item.quantity })}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-primary">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 space-y-2 border-t border-gray-100 pt-5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{t('shop.cart.subtotal')}</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('shop.checkout.shipping')}</span>
                  <span className="font-semibold">
                    {shippingCost === 0 ? (
                      <span className="text-accent">{t('shop.checkout.shippingFree')}</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                {subtotal < SHIPPING_FREE_THRESHOLD && (
                  <div className="rounded-xl bg-secondary-50 px-3 py-2 text-[11px] font-semibold text-secondary-700">
                    {t('shop.checkout.freeShippingHint', {
                      amount: formatPrice(SHIPPING_FREE_THRESHOLD - subtotal),
                    })}
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-base">
                  <span className="font-bold text-primary">{t('shop.checkout.total')}</span>
                  <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-xs font-semibold text-gray-600">
                <li className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faTruck} className="h-3.5 w-3.5 text-accent" />
                  {t('shop.guarantees.delivery')}
                </li>
                <li className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faShieldHalved} className="h-3.5 w-3.5 text-accent" />
                  {t('shop.guarantees.secure')}
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
