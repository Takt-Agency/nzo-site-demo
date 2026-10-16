import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faPaperPlane,
  faCircleExclamation,
  faCircleCheck,
  faSpinner,
  faToolbox,
  faPlaneDeparture,
  faCalendarDays,
  faTriangleExclamation,
  faSprayCanSparkles,
  faEllipsis,
} from '@fortawesome/free-solid-svg-icons'
import { agentApi } from '../../lib/api.js'

const TYPES = [
  { value: 'equipment', icon: faToolbox },
  { value: 'leave', icon: faPlaneDeparture },
  { value: 'planning', icon: faCalendarDays },
  { value: 'incident', icon: faTriangleExclamation },
  { value: 'mission', icon: faSprayCanSparkles },
  { value: 'other', icon: faEllipsis },
]

const PRIORITIES = [
  { value: 'low', tone: 'border-gray-200 hover:border-gray-300' },
  { value: 'normal', tone: 'border-gray-200 hover:border-secondary/40' },
  { value: 'high', tone: 'border-gray-200 hover:border-red-300' },
]

export default function AgentDemandeNew() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    type: 'equipment',
    priority: 'normal',
    subject: '',
    message: '',
    relatedRef: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await agentApi.createDemande({
        type: form.type,
        priority: form.priority,
        subject: form.subject.trim(),
        message: form.message.trim(),
        relatedRef: form.relatedRef.trim() || undefined,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || t('agent.errors.generic'))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-5">
        <Link
          to="/espace-agent/demandes"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          {t('agent.demandeNew.back')}
        </Link>
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-10 text-center shadow-sm ring-1 ring-emerald-100">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
            <FontAwesomeIcon icon={faCircleCheck} className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-primary md:text-xl">{t('agent.demandeNew.successTitle')}</h2>
          <p className="mt-2 text-sm font-medium text-gray-600">
            {t('agent.demandeNew.successText')}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/espace-agent/demandes')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-accent-600"
            >
              {t('agent.demandeNew.successViewAll')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccess(false)
                setForm({ type: 'equipment', priority: 'normal', subject: '', message: '', relatedRef: '' })
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              {t('agent.demandeNew.successAnother')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Link
        to="/espace-agent/demandes"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {t('agent.demandeNew.back')}
      </Link>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-700">
          {t('agent.demandeNew.eyebrow')}
        </div>
        <h1 className="mt-1 text-xl font-bold text-primary md:text-2xl">
          {t('agent.demandeNew.title')}
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          {t('agent.demandeNew.subtitle')}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8">
        {/* Type */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {t('agent.demandeNew.typeLabel')}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TYPES.map(({ value, icon }) => {
              const active = form.type === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ type: value })}
                  className={`flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition ${
                    active ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-accent/40'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      active ? 'bg-accent text-white' : 'bg-accent-50 text-accent-700'
                    }`}
                  >
                    <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-primary">{t(`agent.demandeNew.types.${value}`)}</div>
                    <div className="mt-0.5 text-[11px] font-medium leading-snug text-gray-500">
                      {t(`agent.demandeNew.typeHints.${value}`)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Priority */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('agent.demandeNew.priorityLabel')}</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PRIORITIES.map(({ value, tone }) => {
              const active = form.priority === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ priority: value })}
                  className={`rounded-xl border-2 px-3 py-2 text-xs font-bold transition ${
                    active
                      ? value === 'high'
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : value === 'low'
                        ? 'border-gray-300 bg-gray-50 text-gray-700'
                        : 'border-secondary bg-secondary/5 text-secondary-700'
                      : `text-gray-600 ${tone}`
                  }`}
                >
                  {t(`agent.priorities.${value}`)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="input-label">
            {t('agent.demandeNew.subjectLabel')}
          </label>
          <input
            id="subject"
            type="text"
            required
            minLength={3}
            maxLength={200}
            value={form.subject}
            onChange={(e) => update({ subject: e.target.value })}
            placeholder={t('agent.demandeNew.subjectPlaceholder')}
            className="input-field mt-2"
          />
        </div>

        {/* Related ref */}
        <div>
          <label htmlFor="relatedRef" className="input-label">
            {t('agent.demandeNew.relatedRefLabel')}
          </label>
          <input
            id="relatedRef"
            type="text"
            value={form.relatedRef}
            onChange={(e) => update({ relatedRef: e.target.value })}
            placeholder={t('agent.demandeNew.relatedRefPlaceholder')}
            className="input-field mt-2"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="input-label">
            {t('agent.demandeNew.messageLabel')}
          </label>
          <textarea
            id="message"
            required
            minLength={10}
            maxLength={4000}
            rows={6}
            value={form.message}
            onChange={(e) => update({ message: e.target.value })}
            placeholder={t('agent.demandeNew.messagePlaceholder')}
            className="input-field mt-2 resize-y"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <Link
            to="/espace-agent/demandes"
            className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            {t('agent.demandeNew.cancel')}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-accent/30 transition hover:bg-accent-600 disabled:opacity-50"
          >
            {submitting ? (
              <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
            )}
            {t('agent.demandeNew.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
