import { useCallback, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faChevronLeft,
  faChevronRight,
  faDownload,
  faClock,
} from '@fortawesome/free-solid-svg-icons'

// Reusable image lightbox. Mounted by parents that hold the list of photos
// and the active index. Keyboard navigation: Escape closes, ← → navigate.
//
// Props:
// - photos: [{ url, caption?, uploadedBy?, uploadedAt? }, ...]
// - index: number (current photo)
// - onClose: () => void
// - onIndexChange: (newIndex: number) => void
export default function PhotoLightbox({ photos = [], index = 0, onClose, onIndexChange }) {
  const total = photos.length
  const photo = photos[index]

  const go = useCallback(
    (delta) => {
      if (total === 0) return
      const next = (index + delta + total) % total
      onIndexChange?.(next)
    },
    [index, total, onIndexChange],
  )

  // Lock body scroll + bind keys while the lightbox is open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [go, onClose])

  if (!photo) return null

  const caption = photo.caption || photo.uploadedBy || ''
  const time = photo.uploadedAt
    ? new Intl.DateTimeFormat('fr-CH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(photo.uploadedAt))
    : ''

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Top bar */}
      <div
        className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent px-4 py-3 text-white sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 flex-1">
          {caption && <div className="truncate text-sm font-bold">{caption}</div>}
          {time && (
            <div className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/75">
              <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
              {time}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {total > 1 && (
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur-sm">
              {index + 1} / {total}
            </span>
          )}
          <a
            href={photo.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label="Télécharger"
            onClick={(e) => e.stopPropagation()}
          >
            <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label="Fermer"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Prev arrow */}
      {total > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            go(-1)
          }}
          aria-label="Photo précédente"
          className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white shadow-lg transition hover:bg-white/25 sm:left-6"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
        </button>
      )}

      {/* Image */}
      <div
        className="flex h-full w-full items-center justify-center p-6 sm:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={photo.url}
          src={photo.url}
          alt={caption || 'Photo'}
          className="max-h-full max-w-full select-none rounded-xl object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Next arrow */}
      {total > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            go(1)
          }}
          aria-label="Photo suivante"
          className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white shadow-lg transition hover:bg-white/25 sm:right-6"
        >
          <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
        </button>
      )}

      {/* Bottom thumbnail strip (only when several photos) */}
      {total > 1 && (
        <div
          className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 overflow-x-auto bg-gradient-to-t from-black/60 to-transparent px-4 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((p, i) => (
            <button
              key={p.id || p.url || i}
              type="button"
              onClick={() => onIndexChange?.(i)}
              className={`h-12 w-16 shrink-0 overflow-hidden rounded-md transition ${
                i === index
                  ? 'ring-2 ring-white shadow-md'
                  : 'opacity-60 ring-1 ring-white/30 hover:opacity-100'
              }`}
              aria-label={`Photo ${i + 1}`}
            >
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
