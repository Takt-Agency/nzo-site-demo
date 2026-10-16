import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLocationDot,
  faCircle,
  faBatteryFull,
  faBatteryHalf,
  faBatteryQuarter,
  faBoltLightning,
  faSpinner,
  faSatelliteDish,
  faTriangleExclamation,
  faSprayCanSparkles,
  faCar,
  faPersonWalking,
  faPause,
  faQuestion,
  faHouseCircleCheck,
  faRoute,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import { adminApi } from '../../lib/api.js'
import { getAdminSocket } from '../../lib/realtime.js'

// Default view — geographical centre of the Lake Geneva area. Falls back
// there when no agent has ever pinged, otherwise we auto-fit on the pins.
const FALLBACK_CENTER = [46.5197, 6.6323]
const FALLBACK_ZOOM = 9

// Motion state → icon + human label. `unknown` is deliberately blank on the
// pin (only shown in the callout) to avoid visual noise.
const MOTION = {
  driving: { icon: faCar, label: 'En route', color: 'text-secondary-700', bg: 'bg-secondary-50' },
  walking: { icon: faPersonWalking, label: 'À pied', color: 'text-accent-700', bg: 'bg-accent-50' },
  stationary: { icon: faPause, label: 'À l\'arrêt', color: 'text-gray-700', bg: 'bg-gray-100' },
  unknown: { icon: faQuestion, label: '—', color: 'text-gray-500', bg: 'bg-gray-100' },
}

// Human distance ("120 m" / "1.4 km"). Returns null for absent input.
function fmtDist(m) {
  if (m == null) return null
  if (m < 1000) return `${m} m`
  return `${(m / 1000).toFixed(1)} km`
}

// Same thresholds as backend so a socket-driven update matches what a
// full REST refetch would return.
function motionFromSpeed(speed) {
  if (speed == null || speed < 0) return 'unknown'
  if (speed < 0.5) return 'stationary'
  if (speed < 2.5) return 'walking'
  return 'driving'
}

// Haversine — matches backend logic. Kept client-side so Socket.IO pings
// can update the on-site badge without waiting for the next 45s poll.
function haversineMeters(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null
  const R = 6371000
  const toRad = (v) => (v * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(s)))
}
const ON_SITE_RADIUS_M = 100

// Build a coloured pin per status. Leaflet's default icon relies on webpack
// magic that Vite doesn't do out of the box, so we inline an SVG div-icon.
function buildPinIcon(color) {
  const html = `
    <div style="position:relative;width:32px;height:40px;transform:translate(-16px,-40px);">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
        <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 24 16 24s16-13 16-24C32 7.2 24.8 0 16 0Z"
              fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="#ffffff"/>
      </svg>
    </div>`
  return L.divIcon({
    html,
    className: 'nzo-pin',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  })
}

const PIN_ONLINE = buildPinIcon('#16a34a')
const PIN_STALE = buildPinIcon('#f59e0b')
const PIN_OFFLINE = buildPinIcon('#9ca3af')

// Hex colours for the pin fill / ring — distinct from STATUS_COLOR below
// which stores Tailwind text classes for popup + list rendering.
const STATUS_HEX = {
  online: '#16a34a',
  stale: '#f59e0b',
  offline: '#9ca3af',
}

// Photo-based pin — 40×48 circular avatar with a coloured status ring and
// a tail pointing at the coord. Cached per (photoUrl, status) so panning
// the map doesn't rebuild icons every render.
const photoPinCache = new Map()
function buildPhotoPin(photoUrl, status) {
  const key = `${status}::${photoUrl}`
  if (photoPinCache.has(key)) return photoPinCache.get(key)
  const color = STATUS_HEX[status] || '#9ca3af'
  const html = `
    <div style="position:relative;width:44px;height:52px;transform:translate(-22px,-52px);">
      <div style="width:40px;height:40px;border-radius:9999px;border:3px solid ${color};background:#fff;
                  overflow:hidden;box-shadow:0 3px 6px rgba(0,0,0,0.25);position:absolute;left:2px;top:2px;">
        <img src="${photoUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />
      </div>
      <div style="position:absolute;left:50%;bottom:0;width:0;height:0;transform:translateX(-50%);
                  border-left:6px solid transparent;border-right:6px solid transparent;
                  border-top:8px solid ${color};"></div>
    </div>`
  const icon = L.divIcon({
    html,
    className: 'nzo-pin',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -48],
  })
  photoPinCache.set(key, icon)
  return icon
}

