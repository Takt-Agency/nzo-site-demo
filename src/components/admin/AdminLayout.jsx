import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faBellSlash,
  faShieldHalved,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from './AdminSidebar.jsx'
import AdminTopBar from './AdminTopBar.jsx'
import { adminApi } from '../../lib/api.js'
import { getAdminSocket } from '../../lib/realtime.js'

// URL of the alarm sound bundled with the app. Vite serves anything under
// /public at the root, so an admin never needs to fetch a code chunk to
// play it. If the file is missing, playback silently no-ops and the visual
// banner still fires.
const SOS_SOUND_URL = '/sounds/sos_alarm.wav'

export default function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [counts, setCounts] = useState({})
  const [sosBanner, setSosBanner] = useState(null) // { id, agentName, missionTitle }
  const audioRef = useRef(null)
  const location = useLocation()

  // Pull the real-time counts for the sidebar badges. Refresh on every
  // route change (so when admin handles a devis and navigates back, the
  // number reflects the new state) and poll every 60s as a safety net.
  useEffect(() => {
    let cancelled = false
    const fetchCounts = async () => {
      try {
        const res = await adminApi.sidebarCounts()
        if (!cancelled) setCounts(res.counts || {})
      } catch {
        /* badges stay at their previous value on transient errors */
      }
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 60000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [location.pathname])

  // Realtime SOS alarm — listen on the admin socket. When an agent fires a
  // SOS, the backend emits `sos:alert` to every connected admin. We show a
  // full-width red banner + loop an alarm sound + fire a browser
  // notification. Sound stays until the admin dismisses the banner or opens
  // the SOS detail page.
  useEffect(() => {
    let socket = null
    let cancelled = false
    const onSos = (payload) => {
      if (payload?.event === 'ack' || payload?.event === 'resolve') return
      setSosBanner({
        id: payload?.id || payload?.refId,
        agentName: payload?.agentName || 'Agent',
        missionTitle: payload?.missionTitle || null,
      })
      try {
        // Clean up any previous alarm before starting a new one.
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
        const a = new Audio(SOS_SOUND_URL)
        a.loop = true
        a.volume = 1.0
        // Browsers block autoplay until the user has interacted with the
        // page once. On admin dashboards this is almost always the case;
        // we swallow the rejection so the visual banner still shows.
        a.play().catch(() => {})
        audioRef.current = a
      } catch {
        /* ignore audio failures */
      }
      try {
        if (typeof Notification !== 'undefined') {
          if (Notification.permission === 'default') Notification.requestPermission()
          if (Notification.permission === 'granted') {
            new Notification('🚨 SOS AGENT', {
              body: `${payload?.agentName || 'Agent'} a déclenché une alerte.`,
              requireInteraction: true,
              tag: 'nzo-sos',
            })
          }
        }
      } catch {
        /* ignore */
      }
    }

    ;(async () => {
      try {
        socket = await getAdminSocket()
        if (cancelled) return
        socket.on('sos:alert', onSos)
      } catch {
        /* socket unavailable — banner just won't fire */
      }
    })()

    return () => {
      cancelled = true
      socket?.off?.('sos:alert', onSos)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const dismissSos = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setSosBanner(null)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SOS pulse — sits above the whole layout so it can't be scrolled
          past. Pulses red so peripheral vision catches it even if the
          admin is looking at another tab and only glances back. */}
      {sosBanner ? (
        <div className="fixed inset-x-0 top-0 z-[100] animate-[nzoSosPulse_1.2s_ease-in-out_infinite] bg-red-600 text-white shadow-2xl">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/40">
              <FontAwesomeIcon icon={faShieldHalved} className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                🚨 SOS Agent — intervention urgente
              </div>
              <div className="mt-0.5 truncate text-sm font-bold">
                {sosBanner.agentName}
                {sosBanner.missionTitle ? ` · ${sosBanner.missionTitle}` : ''}
              </div>
            </div>
            <Link
              to={`/admin/sos/${sosBanner.id}`}
              onClick={dismissSos}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-red-700 shadow transition hover:bg-red-50"
            >
              Voir l'alerte
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={dismissSos}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/40 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/10"
              title="Couper l'alarme"
            >
              <FontAwesomeIcon icon={faBellSlash} className="h-3 w-3" />
              Couper
            </button>
          </div>
          {/* Inline keyframes — Tailwind arbitrary animation names can't
              carry a keyframes definition, so we ship them via a style
              tag. Scoped to this banner via unique name. */}
          <style>{`
            @keyframes nzoSosPulse {
              0%, 100% { background-color: #dc2626; }
              50% { background-color: #7f1d1d; }
            }
          `}</style>
        </div>
      ) : null}

      <div className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <AdminSidebar counts={counts} />
        </div>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-72 max-w-[85%] flex-col">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute -right-12 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-md"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </button>
            <AdminSidebar onNavigate={() => setMobileNavOpen(false)} counts={counts} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AdminTopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
