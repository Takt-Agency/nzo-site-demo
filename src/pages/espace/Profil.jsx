import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faCircleExclamation,
  faUser,
  faBriefcase,
  faBuildingUser,
  faPeopleGroup,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/espace/PageHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { meApi } from '../../lib/api.js'

const accountTypes = [
  { key: 'particulier', icon: faUser },
  { key: 'entreprise', icon: faBriefcase },
  { key: 'proImmo', icon: faBuildingUser },
  { key: 'association', icon: faPeopleGroup },
]

export default function Profil() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    accountType: 'particulier',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    siret: '',
    representativeRole: '',
    newsletter: false,
  })

  const isBusiness = form.accountType !== 'particulier'

  useEffect(() => {
    if (!user) return
    setForm({
      accountType: user.accountType || 'particulier',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      company: user.company || '',
      siret: user.siret || '',
      representativeRole: user.representativeRole || '',
      newsletter: !!user.newsletter,
    })
  }, [user])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await meApi.updateProfile({
        accountType: form.accountType,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        company: form.company,
        siret: form.siret,
        representativeRole: form.representativeRole,
        newsletter: form.newsletter,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('espace.profil.eyebrow')}
        title={t('espace.profil.title')}
        description={t('espace.profil.subtitle')}
        action={
          <button
            type="button"
            onClick={() => {
              logout()
              window.location.replace('/')
            }}
            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-700 transition hover:border-red-500 hover:text-red-600"
          >
            {t('espace.sidebar.signOut')}
          </button>
        }
      />

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8"
      >
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-xs font-semibold text-accent-700">
            <FontAwesomeIcon icon={faCircleCheck} className="h-3.5 w-3.5" />
            {t('espace.profil.saved')}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
                    active ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-accent/40'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="input-label">
              {t('contact.fields.firstName')}
            </label>
            <input
              id="firstName"
              value={form.firstName}
              onChange={(e) => update({ firstName: e.target.value })}
              className="input-field mt-2"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="input-label">
              {t('contact.fields.lastName')}
            </label>
            <input
              id="lastName"
              value={form.lastName}
              onChange={(e) => update({ lastName: e.target.value })}
              className="input-field mt-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="input-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            readOnly
            className="input-field mt-2 cursor-not-allowed bg-gray-50 text-gray-500"
          />
          <p className="mt-1 text-[11px] font-medium text-gray-400">
            {t('espace.profil.emailHint')}
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="input-label">
            {t('contact.fields.phone')}
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
            className="input-field mt-2"
          />
        </div>

        {isBusiness && (
          <div className="space-y-4 rounded-xl border border-secondary-100 bg-secondary-50/40 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-secondary-700">
              {t('signup.business.title', { defaultValue: "Informations de l'entité" })}
            </div>
            <div>
              <label htmlFor="company" className="input-label">
                {t('espace.profil.company')}
              </label>
              <input
                id="company"
                value={form.company}
                onChange={(e) => update({ company: e.target.value })}
                className="input-field mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="siret" className="input-label">
                  {t('signup.business.siret', { defaultValue: 'SIRET / N° entreprise' })}
                </label>
                <input
                  id="siret"
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
                  value={form.representativeRole}
                  onChange={(e) => update({ representativeRole: e.target.value })}
                  placeholder="Directeur, Gérant…"
                  className="input-field mt-2"
                />
              </div>
            </div>
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-3 text-xs font-medium text-gray-600">
          <input
            type="checkbox"
            checked={form.newsletter}
            onChange={(e) => update({ newsletter: e.target.checked })}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-accent focus:ring-accent"
          />
          {t('signup.newsletter')}
        </label>

        <button type="submit" disabled={saving} className="btn-primary w-full px-6 py-3 text-sm disabled:opacity-50">
          {saving ? (
            <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
          )}
          {t('espace.profil.save')}
        </button>
      </form>
    </div>
  )
}
