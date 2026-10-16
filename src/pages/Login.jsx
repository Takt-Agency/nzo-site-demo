import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEye,
  faEyeSlash,
  faArrowRight,
  faArrowLeft,
  faCircleCheck,
  faCircleExclamation,
  faLock,
  faEnvelope,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import Logo from '../components/layout/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')
  const { login } = useAuth()
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading('credentials')
    try {
      const user = await login({ email: form.email, password: form.password })
      // Admins and agents always land on their dashboard regardless of `?next`
      // — their sessions are scoped to their own workspace and we never want
      // to drop them on a client page.
      if (user.role === 'admin') {
        navigate('/admin')
      } else if (user.role === 'agent') {
        navigate('/espace-agent')
      } else {
        navigate(next ? decodeURIComponent(next) : '/espace-client')
      }
    } catch (err) {
      // Unverified accounts get a 403 with `requiresVerification: true` — send
      // the user to the code-entry page instead of showing a dead-end error.
      if (err?.data?.requiresVerification) {
        const target = err.data.email || form.email
        navigate(`/verify-email?email=${encodeURIComponent(target)}${next ? `&next=${next}` : ''}`)
        return
      }
      setError(err.message || 'Login failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="flex flex-1 flex-col p-6 md:p-10 lg:p-14">
          <header className="flex items-center justify-between">
            <Logo />
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
              {t('login.back')}
            </Link>
          </header>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-700">
              {t('login.eyebrow')}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary md:text-3xl">
              {t('login.title')}
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500">{t('login.subtitle')}</p>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <div>
                <label htmlFor="email" className="input-label">
                  {t('login.fields.email')}
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
                    value={form.email}
                    onChange={(e) => update({ email: e.target.value })}
                    placeholder={t('login.fields.emailPlaceholder')}
                    className="input-field pl-11"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="input-label">
                    {t('login.fields.password')}
                  </label>
                  <Link
                    to={`/mot-de-passe-oublie${form.email ? `?email=${encodeURIComponent(form.email)}` : ''}`}
                    className="text-xs font-bold text-secondary transition hover:text-secondary-700"
                  >
                    {t('login.forgot')}
                  </Link>
                </div>
                <div className="relative mt-2">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => update({ password: e.target.value })}
                    placeholder={t('login.fields.passwordPlaceholder')}
                    className="input-field pl-11 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={t(showPwd ? 'login.hidePwd' : 'login.showPwd')}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
                  >
                    <FontAwesomeIcon icon={showPwd ? faEyeSlash : faEye} className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-600">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => update({ remember: e.target.checked })}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-accent focus:ring-accent"
                />
                {t('login.remember')}
              </label>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading !== null}
                className="btn-primary w-full px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === 'credentials' ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                )}
                {t('login.submit')}
              </button>
            </form>

            <p className="mt-7 text-center text-xs font-medium text-gray-500">
              {t('login.noAccount')}{' '}
              <Link
                to="/signup"
                className="font-bold text-secondary transition hover:text-secondary-700"
              >
                {t('login.signup')}
              </Link>
            </p>
          </div>

        </div>

        <aside className="relative isolate hidden overflow-hidden bg-primary-900 lg:flex lg:w-[42%] lg:flex-col lg:justify-center lg:p-14">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900" />
          <div className="absolute -top-32 -left-32 -z-10 h-72 w-72 rounded-full bg-secondary-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 text-white/5 bg-dots" />

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/85 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              {t('login.brand.eyebrow')}
            </div>
            <h2 className="mt-5 text-2xl font-bold leading-tight text-white md:text-3xl">
              {t('login.brand.title')}
            </h2>
            <p className="mt-4 text-sm font-medium leading-relaxed text-white/75">
              {t('login.brand.subtitle')}
            </p>

            <ul className="mt-8 space-y-4">
              {['tracking', 'reports', 'documents'].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm font-medium text-white/90">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                  </span>
                  {t(`login.brand.features.${f}`)}
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-sm font-medium italic leading-relaxed text-white/85">
                "{t('login.brand.testimonial.text')}"
              </p>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-white/70">
                — {t('login.brand.testimonial.author')}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
