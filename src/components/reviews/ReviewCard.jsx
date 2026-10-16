import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faCheck, faQuoteLeft } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'

const avatarGradients = [
  'from-primary-700 to-secondary-700',
  'from-secondary-700 to-tertiary-600',
  'from-accent-700 to-accent-500',
  'from-primary-600 to-primary-800',
  'from-tertiary-600 to-secondary-600',
]

function formatDate(dateStr, locale = 'fr-CH') {
  try {
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' }).format(
      new Date(dateStr),
    )
  } catch {
    return dateStr
  }
}

function hashIndex(str, mod) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  return hash % mod
}

export default function ReviewCard({ review }) {
  const { t, i18n } = useTranslation()
  const gradient = avatarGradients[hashIndex(review.id, avatarGradients.length)]

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-secondary/30">
      <FontAwesomeIcon
        icon={faQuoteLeft}
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-5 h-10 w-10 text-secondary-50 transition group-hover:text-accent/15"
      />

      <div className="relative flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold tracking-wider text-white shadow-md ${gradient}`}
        >
          {review.initials}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-bold text-primary">{review.name}</h3>
            {review.verified && (
              <span
                aria-label={t('reviews.verified')}
                title={t('reviews.verified')}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-white"
              >
                <FontAwesomeIcon icon={faCheck} className="h-2 w-2" />
              </span>
            )}
          </div>
          <div className="text-[11px] font-medium text-gray-500">
            {review.location} · {formatDate(review.date, i18n.language)}
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <FontAwesomeIcon
            key={i}
            icon={faStar}
            className={`h-3.5 w-3.5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}
          />
        ))}
      </div>

      <p className="relative mt-4 flex-1 text-sm font-medium leading-relaxed text-gray-700">
        “{review.text}”
      </p>

      <div className="relative mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-700">
          {t(`services.${review.service}.title`)}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {review.source === 'google' ? (
            <>
              <FontAwesomeIcon icon={faGoogle} className="h-3 w-3 text-[#4285F4]" />
              Google
            </>
          ) : (
            t('reviews.source.direct')
          )}
        </span>
      </div>
    </article>
  )
}
