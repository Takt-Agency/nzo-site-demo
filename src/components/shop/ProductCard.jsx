import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faCartPlus, faCheck } from '@fortawesome/free-solid-svg-icons'
import { useCart, formatPrice } from '../../context/CartContext.jsx'
import ProductImage from './ProductImage.jsx'

const badgeStyles = {
  promo: 'bg-red-500 text-white',
  new: 'bg-accent text-white',
  bestseller: 'bg-secondary text-white',
}

export default function ProductCard({ product }) {
  const { t } = useTranslation()
  const { addItem } = useCart()
  const outOfStock = product.stock === 0

  const onAdd = (e) => {
    e.preventDefault()
    if (outOfStock) return
    addItem(product, 1)
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link
        to={`/boutique/${product.slug}`}
        aria-label={t(product.nameKey)}
        className="relative block aspect-square overflow-hidden"
      >
        <ProductImage category={product.category} size="lg" />

        {product.badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow ${
              badgeStyles[product.badge] || 'bg-gray-700 text-white'
            }`}
          >
            {t(`shop.badge.${product.badge}`)}
          </span>
        )}

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <span className="rounded-full bg-gray-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              {t('shop.outOfStock')}
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
          <FontAwesomeIcon icon={faStar} className="h-2.5 w-2.5 text-yellow-400" />
          <span>{product.rating.toFixed(1)}</span>
          <span className="text-gray-300">·</span>
          <span>
            {product.reviewsCount} {t('shop.reviews')}
          </span>
        </div>

        <h3 className="mt-1.5 line-clamp-2 text-sm font-bold text-primary">
          <Link to={`/boutique/${product.slug}`} className="transition hover:text-secondary">
            {t(product.nameKey)}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-500">
          {t(product.shortKey)}
        </p>

        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-primary">{formatPrice(product.price)}</span>
              {product.oldPrice && (
                <span className="text-xs font-medium text-gray-400 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onAdd}
              disabled={outOfStock}
              aria-label={t('shop.addToCart')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-md shadow-accent/30 transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
            >
              <FontAwesomeIcon icon={outOfStock ? faCheck : faCartPlus} className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
