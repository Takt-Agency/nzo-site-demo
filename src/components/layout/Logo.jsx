import { logos } from '../../assets/images'

export default function Logo({ variant = 'main', className = '' }) {
  const src = variant === 'white' ? logos.white : logos.main
  return (
    <a href="/" className={`inline-flex items-center ${className}`} aria-label="NZO Immo Clean">
      <img src={src} alt="NZO Immo Clean" className="h-11 w-auto md:h-12" />
    </a>
  )
}
