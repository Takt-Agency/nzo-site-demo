import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { contactInfo } from '../../data/navigation.js'
import 'leaflet/dist/leaflet.css'

const pinIcon = L.divIcon({
  className: '',
  html: `
    <div class="nzo-map-pin">
      <span class="nzo-map-pin__pulse"></span>
      <span class="nzo-map-pin__dot">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>
        </svg>
      </span>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

export default function ContactMap() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const { lat, lng } = contactInfo.coordinates
  // Route by geocoded address rather than raw lat/lng — Google snaps to the
  // right building entrance and honours the address text if the coordinates
  // drift slightly in future map updates.
  const encodedAddress = encodeURIComponent(contactInfo.address.full)
  const itineraryUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="bg-white py-16 md:py-20 lg:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-primary md:text-3xl">
            <span className="text-accent">|</span> {t('contact.map.title')}
          </h2>
          <p className="mt-2.5 text-sm font-medium text-gray-600">
            {t('contact.map.subtitle')}
          </p>
          {/* Full address shown under the subtitle so visitors can copy it
              even before opening the map — helps screen readers too. */}
          <p className="mt-1 text-sm font-semibold text-primary">
            {contactInfo.address.line1} · {contactInfo.address.line2}
          </p>
        </div>

        <div className="relative isolate mt-10 overflow-hidden rounded-3xl shadow-xl ring-1 ring-gray-100">
          {mounted && (
            <MapContainer
              center={[lat, lng]}
              // Zoom 17 = building-level view. Was 13 which showed the whole
              // city and defeated the purpose of a "find us" map.
              zoom={17}
              scrollWheelZoom={false}
              style={{ height: '440px', width: '100%' }}
            >
              {/* Plain OpenStreetMap tiles — no API key, free up to zoom 19,
                  and within OSM's fair-use policy for a low-traffic contact
                  page. CARTO's light theme was prettier but silently switched
                  to "API KEY REQUIRED" watermarks past zoom 15, breaking the
                  building-level view we need here. */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <Marker position={[lat, lng]} icon={pinIcon} />
            </MapContainer>
          )}
          {!mounted && <div className="h-[440px] w-full bg-gray-100" />}
        </div>

        <div className="mt-6 flex justify-center">
          <a
            href={itineraryUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 text-sm font-bold text-secondary transition hover:text-secondary-700"
          >
            {t('contact.map.directions')}
            <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  )
}
