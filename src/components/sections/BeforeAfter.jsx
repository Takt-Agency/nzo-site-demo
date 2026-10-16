import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLeftRight, faHandPointer } from '@fortawesome/free-solid-svg-icons'
import { beforeAfter } from '../../assets/images'

export default function BeforeAfter() {
  const { t } = useTranslation()
  const containerRef = useRef(null)
  const [position, setPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const updateFromClientX = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.max(0, Math.min(100, pct)))
  }, [])

  const handlePointerDown = (e) => {
    setIsDragging(true)
    setHasInteracted(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromClientX(e.clientX)
  }
  const handlePointerMove = (e) => {
    if (!isDragging) return
    updateFromClientX(e.clientX)
  }
  const handlePointerUp = (e) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      setHasInteracted(true)
      setPosition((p) => Math.max(0, p - 5))
    } else if (e.key === 'ArrowRight') {
      setHasInteracted(true)
      setPosition((p) => Math.min(100, p + 5))
    } else if (e.key === 'Home') {
      setPosition(0)
    } else if (e.key === 'End') {
      setPosition(100)
    }
  }

  return (
    <section className="relative isolate overflow-hidden bg-gray-50 py-16 md:py-20 lg:py-24">
      <div className="absolute -top-32 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary-100/60 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 -z-10 h-80 w-80 rounded-full bg-accent-100/60 blur-3xl" />

      <div className="container">
        <div data-reveal className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-700">
            <span className="h-0.5 w-4 bg-accent-500" />
            {t('beforeAfter.eyebrow')}
          </div>
          <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-primary md:text-3xl lg:text-4xl">
            {t('beforeAfter.sectionTitle')}
          </h2>
          <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
            {t('beforeAfter.sectionDescription')}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <div
            ref={containerRef}
            role="slider"
            tabIndex={0}
            aria-label={t('beforeAfter.ariaLabel')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
            className="group relative aspect-[16/10] cursor-ew-resize touch-none select-none overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
          >
            <img
              src={beforeAfter.avant}
              alt={t('beforeAfter.before')}
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />

            <div
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${position}%)` }}
            >
              <img
                src={beforeAfter.apres}
                alt={t('beforeAfter.after')}
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>

            <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/30 ring-1 ring-white/10">
              {t('beforeAfter.before')}
            </div>
            <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-accent/30 ring-1 ring-white/10">
              {t('beforeAfter.after')}
            </div>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15" />

            <div
              className="pointer-events-none absolute inset-y-0 z-20 -translate-x-1/2"
              style={{ left: `${position}%` }}
            >
              <div className="mx-auto h-full w-[3px] bg-gradient-to-b from-white/70 via-white to-white/70 shadow-[0_0_12px_rgba(0,0,0,0.35)]" />

              <div
                className={`absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-2xl ring-4 ring-accent/90 transition-transform ${
                  isDragging ? 'scale-110' : 'group-hover:scale-105'
                }`}
              >
                {!hasInteracted && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/30" />
                )}
                <FontAwesomeIcon icon={faLeftRight} className="h-[22px] w-[22px] text-primary" />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-700">
            <FontAwesomeIcon icon={faHandPointer} className="h-3.5 w-3.5 text-accent" />
            {t('beforeAfter.hint')}
          </div>
        </div>
      </div>
    </section>
  )
}
