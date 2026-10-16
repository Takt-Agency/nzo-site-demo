import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  faUser,
  faSpinner,
  faBriefcase,
  faBuildingUser,
  faPeopleGroup,
  faShieldHalved,
  faGift,
  faClock,
} from '@fortawesome/free-solid-svg-icons'
import Logo from '../components/layout/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const accountTypes = [
  { key: 'particulier', icon: faUser },
  { key: 'entreprise', icon: faBriefcase },
  { key: 'proImmo', icon: faBuildingUser },
  { key: 'association', icon: faPeopleGroup },
]

const brandFeatures = [
  { icon: faClock, key: 'quickSetup' },
  { icon: faShieldHalved, key: 'secure' },
  { icon: faGift, key: 'firstQuote' },
]

function passwordStrength(pwd) {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

export default function Signup() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    accountType: 'particulier',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    company: '',
    siret: '',
    representativeRole: '',
    consent: false,
    newsletter: false,
  })

  const isBusiness = form.accountType !== 'particulier'

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading('credentials')
    try {
      const result = await signup({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        accountType: form.accountType,
        newsletter: form.newsletter,
        // Backend ignores these when accountType === 'particulier'
        company: form.company || undefined,
        siret: form.siret || undefined,
        representativeRole: form.representativeRole || undefined,
      })

      // New flow: backend now issues a 6-digit code and expects the user to
      // verify their email before a session is opened.
      if (result?.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`)
        return
      }

      // Legacy path (kept in case the backend is reverted): direct session.
      const user = result?.user
      navigate(
        user?.role === 'admin'
          ? '/admin'
          : user?.role === 'agent'
          ? '/espace-agent'
          : '/espace-client',
      )
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(null)
    }
  }

  const strength = passwordStrength(form.password)
  const strengthColor = ['bg-gray-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-accent'][
    strength
  ]
  const strengthLabel = ['', 'weak', 'fair', 'good', 'strong'][strength]

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
              {t('signup.back')}
            </Link>
          </header>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-700">
              {t('signup.eyebrow')}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary md:text-3xl">
              {t('signup.title')}
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500">{t('signup.subtitle')}</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <div className="input-label">{t('signup.accountTypeTitle')}</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {accountTypes.map(({ key, icon }) => {
                    const active = form.accountType === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => update({ accountType: key })}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition ${
                          active
                            ? 'border-accent bg-accent/5 shadow-sm shadow-accent/10'
                            : 'border-gray-200 bg-white hover:border-accent/40'
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                            active ? 'bg-accent text-white' : 'bg-accent-50 text-accent-700'
                          }`}
                        >
                          <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[11px] font-bold text-primary">
                          {t(`signup.accountTypes.${key}`)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="input-label">
                    {t('signup.fields.firstName')}
                  </label>
                  <input
                    id="firstName"
                    required
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(e) => update({ firstName: e.target.value })}
                    className="input-field mt-2"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="input-label">
                    {t('signup.fields.lastName')}
                  </label>
                  <input
                    id="lastName"
                    required
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(e) => update({ lastName: e.target.value })}
                    className="input-field mt-2"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="input-label">
                  {t('signup.fields.email')}
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
                    placeholder={t('signup.fields.emailPlaceholder')}
                    className="input-field pl-11"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="input-label">
                  {t('signup.fields.password')}
                </label>
                <div className="relative mt-2">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => update({ password: e.target.value })}
                    placeholder={t('signup.fields.passwordPlaceholder')}
                    className="input-field pl-11 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={t(showPwd ? 'signup.hidePwd' : 'signup.showPwd')}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
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
                  <span className="min-w-[48px] text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {strengthLabel ? t(`signup.strength.${strengthLabel}`) : t('signup.strength.hint')}
                  </span>
                </div>
              </div>

              {isBusiness && (
                <div className="space-y-4 rounded-xl border border-secondary-100 bg-secondary-50/40 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-secondary-700">
                    {t('signup.business.title', { defaultValue: "Informations de l'entité" })}
                  </div>

                  <div>
                    <label htmlFor="company" className="input-label">
                      {t('signup.business.company', {
                        defaultValue: 'Nom de l\'entreprise / association',
                      })} *
                    </label>
                    <input
                      id="company"
                      type="text"
                      required={isBusiness}
                      value={form.company}
                      onChange={(e) => update({ company: e.target.value })}
                      placeholder="Régie Léman SA"
                      className="input-field mt-2"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="siret" className="input-label">
                        {t('signup.business.siret', {
                          defaultValue: 'SIRET / N° entreprise',
                        })}
                      </label>
                      <input
                        id="siret"
                        type="text"
                        value={form.siret}
                        onChange={(e) => update({ siret: e.target.value })}
                        placeholder="CHE-123.456.789"
                        className="input-field mt-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="representativeRole" className="input-label">
                        {t('signup.business.role', {
                          defaultValue: 'Fonction du représentant',
                        })}
                      </label>
                      <input
                        id="representativeRole"
                        type="text"
                        value={form.representativeRole}
                        onChange={(e) => update({ representativeRole: e.target.value })}
                        placeholder="Directeur, Gérant…"
                        className="input-field mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  required
                  checked={form.consent}
                  onChange={(e) => update({ consent: e.target.checked })}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span>
                  {t('signup.consent')} <span className="text-accent">*</span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={form.newsletter}
                  onChange={(e) => update({ newsletter: e.target.checked })}
                  className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-accent focus:ring-accent"
                />
                {t('signup.newsletter')}
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
                {t('signup.submit')}
              </button>
            </form>

            <p className="mt-6 text-center text-xs font-medium text-gray-500">
              {t('signup.haveAccount')}{' '}
              <Link
                to="/login"
                className="font-bold text-secondary transition hover:text-secondary-700"
              >
                {t('signup.login')}
              </Link>
            </p>
          </div>

          <footer className="text-center text-[11px] font-medium text-gray-400">
            {t('signup.demoNotice')}
          </footer>
        </div>

        <aside className="relative isolate hidden overflow-hidden bg-primary-900 lg:flex lg:w-[42%] lg:flex-col lg:justify-center lg:p-14">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900" />
          <div className="absolute -top-32 -left-32 -z-10 h-72 w-72 rounded-full bg-secondary-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 text-white/5 bg-dots" />

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/85 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              {t('signup.brand.eyebrow')}
            </div>
            <h2 className="mt-5 text-2xl font-bold leading-tight text-white md:text-3xl">
              {t('signup.brand.title')}
            </h2>
            <p className="mt-4 text-sm font-medium leading-relaxed text-white/75">
              {t('signup.brand.subtitle')}
            </p>

            <ul className="mt-8 space-y-4">
              {brandFeatures.map(({ icon, key }) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                  </span>
                  <div className="leading-tight">
                    <div className="text-sm font-bold text-white">
                      {t(`signup.brand.features.${key}.title`)}
                    </div>
                    <div className="mt-0.5 text-xs font-medium text-white/65">
                      {t(`signup.brand.features.${key}.hint`)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-lg shadow-accent/30">
                <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <div className="text-base font-bold text-white">
                  {t('signup.brand.bonus.title')}
                </div>
                <div className="mt-0.5 text-xs font-medium text-white/70">
                  {t('signup.brand.bonus.hint')}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
