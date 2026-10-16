import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faArrowRight,
  faCircleCheck,
  faCircleExclamation,
  faEnvelopeOpen,
  faSpinner,
  faRotate,
} from '@fortawesome/free-solid-svg-icons'
import Logo from '../components/layout/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 45

function landingRouteFor(user) {
  if (!user) return '/espace-client'
  if (user.role === 'admin') return '/admin'
  if (user.role === 'agent') return '/espace-agent'
  return '/espace-client'
}

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { verifyEmail, resendVerificationCode } = useAuth()

  const email = searchParams.get('email') || ''
  const next = searchParams.get('next') || null

  const [digits, setDigits] = useState(() => Array(CODE_LENGTH).fill(''))
  const [status, setStatus] = useState(null) // 'verifying' | 'resending' | null
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [cooldown, setCooldown] = useState(0)

  const inputsRef = useRef([])
  const code = useMemo(() => digits.join(''), [digits])

  // Redirect if email is missing from the URL — nothing we can do without it.
  useEffect(() => {
    if (!email) navigate('/signup', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  // Focus first input on mount.
  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const handleChange = (index, raw) => {
    const value = raw.replace(/\D/g, '')
    if (!value) {
      setDigits((prev) => {
        const next = [...prev]
        next[index] = ''
        return next
      })
      return
    }
    // Paste-safe: if the user pastes the whole code into one box, spread it.
    if (value.length > 1) {
      const chars = value.slice(0, CODE_LENGTH - index).split('')
      setDigits((prev) => {
        const next = [...prev]
        for (let i = 0; i < chars.length; i++) next[index + i] = chars[i]
        return next
      })
      const nextIndex = Math.min(CODE_LENGTH - 1, index + chars.length)
      inputsRef.current[nextIndex]?.focus()
      return
    }
    setDigits((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
    if (index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return
    e.preventDefault()
    const next = Array(CODE_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    inputsRef.current[Math.min(CODE_LENGTH - 1, pasted.length)]?.focus()
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (code.length !== CODE_LENGTH) {
      setError('Merci de saisir les 6 chiffres.')
      return
    }
    setError(null)
    setInfo(null)
    setStatus('verifying')
    try {
      const user = await verifyEmail({ email, code })
      // Prefer explicit ?next redirect (e.g. after devis inscription flow),
      // otherwise route by role.
      navigate(next ? decodeURIComponent(next) : landingRouteFor(user), { replace: true })
    } catch (err) {
      setError(err.message || 'Code invalide.')
      // Reset input on invalid code so the user can retry quickly.
      setDigits(Array(CODE_LENGTH).fill(''))
      inputsRef.current[0]?.focus()
    } finally {
      setStatus(null)
    }
  }

  const onResend = async () => {
    if (cooldown > 0) return
    setError(null)
    setInfo(null)
    setStatus('resending')
    try {
      await resendVerificationCode({ email })
      setInfo(`Un nouveau code a été envoyé à ${email}.`)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setDigits(Array(CODE_LENGTH).fill(''))
      inputsRef.current[0]?.focus()
    } catch (err) {
      setError(err.message || 'Impossible de renvoyer le code.')
    } finally {
      setStatus(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="flex flex-1 flex-col p-6 md:p-10 lg:p-14">
          <header className="flex items-center justify-between">
            <Logo />
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
              Retour à l'inscription
            </Link>
          </header>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent-700">
              <FontAwesomeIcon icon={faEnvelopeOpen} className="h-6 w-6" />
            </div>

            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-700">
              Vérification
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary md:text-3xl">
              Confirmez votre email
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500">
              Nous avons envoyé un code à 6 chiffres à{' '}
              <span className="font-bold text-primary">{email}</span>. Saisissez-le ci-dessous pour
              activer votre compte.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="flex items-center justify-between gap-2" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={CODE_LENGTH}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="h-14 w-12 rounded-xl border-2 border-gray-200 bg-white text-center text-2xl font-bold text-primary shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  />
                  <span>{error}</span>
                </div>
              )}
              {info && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                  <FontAwesomeIcon icon={faCircleCheck} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{info}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status !== null || code.length !== CODE_LENGTH}
                className="btn-primary w-full px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'verifying' ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                )}
                Valider mon compte
              </button>

              <div className="flex flex-col items-center gap-2 pt-2 text-center text-xs font-medium text-gray-500">
                <span>Vous n'avez pas reçu le code ?</span>
                <button
                  type="button"
                  onClick={onResend}
                  disabled={status !== null || cooldown > 0}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-4 py-2 text-xs font-bold text-primary transition hover:border-accent hover:text-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'resending' ? (
                    <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faRotate} className="h-3 w-3" />
                  )}
                  {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer un code'}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-xs font-medium text-gray-500">
              Mauvaise adresse ?{' '}
              <Link to="/signup" className="font-bold text-secondary hover:text-secondary-700">
                Créer un autre compte
              </Link>
            </p>
          </div>

          <footer className="text-center text-[11px] font-medium text-gray-400">
            Le code expire au bout de 15 minutes.
          </footer>
        </div>

        <aside className="relative isolate hidden overflow-hidden bg-primary-900 lg:flex lg:w-[42%] lg:flex-col lg:justify-center lg:p-14">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900" />
          <div className="absolute -top-32 -left-32 -z-10 h-72 w-72 rounded-full bg-secondary-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
          <div className="max-w-md text-white/85">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Sécurité
            </div>
            <h2 className="mt-5 text-2xl font-bold leading-tight text-white md:text-3xl">
              Un compte, plus sûr.
            </h2>
            <p className="mt-4 text-sm font-medium leading-relaxed">
              La vérification par email nous permet de garantir qu'aucun tiers ne s'inscrit avec
              votre adresse. C'est une étape rapide qui protège votre espace, vos devis et vos
              factures.
            </p>
            <ul className="mt-8 space-y-4 text-sm font-medium">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                  <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                </span>
                Code à usage unique, valable 15 min.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                  <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                </span>
                Aucune donnée bancaire demandée.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                  <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                </span>
                Vous pouvez renvoyer un code à tout moment.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
