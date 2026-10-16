import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faPlus,
  faMinus,
  faTrash,
  faCartShopping,
  faArrowRight,
  faEnvelope,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { useCart, formatPrice, buildWhatsAppMessage, buildEmailBody } from '../../context/CartContext.jsx'
import { contactInfo } from '../../data/navigation.js'
import ProductImage from './ProductImage.jsx'

export default function CartDrawer() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, isOpen, close, removeItem, updateQuantity, subtotal, clear } = useCart()

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close])

  const whatsappHref = `https://wa.me/${contactInfo.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
    buildWhatsAppMessage(items, subtotal, t),
  )}`
  const emailHref = `mailto:${contactInfo.email}?subject=${encodeURIComponent(
    t('shop.cart.emailSubject'),
  )}&body=${encodeURIComponent(buildEmailBody(items, subtotal, t))}`

  const goCheckout = () => {
    close()
    navigate('/boutique/checkout')
  }

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[60] ${isOpen ? '' : 'pointer-events-none'}`}
    >
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('shop.cart.title')}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <FontAwesomeIcon icon={faCartShopping} className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-primary">{t('shop.cart.title')}</h2>
              <div className="text-xs font-medium text-gray-500">
                {t('shop.cart.itemCount', { count: items.length })}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t('shop.cart.close')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-primary"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <FontAwesomeIcon icon={faCartShopping} className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-base font-bold text-primary">{t('shop.cart.emptyTitle')}</h3>
            <p className="mt-2 text-sm font-medium text-gray-500">{t('shop.cart.emptyText')}</p>
            <Link
              to="/boutique"
              onClick={close}
              className="btn-primary mt-6 px-5 py-2.5 text-sm"
            >
              {t('shop.cart.browse')}
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <ProductImage category={item.category} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/boutique/${item.slug}`}
                      onClick={close}
                      className="line-clamp-2 text-sm font-bold text-primary transition hover:text-secondary"
                    >
                      {t(item.nameKey)}
                    </Link>
                    <div className="mt-1 text-xs font-medium text-gray-500">
                      {formatPrice(item.price)}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-full border border-gray-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="—"
                          className="flex h-7 w-7 items-center justify-center text-gray-600 transition hover:text-primary"
                        >
                          <FontAwesomeIcon icon={faMinus} className="h-2.5 w-2.5" />
                        </button>
                        <span className="min-w-[24px] text-center text-xs font-bold text-primary">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="+"
                          className="flex h-7 w-7 items-center justify-center text-gray-600 transition hover:text-primary"
                        >
                          <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={t('shop.cart.remove')}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-sm font-bold text-primary">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-5">
              <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                <span>{t('shop.cart.subtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="mt-1 text-xs font-medium text-gray-500">
                {t('shop.cart.shippingNote')}
              </div>

              <div className="mt-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={goCheckout}
                  className="btn-primary w-full px-5 py-3 text-sm"
                >
                  <FontAwesomeIcon icon={faCreditCard} className="h-3.5 w-3.5" />
                  {t('shop.cart.checkout')}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#25D366]/30 transition hover:bg-[#1ebd5c]"
                  >
                    <FontAwesomeIcon icon={faWhatsapp} className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                  <a
                    href={emailHref}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                  >
                    <FontAwesomeIcon icon={faEnvelope} className="h-3.5 w-3.5" />
                    Email
                  </a>
                </div>

                <button
                  type="button"
                  onClick={clear}
                  className="mt-1 text-xs font-semibold text-gray-400 transition hover:text-red-500"
                >
                  {t('shop.cart.clear')}
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
