import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, GeoJSON, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { contactInfo } from '../../data/navigation.js'
import { baselStadt, baselLandschaft, switzerland } from '../../data/coverageZones.js'

// Services are strictly limited to Basel-Stadt (BS) and Basel-Landschaft
// (BL) — only places in those two cantons belong here. Basel's label is
// translated (Bâle / Basilea / …); the others are the same in every language.
const cantons = [
  {
    key: 'bs',
    shape: baselStadt,
    // Where the canton name is drawn on the map.
    labelAt: [47.598, 7.655],
    cities: [
      { key: 'riehen', label: 'Riehen', lat: 47.5788, lng: 7.6468 },
      { key: 'bettingen', label: 'Bettingen', lat: 47.5706, lng: 7.6646 },
    ],
  },
  {
    key: 'bl',
    shape: baselLandschaft,
    labelAt: [47.395, 7.72],
    cities: [
      { key: 'liestal', label: 'Liestal', lat: 47.484, lng: 7.7343, capital: true },
      { key: 'allschwil', label: 'Allschwil', lat: 47.5507, lng: 7.536 },
      { key: 'binningen', label: 'Binningen', lat: 47.5402, lng: 7.5693 },
      { key: 'muttenz', label: 'Muttenz', lat: 47.5228, lng: 7.645 },
      { key: 'pratteln', label: 'Pratteln', lat: 47.5203, lng: 7.6935 },
      { key: 'reinach', label: 'Reinach', lat: 47.4936, lng: 7.591 },
      { key: 'sissach', label: 'Sissach', lat: 47.4646, lng: 7.8132 },
      { key: 'laufen', label: 'Laufen', lat: 47.4219, lng: 7.4994 },
    ],
  },
]

// Bounding box of BS + BL — the main map is framed on it.
const ZONE_BOUNDS = [
  [47.3379, 7.3252],
  [47.6009, 7.9618],
]
const SWISS_BOUNDS = [
  [45.818, 5.956],
  [47.808, 10.492],
]

// Dark veil over everything OUTSIDE BS + BL: a world-sized polygon whose
// holes are the canton outlines, so only the service area stays bright.
const outerRings = (shape) =>
  shape.type === 'Polygon' ? [shape.coordinates[0]] : shape.coordinates.map((p) => p[0])
const outsideMask = {
  type: 'Polygon',
  coordinates: [
    [
      [-180, -85],
      [180, -85],
      [180, 85],
      [-180, 85],
      [-180, -85],
    ],
    ...outerRings(baselStadt),
    ...outerRings(baselLandschaft),
  ],
}

const zoneStyle = (key) => ({
  color: '#8cc44b',
  weight: 2,
  opacity: 0.95,
  fillColor: '#8cc44b',
  fillOpacity: key === 'bs' ? 0.26 : 0.14,
  className: 'nzo-zone',
})

