import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronRight,
  faArrowRight,
  faArrowLeft,
  faStar,
  faCartPlus,
  faPlus,
  faMinus,
  faCircleCheck,
  faTruck,
  faRotateLeft,
  faShieldHalved,
  faLeaf,
} from '@fortawesome/free-solid-svg-icons'
import TopBar from '../components/layout/TopBar.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import ProductCard from '../components/shop/ProductCard.jsx'
import ProductImage from '../components/shop/ProductImage.jsx'
import { findProductBySlug, getRelatedProducts } from '../data/products.js'
import { useCart, formatPrice } from '../context/CartContext.jsx'

const guarantees = [
  { icon: faTruck, key: 'delivery' },
  { icon: faLeaf, key: 'eco' },
  { icon: faRotateLeft, key: 'returns' },
  { icon: faShieldHalved, key: 'secure' },
]

export default function ProductDetail() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const product = findProductBySlug(slug)
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar />
        <Navbar />
        <main className="container py-24 text-center">
          <h1 className="text-2xl font-bold text-primary">{t('shop.product.notFound')}</h1>
          <Link
            to="/boutique"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-secondary hover:underline"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
            {t('shop.product.backToShop')}
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const outOfStock = product.stock === 0
  const related = getRelatedProducts(product.id, product.category, 4)

  const onAdd = () => {
    if (outOfStock) return
    addItem(product, quantity)
  }

  const onBuyNow = () => {
    if (outOfStock) return
    addItem(product, quantity)
    navigate('/boutique/checkout')
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />

      <main>
        <section className="bg-gray-50 py-10 md:py-14 lg:py-16">
          <div className="container">
            <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Link to="/" className="transition hover:text-primary">
                {t('nav.accueil')}
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5" />
              <Link to="/boutique" className="transition hover:text-primary">
                {t('nav.boutique')}
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5" />
              <span className="text-primary">{t(product.nameKey)}</span>
            </nav>

            <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="relative overflow-hidden rounded-3xl shadow-sm ring-1 ring-gray-100">
                <div className="aspect-square">
                  <ProductImage category={product.category} size="lg" />
                </div>
                {product.badge && (
                  <span
                    className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow ${
                      product.badge === 'promo'
                        ? 'bg-red-500 text-white'
                        : product.badge === 'new'
                          ? 'bg-accent text-white'
                          : 'bg-secondary text-white'
                    }`}
                  >
                    {t(`shop.badge.${product.badge}`)}
                  </span>
                )}
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-700">
                  {t(`shop.categories.${product.category}`)}
                </div>
                <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-primary md:text-3xl">
                  {t(product.nameKey)}
                </h1>

                <div className="mt-3 flex items-center gap-3 text-sm font-semibold text-gray-600">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        className={`h-3.5 w-3.5 ${
                          i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500">
                    {product.reviewsCount} {t('shop.reviews')}
                  </span>
                </div>

                <p className="mt-5 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
                  {t(product.descriptionKey)}
                </p>

                <div className="mt-6 flex items-end gap-3">
                  <span className="text-3xl font-bold text-primary md:text-4xl">
                    {formatPrice(product.price)}
                  </span>
                  {product.oldPrice && (
                    <span className="text-base font-medium text-gray-400 line-through">
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}
                  {product.oldPrice && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-600">
                      -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
                  {outOfStock ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      {t('shop.outOfStock')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-accent-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {t('shop.inStock', { count: product.stock })}
                    </span>
                  )}
                  <span className="text-gray-400">SKU: {product.sku}</span>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-full border-2 border-gray-200">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="—"
                      disabled={outOfStock}
                      className="flex h-11 w-11 items-center justify-center text-gray-600 transition hover:text-primary disabled:opacity-40"
                    >
                      <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                    </button>
                    <span className="min-w-[40px] text-center text-sm font-bold text-primary">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="+"
                      disabled={outOfStock}
                      className="flex h-11 w-11 items-center justify-center text-gray-600 transition hover:text-primary disabled:opacity-40"
                    >
                      <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={onAdd}
                    disabled={outOfStock}
                    className="btn-primary flex-1 px-6 py-3 text-sm disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                  >
                    <FontAwesomeIcon icon={faCartPlus} className="h-3.5 w-3.5" />
                    {t('shop.addToCart')}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onBuyNow}
                  disabled={outOfStock}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-6 py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-white disabled:opacity-40"
                >
                  {t('shop.buyNow')}
                  <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                </button>

                <ul className="mt-8 grid grid-cols-2 gap-3">
                  {guarantees.map(({ icon, key }) => (
                    <li
                      key={key}
                      className="flex items-center gap-2.5 rounded-xl bg-gray-50 p-3 text-xs font-semibold text-gray-700"
                    >
                      <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5 text-accent" />
                      {t(`shop.guarantees.${key}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 md:py-16">
          <div className="container">
            <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
              <div>
                <h2 className="text-xl font-bold text-primary md:text-2xl">
                  {t('shop.product.descriptionTitle')}
                </h2>
                <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
                  {t(product.descriptionKey)}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-6 ring-1 ring-gray-100">
                <h3 className="text-base font-bold text-primary md:text-lg">
                  {t('shop.product.featuresTitle')}
                </h3>
                <ul className="mt-4 space-y-3">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                        <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                      </span>
                      {t(f)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="bg-gray-50 py-14 md:py-16">
            <div className="container">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary-700">
                    <span className="h-0.5 w-4 bg-secondary-500" />
                    {t('shop.product.relatedEyebrow')}
                  </div>
                  <h2 className="mt-3 text-xl font-bold tracking-tight text-primary md:text-2xl">
                    {t('shop.product.relatedTitle')}
                  </h2>
                </div>
                <Link
                  to="/boutique"
                  className="hidden text-sm font-bold text-secondary transition hover:text-secondary-700 sm:inline-flex sm:items-center sm:gap-2"
                >
                  {t('shop.product.viewAll')}
                  <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