function pinFor(agent) {
  if (agent.photoUrl) return buildPhotoPin(agent.photoUrl, agent.status)
  if (agent.status === 'online') return PIN_ONLINE
  if (agent.status === 'stale') return PIN_STALE
  return PIN_OFFLINE
}

const STATUS_LABEL = {
  online: 'En ligne',
  stale: 'Hors ligne récent',
  offline: 'Hors ligne',
}

const STATUS_COLOR = {
  online: 'text-emerald-600',
  stale: 'text-amber-600',
  offline: 'text-gray-500',
}

function batteryIcon(pct) {
  if (pct == null) return null
  if (pct > 60) return faBatteryFull
  if (pct > 25) return faBatteryHalf
  return faBatteryQuarter
}

function timeAgo(iso) {
  if (!iso) return '—'
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `il y a ${s}s`
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`
  return `il y a ${Math.round(s / 86400)} j`
}

// AutoFit — pans/zooms the map to fit all pins whenever they change.
// Guarded so it only runs once per hard refresh (not on every socket ping).
function AutoFit({ points, deps }) {
  const map = useMap()
  useEffect(() => {
    if (!points || points.length === 0) return
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13)
      return
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return null
}

export default function Carte() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [connected, setConnected] = useState(false)
  // Force AutoFit to re-run when the number of pins changes, but not on
  // every location tick (which would fight the user's zoom).
  const [fitKey, setFitKey] = useState(0)
  const initialLoadRef = useRef(false)

  // Initial fetch of the last known position for every active agent.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const res = await adminApi.listLiveAgents()
        if (cancelled) return
        setItems(res.items || [])
        setError(null)
        if (!initialLoadRef.current) {
          initialLoadRef.current = true
          setFitKey((k) => k + 1)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Chargement impossible')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    // Refresh every 45s as a safety net if the socket drops silently.
    const iv = setInterval(load, 45_000)
    return () => {
      cancelled = true
      clearInterval(iv)
    }
  }, [])

  // Subscribe to live GPS pings via Socket.IO.
  useEffect(() => {
    const socket = getAdminSocket()
    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onLoc = (payload) => {
      setItems((prev) => {
        const idx = prev.findIndex((it) => it.userId === payload.userId)
        if (idx === -1) return prev // agent not in the active list — ignore
        const next = [...prev]
        const item = next[idx]
        // Recompute derived fields client-side so the socket update matches
        // what a full REST refetch would return (mission info stays from
        // the last poll — that's fine, it changes slowly).
        const newLoc = {
          lat: payload.lat,
          lng: payload.lng,
          accuracy: payload.accuracy,
          speed: payload.speed,
          battery: payload.battery,
          isCharging: payload.isCharging,
          missionId: payload.missionId,
          at: payload.at,
        }
        let distanceToMission = item.distanceToMission
        let onSite = item.onSite
        if (item.mission?.geo) {
          distanceToMission = haversineMeters(
            { lat: newLoc.lat, lng: newLoc.lng },
            item.mission.geo,
          )
          if (distanceToMission != null) {
            onSite = distanceToMission <= ON_SITE_RADIUS_M
          }
        }
        next[idx] = {
          ...item,
          status: 'online',
          motion: motionFromSpeed(newLoc.speed),
          location: newLoc,
          distanceToMission,
          onSite,
        }
        return next
      })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('agent:location', onLoc)
    if (socket.connected) setConnected(true)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('agent:location', onLoc)
    }
  }, [])

  const filtered = useMemo(() => {
    let list = items
    if (statusFilter !== 'all') list = list.filter((a) => a.status === statusFilter)
    return list
  }, [items, statusFilter])

  const withPos = useMemo(() => filtered.filter((a) => a.location), [filtered])

  const stats = useMemo(() => {
    const c = { online: 0, stale: 0, offline: 0 }
    for (const a of items) c[a.status] = (c[a.status] || 0) + 1
    return c
  }, [items])

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="Terrain"
        title="Carte live des agents"
        subtitle="Dernière position connue de chaque agent, mise à jour en temps réel."
      />

      {/* Top bar — connection status + status filter + counters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
              connected
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
            }`}
          >
            <FontAwesomeIcon
              icon={connected ? faSatelliteDish : faTriangleExclamation}
              className="h-3 w-3"
            />
            {connected ? 'Temps réel actif' : 'Reconnexion…'}
          </span>
          <span className="text-xs font-semibold text-gray-500">
            {items.length} agent{items.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'all', label: `Tous · ${items.length}` },
            { key: 'online', label: `En ligne · ${stats.online || 0}`, dot: '#16a34a' },
            { key: 'stale', label: `Récent · ${stats.stale || 0}`, dot: '#f59e0b' },
            { key: 'offline', label: `Hors ligne · ${stats.offline || 0}`, dot: '#9ca3af' },
          ].map(({ key, label, dot }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-primary/40'
              }`}
            >
              {dot && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: dot }}
                />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="relative h-[65vh] min-h-[420px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {loading && items.length === 0 && (
              <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/70">
                <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {error && (
              <div className="absolute inset-x-4 top-4 z-[500] rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 shadow">
                {error}
              </div>
            )}
            <MapContainer
              center={FALLBACK_CENTER}
              zoom={FALLBACK_ZOOM}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <AutoFit points={withPos.map((a) => a.location)} deps={[fitKey]} />
              {withPos.map((a) => (
                <Marker
                  key={a.userId}
                  position={[a.location.lat, a.location.lng]}
                  icon={pinFor(a)}
                  eventHandlers={{ click: () => setSelectedId(a.agentId) }}
                >
                  <Popup>
                    <div className="min-w-[220px] text-xs">
                      <div className="text-sm font-bold text-primary">{a.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`font-semibold ${STATUS_COLOR[a.status]}`}>
                          {STATUS_LABEL[a.status]}
                        </span>
                        <span className="text-gray-400">·</span>
                        <span className="text-[11px] text-gray-500">
                          {timeAgo(a.location.at)}
                        </span>
                      </div>

                      {/* Motion pill */}
                      {a.motion && a.motion !== 'unknown' && (
                        <div
                          className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${MOTION[a.motion].bg}`}
                        >
                          <FontAwesomeIcon
                            icon={MOTION[a.motion].icon}
                            className={`h-3 w-3 ${MOTION[a.motion].color}`}
                          />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${MOTION[a.motion].color}`}>
                            {MOTION[a.motion].label}
                            {a.location.speed != null && a.location.speed > 0.5 && (
                              <> · {Math.round(a.location.speed * 3.6)} km/h</>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Current mission */}
                      {a.mission ? (
                        <div className="mt-3 rounded-lg border border-accent-100 bg-accent-50/60 p-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-700">
                            <FontAwesomeIcon icon={faSprayCanSparkles} className="h-3 w-3" />
                            {a.mission.status === 'inProgress' ? 'En intervention' : 'Mission prévue'}
                          </div>
                          <div className="mt-1 text-xs font-bold text-primary" title={a.mission.title}>
                            {a.mission.title}
                          </div>
                          <div className="mt-0.5 text-[11px] text-gray-600">
                            {a.mission.clientName}
                          </div>
                          {(a.mission.address || a.mission.city) && (
                            <div className="mt-1 text-[10px] text-gray-500">
                              📍 {[a.mission.address, a.mission.city].filter(Boolean).join(', ')}
                            </div>
                          )}
                          {/* On-site / En route indicator */}
                          {a.onSite === true && (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5">
                              <FontAwesomeIcon icon={faHouseCircleCheck} className="h-3 w-3 text-emerald-700" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                Sur site
                              </span>
                            </div>
                          )}
                          {a.onSite === false && a.distanceToMission != null && (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5">
                              <FontAwesomeIcon icon={faRoute} className="h-3 w-3 text-amber-700" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                À {fmtDist(a.distanceToMission)} du site
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 text-[11px] italic text-gray-400">
                          Aucune mission active
                        </div>
                      )}

                      {/* Battery */}
                      {a.location.battery != null && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-600">
                          <FontAwesomeIcon
                            icon={a.location.isCharging ? faBoltLightning : batteryIcon(a.location.battery)}
                            className="h-3 w-3"
                          />
                          {a.location.battery}%
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
              {/* Accuracy circles for online agents only, kept subtle. */}
              {withPos
                .filter((a) => a.status === 'online' && a.location.accuracy)
                .map((a) => (
                  <CircleMarker
                    key={`acc-${a.userId}`}
                    center={[a.location.lat, a.location.lng]}
                    radius={Math.min(30, Math.max(6, a.location.accuracy / 10))}
                    pathOptions={{
                      color: '#16a34a',
                      opacity: 0.3,
                      fillOpacity: 0.1,
                      weight: 1,
                    }}
                  />
                ))}
            </MapContainer>
          </div>
        </div>

        {/* Agent list panel */}
        <aside className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between px-2 pt-1">
            <h3 className="text-sm font-bold text-primary">Agents</h3>
            <button
              type="button"
              onClick={() => setFitKey((k) => k + 1)}
              className="text-[11px] font-bold text-secondary hover:text-secondary-700"
            >
              Recentrer
            </button>
          </div>
          <ul className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <li className="rounded-xl bg-gray-50 p-4 text-center text-xs font-medium text-gray-500">
                Aucun agent à afficher.
              </li>
            )}
            {filtered.map((a) => {
              const active = selectedId === a.agentId
              return (
                <li key={a.agentId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.agentId)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-xs transition ${
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 bg-white hover:border-primary/30 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <FontAwesomeIcon
                        icon={faCircle}
                        className={`h-2 w-2 ${STATUS_COLOR[a.status]}`}
                      />
                    </span>
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate text-sm font-bold text-primary">{a.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-gray-500">
                        <span className={STATUS_COLOR[a.status]}>{STATUS_LABEL[a.status]}</span>
                        <span>·</span>
                        <span>{timeAgo(a.location?.at)}</span>
                      </div>

                      {/* Motion + speed */}
                      {a.motion && a.motion !== 'unknown' && (
                        <div className={`mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ${MOTION[a.motion].bg}`}>
                          <FontAwesomeIcon icon={MOTION[a.motion].icon} className={`h-2.5 w-2.5 ${MOTION[a.motion].color}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${MOTION[a.motion].color}`}>
                            {MOTION[a.motion].label}
                            {a.location?.speed != null && a.location.speed > 0.5 && (
                              <> · {Math.round(a.location.speed * 3.6)} km/h</>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Active mission summary */}
                      {a.mission && (
                        <div className="mt-1.5 truncate text-[11px] text-gray-700">
                          <FontAwesomeIcon icon={faSprayCanSparkles} className="mr-1 h-2.5 w-2.5 text-accent-600" />
                          <span className="font-semibold">{a.mission.title}</span>
                        </div>
                      )}

                      {/* On-site badge */}
                      {a.onSite === true && (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <FontAwesomeIcon icon={faHouseCircleCheck} className="h-2.5 w-2.5" />
                          Sur site
                        </div>
                      )}
                      {a.onSite === false && a.distanceToMission != null && (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          <FontAwesomeIcon icon={faRoute} className="h-2.5 w-2.5" />
                          À {fmtDist(a.distanceToMission)} du site
                        </div>
                      )}

                      {!a.consent && (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          <FontAwesomeIcon icon={faTriangleExclamation} className="h-2.5 w-2.5" />
                          Sans consentement
                        </div>
                      )}
                      {a.location?.battery != null && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-gray-500">
                          <FontAwesomeIcon
                            icon={a.location.isCharging ? faBoltLightning : batteryIcon(a.location.battery)}
                            className="h-3 w-3"
                          />
                          {a.location.battery}%
                        </div>
                      )}
                    </div>
                    {a.location && (
                      <FontAwesomeIcon
                        icon={faLocationDot}
                        className={`h-3.5 w-3.5 shrink-0 ${STATUS_COLOR[a.status]}`}
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>
      </div>
    </div>
  )
}