const cityIcon = L.divIcon({
  className: '',
  html: `
    <div class="nzo-map-pin">
      <span class="nzo-map-pin__pulse"></span>
      <span class="nzo-map-pin__dot nzo-map-pin__dot--small"></span>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

// Head office (Gellertpark 6, Basel) — bigger pin with a building glyph.
const hqIcon = L.divIcon({
  className: '',
  html: `
    <div class="nzo-map-pin">
      <span class="nzo-map-pin__pulse"></span>
      <span class="nzo-map-pin__dot">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>
      </span>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

const labelIcon = (text) =>
  L.divIcon({
    className: '',
    html: `<div class="nzo-zone-label">${text}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })

export default function Coverage() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const basel = t('coverage.cityBasel')
  const hq = contactInfo.coordinates

  return (
    <section className="bg-primary-800 py-14 md:py-16 lg:py-20">
      <div className="container">
        <div data-reveal className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/85 backdrop-blur">
            <span className="h-0.5 w-4 bg-accent" />
            {t('coverage.eyebrow')}
          </div>
          <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl lg:text-4xl">
            {t('coverage.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-white/75 md:text-base">
            {t('coverage.description')}
          </p>
        </div>

        {/* Wrapper hosts the CSS invert filter so the OSM (light) tiles read
            as a dark map, matching the surrounding hero. Markers, the canton
            shapes (overlay pane) and tooltips are not inverted — see the
            .nzo-coverage-map rules in index.css. */}
        <div className="nzo-coverage-map relative isolate mt-10 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
          {mounted ? (
            <MapContainer
              bounds={ZONE_BOUNDS}
              boundsOptions={{ padding: [24, 24] }}
              zoomSnap={0.5}
              minZoom={8}
              maxZoom={13}
              scrollWheelZoom={false}
              dragging={!L.Browser.mobile}
              doubleClickZoom={false}
              zoomControl
              className="h-[420px] md:h-[520px]"
              style={{ width: '100%', background: '#0a1d33' }}
            >
              {/* Standard OSM tiles — free, no API key. The dark aesthetic
                  is faked via the CSS invert filter on the tilePane. */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />

              <GeoJSON
                data={outsideMask}
                interactive={false}
                style={{ stroke: false, fillColor: '#0a1d33', fillOpacity: 0.6 }}
              />
              {cantons.map((c) => (
                <GeoJSON key={c.key} data={c.shape} style={zoneStyle(c.key)} interactive={false} />
              ))}

              {cantons.map((c) => (
                <Marker
                  key={`label-${c.key}`}
                  position={c.labelAt}
                  icon={labelIcon(t(`about.coverage.regions.${c.key}.name`))}
                  interactive={false}
                />
              ))}

              {cantons.flatMap((c) =>
                c.cities.map((city) => (
                  <Marker key={city.key} position={[city.lat, city.lng]} icon={cityIcon}>
                    {/* Only the canton capital is always labelled — the
                        suburbs around Basel are too close to each other. */}
                    <Tooltip
                      direction="right"
                      offset={[12, 0]}
                      permanent={!!city.capital}
                      className="nzo-city-label"
                    >
                      {city.label}
                    </Tooltip>
                  </Marker>
                )),
              )}

              <Marker position={[hq.lat, hq.lng]} icon={hqIcon} zIndexOffset={1000}>
                <Tooltip direction="right" offset={[16, 0]} permanent className="nzo-city-label nzo-city-label--hq">
                  {basel} · {t('about.stats.seat.label')}
                </Tooltip>
              </Marker>
            </MapContainer>
          ) : (
            <div className="h-[420px] w-full bg-primary-900 md:h-[520px]" />
          )}

          {/* Locator inset — where the zone sits in Switzerland (north-west). */}
          {mounted && (
            <div className="pointer-events-none absolute bottom-3 left-3 z-[1100] rounded-xl border border-white/10 bg-primary-900/85 p-1.5 shadow-xl backdrop-blur sm:bottom-4 sm:left-4 sm:rounded-2xl sm:p-2">
              <MapContainer
                bounds={SWISS_BOUNDS}
                boundsOptions={{ padding: [6, 6] }}
                zoomSnap={0.1}
                zoomControl={false}
                attributionControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                boxZoom={false}
                keyboard={false}
                className="h-[74px] w-[115px] sm:h-[110px] sm:w-[170px]"
                style={{ background: 'transparent' }}
              >
                <GeoJSON
                  data={switzerland}
                  interactive={false}
                  style={{
                    color: 'rgba(255,255,255,0.55)',
                    weight: 1.2,
                    fillColor: '#ffffff',
                    fillOpacity: 0.06,
                  }}
                />
                {cantons.map((c) => (
                  <GeoJSON
                    key={`mini-${c.key}`}
                    data={c.shape}
                    interactive={false}
                    style={{ color: '#8cc44b', weight: 1, fillColor: '#8cc44b', fillOpacity: 0.9 }}
                  />
                ))}
              </MapContainer>
              <div className="mt-1 text-center text-[8px] font-bold uppercase tracking-wider text-white/70 sm:text-[10px]">
                {t('coverage.locator')}
              </div>
            </div>
          )}
        </div>

        {/* Places served, grouped by canton. */}
        <div className="mt-8 flex flex-col items-center gap-4">
          {cantons.map((c) => (
            <div
              key={c.key}
              className="flex flex-wrap items-center justify-center gap-2.5"
            >
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-accent">
                {t(`about.coverage.regions.${c.key}.name`)}
              </span>
              {(c.key === 'bs' ? [{ key: 'basel', label: basel }, ...c.cities] : c.cities).map(
                (city) => (
                  <span
                    key={city.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur transition hover:border-accent/60 hover:bg-accent/10 hover:text-white"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {city.label}
                  </span>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
