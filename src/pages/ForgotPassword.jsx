import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faArrowRight,
  faCircleCheck,
  faCircleExclamation,
  faEnvelope,
  faKey,
  faLock,
  faEye,
  faEyeSlash,
  faSpinner,
  faRotate,
} from '@fortawesome/free-solid-svg-icons'
import Logo from '../components/layout/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 45

function passwordStrength(pwd) {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

function landingRouteFor(user) {
  if (!user) return '/espace-client'
  if (user.role === 'admin') return '/admin'
  if (user.role === 'agent') return '/espace-agent'
  return '/espace-client'
}

const PHASES = ['request', 'code', 'password']
const PHASE_LABELS = ['Email', 'Code', 'Mot de passe']

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { forgotPassword, verifyResetCode, resetPassword } = useAuth()

  // "request" — user types their email
  // "code"    — user types the 6-digit code
  // "password"— user chooses a new password + confirms it
  const [phase, setPhase] = useState('request')
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [digits, setDigits] = useState(() => Array(CODE_LENGTH).fill(''))
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const [status, setStatus] = useState(null) // 'sending' | 'checking' | 'resetting' | 'resending'
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [cooldown, setCooldown] = useState(0)

  const inputsRef = useRef([])
  const code = useMemo(() => digits.join(''), [digits])
  const strength = passwordStrength(password)
  const strengthColor = ['bg-gray-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-accent'][
    strength
  ]

  // Live password-match state used to gate the submit button and show
  // inline feedback under the confirm input.
  const passwordLongEnough = password.length >= 8
  const passwordsMatch = password.length > 0 && password === confirm
  const canSubmitPassword = passwordLongEnough && passwordsMatch

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  useEffect(() => {
    if (phase === 'code') inputsRef.current[0]?.focus()
  }, [phase])

  const handleDigitChange = (index, raw) => {
    const value = raw.replace(/\D/g, '')
    if (!value) {
      setDigits((prev) => {
        const next = [...prev]
        next[index] = ''
        return next
      })
      return
    }
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

  const handleDigitKey = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  const handleDigitsPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return
    e.preventDefault()
    const next = Array(CODE_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    inputsRef.current[Math.min(CODE_LENGTH - 1, pasted.length)]?.focus()
  }

  const onRequest = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!email.trim()) {
      setError("Merci de saisir l'adresse email de votre compte.")
      return
    }
    setStatus('sending')
    try {
      await forgotPassword({ email: email.trim() })
      setInfo(`Si un compte existe pour ${email.trim()}, un code à 6 chiffres a été envoyé.`)
      setPhase('code')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setError(err.message || "Impossible d'envoyer le code.")
    } finally {
      setStatus(null)
    }
  }

  const onVerifyCode = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (code.length !== CODE_LENGTH) {
      setError('Merci de saisir les 6 chiffres du code.')
      return
    }
    setStatus('checking')
    try {
      await verifyResetCode({ email: email.trim(), code })
      setPhase('password')
    } catch (err) {
      setError(err.message || 'Code invalide ou expiré.')
      setDigits(Array(CODE_LENGTH).fill(''))
      inputsRef.current[0]?.focus()
    } finally {
      setStatus(null)
    }
  }

  const onReset = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!canSubmitPassword) {
      if (!passwordLongEnough) {
        setError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      } else if (!passwordsMatch) {
        setError('Les deux mots de passe ne correspondent pas.')
      }
      return
    }
    setStatus('resetting')
    try {
      const user = await resetPassword({ email: email.trim(), code, newPassword: password })
      navigate(landingRouteFor(user), { replace: true })
    } catch (err) {
      // Code may have expired between the two steps — send them back to the
      // code screen so they can retry cleanly instead of being stuck here.
      if (err?.data?.expired || err?.data?.tooManyAttempts) {
        setPhase('code')
        setDigits(Array(CODE_LENGTH).fill(''))
      }
      setError(err.message || 'Impossible de réinitialiser le mot de passe.')
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
      await forgotPassword({ email: email.trim() })
      setInfo(`Un nouveau code a été envoyé à ${email.trim()}.`)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setDigits(Array(CODE_LENGTH).fill(''))
      inputsRef.current[0]?.focus()
    } catch (err) {
      setError(err.message || 'Impossible de renvoyer le code.')
    } finally {
      setStatus(null)
    }
  }

  const currentPhaseIndex = PHASES.indexOf(phase)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="flex flex-1 flex-col p-6 md:p-10 lg:p-14">
          <header className="flex items-center justify-between">
            <Logo />
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
              Retour à la connexion
            </Link>
          </header>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary-700">
              <FontAwesomeIcon icon={faKey} className="h-6 w-6" />
            </div>

            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-700">
              Mot de passe oublié
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary md:text-3xl">
              {phase === 'request' && 'Réinitialisez votre mot de passe'}
              {phase === 'code' && 'Saisissez votre code'}
              {phase === 'password' && 'Choisissez un nouveau mot de passe'}
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500">
              {phase === 'request' &&
                "Indiquez votre email : nous vous enverrons un code à 6 chiffres pour choisir un nouveau mot de passe."}
              {phase === 'code' &&
                `Un code à 6 chiffres a été envoyé à ${email}. Il expire dans 15 minutes.`}
              {phase === 'password' &&
                'Choisissez un mot de passe robuste, différent de vos autres services.'}
            </p>

            {/* Stepper — makes the current phase and progress obvious. */}
            <ol className="mt-6 flex items-center gap-2">
              {PHASE_LABELS.map((label, i) => {
                const isDone = i < currentPhaseIndex
                const isCurrent = i === currentPhaseIndex
                return (
                  <li key={label} className="flex flex-1 items-center gap-2">
                    <div className="flex flex-1 items-center gap-2">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${
                          isDone
                            ? 'bg-accent text-white'
                            : isCurrent
                            ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isDone ? (
                          <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${
                          isCurrent ? 'text-primary' : 'text-gray-500'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < PHASE_LABELS.length - 1 && (
                      <span className={`h-px flex-1 ${isDone ? 'bg-accent' : 'bg-gray-200'}`} />
                    )}
                  </li>
                )
              })}
            </ol>

            {/* Phase 1 — email */}
            {phase === 'request' && (
              <form onSubmit={onRequest} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="email" className="input-label">
                    Adresse email
                  </label>
                  <div className="relative mt-2">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      className="input-field pl-11"
                    />
                  </div>
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

                <button
                  type="submit"
                  disabled={status !== null || !email.trim()}
                  className="btn-primary w-full px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'sending' ? (
                    <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                  )}
                  Envoyer le code
                </button>
              </form>
            )}

            {/* Phase 2 — 6-digit code */}
            {phase === 'code' && (
              <form onSubmit={onVerifyCode} className="mt-8 space-y-5">
                <div>
                  <label className="input-label">Code de vérification</label>
                  <div
                    className="mt-2 flex items-center justify-between gap-2"
                    onPaste={handleDigitsPaste}
                  >
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputsRef.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={CODE_LENGTH}
                        value={d}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKey(i, e)}
                        className="h-14 w-12 rounded-xl border-2 border-gray-200 bg-white text-center text-2xl font-bold text-primary shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    ))}
                  </div>
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
                  {status === 'checking' ? (
                    <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                  )}
                  Valider le code
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
                  <button
                    type="button"
                    onClick={() => {
                      setPhase('request')
                      setError(null)
                      setInfo(null)
                    }}
                    className="text-[11px] font-semibold text-gray-400 underline underline-offset-2 hover:text-primary"
                  >
                    Changer d'adresse email
                  </button>
                </div>
              </form>
            )}

            {/* Phase 3 — new password */}
            {phase === 'password' && (
              <form onSubmit={onReset} className="mt-8 space-y-5">
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                  <FontAwesomeIcon icon={faCircleCheck} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>Code confirmé. Choisissez maintenant votre nouveau mot de passe.</span>
                </div>

                <div>
                  <label htmlFor="new-password" className="input-label">
                    Nouveau mot de passe
                  </label>
                  <div className="relative mt-2">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="new-password"
                      type={showPwd ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Au moins 8 caractères"
                      className="input-field pl-11 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
                      aria-label={showPwd ? 'Masquer' : 'Afficher'}
                    >
                      <FontAwesomeIcon icon={showPwd ? faEyeSlash : faEye} className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-1">
                      {[1, 2, 3, 4].map((n) => (
                        <span
                          key={n}
                          className={`h-1 flex-1 rounded-full transition ${
                            n <= strength ? strengthColor : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    {password.length > 0 && !passwordLongEnough && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                        Trop court
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="input-label">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative mt-2">
                    <FontAwesomeIcon
                      icon={faLock}
                      className={`pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
                        confirm.length === 0
                          ? 'text-gray-400'
                          : passwordsMatch
                          ? 'text-emerald-500'
                          : 'text-red-400'
                      }`}
                    />
                    <input
                      id="confirm-password"
                      type={showPwd ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Ressaisir le mot de passe"
                      className={`input-field pl-11 pr-11 ${
                        confirm.length === 0
                          ? ''
                          : passwordsMatch
                          ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200'
                          : 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      }`}
                    />
                    {confirm.length > 0 && (
                      <span
                        className={`absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-white ${
                          passwordsMatch ? 'bg-emerald-500' : 'bg-red-400'
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={passwordsMatch ? faCircleCheck : faCircleExclamation}
                          className="h-3 w-3"
                        />
                      </span>
                    )}
                  </div>
                  {confirm.length > 0 && (
                    <div
                      className={`mt-1.5 text-[11px] font-bold ${
                        passwordsMatch ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {passwordsMatch
                        ? 'Les mots de passe correspondent ✓'
                        : 'Les mots de passe ne correspondent pas'}
                    </div>
                  )}
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

                <button
                  type="submit"
                  disabled={status !== null || !canSubmitPassword}
                  className="btn-primary w-full px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'resetting' ? (
                    <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                  )}
                  Réinitialiser mon mot de passe
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-xs font-medium text-gray-500">
              Vous vous souvenez de votre mot de passe ?{' '}
              <Link to="/login" className="font-bold text-secondary hover:text-secondary-700">
                Se connecter
              </Link>
            </p>
          </div>

          <footer className="text-center text-[11px] font-medium text-gray-400">
            Le code est valable 15 minutes.
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
              Un code, un nouveau mot de passe.
            </h2>
            <p className="mt-4 text-sm font-medium leading-relaxed">
              Nous ne stockons jamais votre ancien mot de passe en clair, c'est pourquoi nous ne
              pouvons pas vous le renvoyer. À la place, un code temporaire vous permet d'en choisir
              un nouveau en toute sécurité.
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
                Vous serez connecté automatiquement après le changement.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                  <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                </span>
                Vous pouvez ignorer l'email si ce n'est pas vous.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
