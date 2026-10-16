// Compact inline SVG flags. Windows doesn't render 🇫🇷/🇩🇪/… emoji flags in
// its system fonts (Segoe UI Emoji intentionally leaves them out), so on
// desktop users only see the two-letter code. Inline SVGs render everywhere,
// don't require a font, and don't hit the network.

const FLAGS = {
  fr: (
    <>
      <rect width="9" height="18" x="0" fill="#0055A4" />
      <rect width="9" height="18" x="9" fill="#fff" />
      <rect width="9" height="18" x="18" fill="#EF4135" />
    </>
  ),
  de: (
    <>
      <rect width="27" height="6" y="0" fill="#000" />
      <rect width="27" height="6" y="6" fill="#DD0000" />
      <rect width="27" height="6" y="12" fill="#FFCE00" />
    </>
  ),
  en: (
    // Union Jack — navy base, white diagonals + white cross, red cross overlay.
    // The red diagonals of the actual Union Jack are omitted for legibility at
    // this size; the cross is still unmistakable.
    <>
      <rect width="27" height="18" fill="#012169" />
      <path d="M0,0 L27,18 M27,0 L0,18" stroke="#fff" strokeWidth="3" />
      <path d="M13.5,0 v18 M0,9 h27" stroke="#fff" strokeWidth="5" />
      <path d="M13.5,0 v18 M0,9 h27" stroke="#C8102E" strokeWidth="2.8" />
    </>
  ),
  es: (
    <>
      <rect width="27" height="4.5" y="0" fill="#AA151B" />
      <rect width="27" height="9" y="4.5" fill="#F1BF00" />
      <rect width="27" height="4.5" y="13.5" fill="#AA151B" />
    </>
  ),
  it: (
    <>
      <rect width="9" height="18" x="0" fill="#008C45" />
      <rect width="9" height="18" x="9" fill="#F4F5F0" />
      <rect width="9" height="18" x="18" fill="#CD212A" />
    </>
  ),
  sr: (
    <>
      <rect width="27" height="6" y="0" fill="#C6363C" />
      <rect width="27" height="6" y="6" fill="#0C4076" />
      <rect width="27" height="6" y="12" fill="#fff" />
    </>
  ),
  tr: (
    <>
      <rect width="27" height="18" fill="#E30A17" />
      <circle cx="10" cy="9" r="4" fill="#fff" />
      <circle cx="11.2" cy="9" r="3.2" fill="#E30A17" />
      <polygon
        points="15.4,9 13.1,10 13.9,7.5 11.6,6 14.4,6 15.4,3.6 16.3,6 19.1,6 16.8,7.5 17.7,10"
        fill="#fff"
        transform="translate(-1.5,0)"
      />
    </>
  ),
}

// Map i18n language codes to SVGs. `en` uses the UK flag (the site targets a
// Swiss / European audience — the British flag reads as English better than
// the US one for this crowd).
export default function CountryFlag({ code, className = 'h-3.5 w-5' }) {
  const svg = FLAGS[code]
  if (!svg) return null
  return (
    <span
      className={`inline-block overflow-hidden rounded-[2px] ring-1 ring-black/10 ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 27 18" className="block h-full w-full">
        {svg}
      </svg>
    </span>
  )
}
