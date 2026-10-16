import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUp } from '@fortawesome/free-solid-svg-icons'

export default function ScrollUtilities() {
  const { pathname } = useLocation()
  const [showTop, setShowTop] = useState(false)

  // Reset scroll on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  // Show FAB after scrolling 600px
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reveal observer — applies .is-visible to any [data-reveal] element when it enters the viewport
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' },
    )

    const observeAll = () => {
      document
        .querySelectorAll('[data-reveal]:not(.is-visible)')
        .forEach((el) => observer.observe(el))
    }

    observeAll()
    const mo = new MutationObserver(observeAll)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mo.disconnect()
    }
  }, [pathname])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className={`fixed bottom-24 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-800 ${
        showTop ? 'pointer-events-auto opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <FontAwesomeIcon icon={faArrowUp} className="h-4 w-4" />
    </button>
  )
}
