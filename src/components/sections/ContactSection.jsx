import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPhone,
  faEnvelope,
  faLocationDot,
  faClock,
  faPaperPlane,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import {
  faWhatsapp,
  faFacebookF,
  faInstagram,
  faLinkedinIn,
} from '@fortawesome/free-brands-svg-icons'
import { contactInfo, socialLinks } from '../../data/navigation.js'

const socialIcons = {
  facebook: faFacebookF,
  instagram: faInstagram,
  linkedin: faLinkedinIn,
  whatsapp: faWhatsapp,
}

const subjects = ['general', 'devis', 'reclamation', 'partenariat']

export default function ContactSection() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: 'general',
    message: '',
    consent: false,
  })
  const [submitted, setSubmitted] = useState(false)

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 transition focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20'
  const labelClass = 'block text-sm font-semibold text-primary'

  return (
    <section className="relative isolate overflow-hidden bg-gray-50 py-16 md:py-20 lg:py-24">
      <div className="absolute -top-32 -right-32 -z-10 h-96 w-96 rounded-full bg-secondary-100/60 blur-3xl" />
      <div className="absolute -bottom-40 -left-20 -z-10 h-80 w-80 rounded-full bg-accent-100/60 blur-3xl" />

      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
            <span className="h-0.5 w-4 bg-secondary-500" />
            {t('contact.eyebrow')}
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-primary md:text-4xl lg:text-5xl">
            {t('contact.title')}
          </h1>
          <p className="mt-3 text-sm font-medium text-gray-600 md:text-base">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-bold text-primary">{t('contact.coordinatesTitle')}</h2>

              <ul className="mt-6 space-y-5">
                <li className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                      {t('contact.fields.phone')}
                    </div>
                    <a
                      href={`tel:${contactInfo.phoneTel}`}
                      className="text-sm font-bold text-primary transition hover:text-secondary"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                      Email
                    </div>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="break-all text-sm font-bold text-primary transition hover:text-secondary"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                      WhatsApp
                    </div>
                    <a
                      href={`https://wa.me/${contactInfo.whatsapp.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm font-bold text-primary transition hover:text-secondary"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                      {t('contact.fields.address')}
                    </div>
                    <div className="text-sm font-bold text-primary">
                      {contactInfo.address.line1}, {contactInfo.address.line2}
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                      {t('contact.fields.hours')}
                    </div>
                    <div className="text-sm font-bold text-primary">{contactInfo.hours}</div>
                    <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {t('contact.availability')}
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-100">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                {t('contact.followUs')}
              </div>
              <div className="mt-4 flex items-center gap-3">
                {socialLinks.map(({ key, href, label }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-secondary hover:text-white"
                  >
                    <FontAwesomeIcon icon={socialIcons[key]} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-100 md:p-9"
          >
            <h2 className="text-lg font-bold text-primary">{t('contact.formTitle')}</h2>
            <p className="mt-1 text-xs font-medium text-gray-500 md:text-sm">{t('contact.formSubtitle')}</p>

            {submitted ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-2xl bg-accent/10 px-6 py-12 text-center">
                <FontAwesomeIcon icon={faCircleCheck} className="h-12 w-12 text-accent" />
                <h3 className="mt-4 text-xl font-bold text-primary">
                  {t('contact.successTitle')}
                </h3>
                <p className="mt-2 max-w-md text-sm font-medium text-gray-600">
                  {t('contact.successMessage')}
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className={labelClass}>
                    {t('contact.fields.firstName')} *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={form.firstName}
                    onChange={onChange}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className={labelClass}>
                    {t('contact.fields.lastName')} *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={form.lastName}
                    onChange={onChange}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>
                    {t('contact.fields.email')} *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={onChange}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>
                    {t('contact.fields.phoneOptional')}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={onChange}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="subject" className={labelClass}>
                    {t('contact.fields.subject')} *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={form.subject}
                    onChange={onChange}
                    className={`mt-2 ${inputClass}`}
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>
                        {t(`contact.subjects.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="message" className={labelClass}>
                    {t('contact.fields.message')} *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    value={form.message}
                    onChange={onChange}
                    placeholder={t('contact.fields.messagePlaceholder')}
                    className={`mt-2 resize-y ${inputClass}`}
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-xs font-medium text-gray-600 sm:col-span-2">
                  <input
                    type="checkbox"
                    name="consent"
                    required
                    checked={form.consent}
                    onChange={onChange}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span>
                    {t('contact.consent')} <span className="text-accent">*</span>
                  </span>
                </label>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="btn-primary w-full px-7 py-3.5 text-base"
                  >
                    {t('contact.submit')}
                    <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
