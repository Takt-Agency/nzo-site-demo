import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { meApi } from '../../lib/api.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faPaperPlane,
  faSpinner,
  faCircleCheck,
  faClipboardList,
  faSprayCanSparkles,
  faFilePen,
  faCalendarCheck,
  faCircleQuestion,
  faCloudArrowUp,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/espace/PageHeader.jsx'

const requestTypes = [
  { key: 'info', icon: faCircleQuestion },
  { key: 'mission', icon: faSprayCanSparkles },
  { key: 'devis', icon: faFilePen },
  { key: 'planning', icon: faCalendarCheck },
]

const priorities = ['low', 'normal', 'high']

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 transition focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20'
const labelClass = 'block text-sm font-semibold text-primary'

export default function DemandeNew() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    type: 'info',
    priority: 'normal',
    subject: '',
    message: '',
    relatedRef: '',
    attachments: [],
  })

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const canSubmit =
    form.subject.trim().length >= 3 && form.message.trim().length >= 10 && !submitting

  const handleFiles = (files) => {
    const arr = Array.from(files)
      .slice(0, 5 - form.attachments.length)
      .map((file) => ({ file, name: file.name, size: file.size }))
    update({ attachments: [...form.attachments, ...arr] })
  }

  const removeAttachment = (i) => {
    update({ attachments: form.attachments.filter((_, idx) => idx !== i) })
  }

  const onDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const formatSize = (b) => {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / 1024 / 1024).toFixed(1)} MB`
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      await meApi.createDemande({
        type: form.type,
        priority: form.priority,
        subject: form.subject,
        message: form.message,
        relatedRef: form.relatedRef,
        // File upload (real binary) deferred to phase 2 — only metadata for now
        attachments: form.attachments.map((a) => ({ name: a.name, size: a.size })),
      })
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30">
            <FontAwesomeIcon icon={faCircleCheck} className="h-7 w-7" />
          </span>
          <h2 className="mt-5 text-xl font-bold text-primary md:text-2xl">
            {t('espace.demandeNew.success.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium text-gray-600">
            {t('espace.demandeNew.success.message')}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/espace-client/demandes" className="btn-primary px-6 py-3 text-sm">
              {t('espace.demandeNew.success.backToList')}
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false)
                setForm({
                  type: 'info',
                  priority: 'normal',
                  subject: '',
                  message: '',
                  relatedRef: '',
                  attachments: [],
                })
              }}
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              {t('espace.demandeNew.success.another')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('espace.demandeNew.eyebrow')}
        title={t('espace.demandeNew.title')}
        description={t('espace.demandeNew.subtitle')}
        action={
          <Link
            to="/espace-client/demandes"
            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
            {t('espace.demandeNew.back')}
          </Link>
        }
      />

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8"
      >
        <div>
          <div className={labelClass}>{t('espace.demandeNew.fields.type')} *</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {requestTypes.map(({ key, icon }) => {
              const active = form.type === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => update({ type: key })}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition ${
                    active
                      ? 'border-secondary bg-secondary/5 shadow-md shadow-secondary/10'
                      : 'border-gray-200 bg-white hover:border-secondary/40 hover:bg-secondary-50/40'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
                      active ? 'bg-secondary text-white' : 'bg-secondary-50 text-secondary'
                    }`}
                  >
                    <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-bold leading-tight text-primary">
                    {t(`espace.demandeNew.types.${key}`)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="subject" className={labelClass}>
              {t('espace.demandeNew.fields.subject')} *
            </label>
            <input
              id="subject"
              required
              maxLength={120}
              value={form.subject}
              onChange={(e) => update({ subject: e.target.value })}
              placeholder={t('espace.demandeNew.fields.subjectPlaceholder')}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass}>{t('espace.demandeNew.fields.priority')}</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {priorities.map((p) => {
                const active = form.priority === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => update({ priority: p })}
                    className={`rounded-xl border-2 p-2.5 text-xs font-bold transition ${
                      active
                        ? 'border-secondary bg-secondary/5 text-secondary'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-secondary/40'
                    }`}
                  >
                    {t(`espace.demandeNew.priorities.${p}`)}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="relatedRef" className={labelClass}>
              {t('espace.demandeNew.fields.relatedRef')}
            </label>
            <input
              id="relatedRef"
              value={form.relatedRef}
              onChange={(e) => update({ relatedRef: e.target.value })}
              placeholder={t('espace.demandeNew.fields.relatedRefPlaceholder')}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="message" className={labelClass}>
              {t('espace.demandeNew.fields.message')} *
            </label>
            <textarea
              id="message"
              rows={6}
              required
              minLength={10}
              value={form.message}
              onChange={(e) => update({ message: e.target.value })}
              placeholder={t('espace.demandeNew.fields.messagePlaceholder')}
              className={`mt-2 resize-y ${inputClass}`}
            />
            <p className="mt-1.5 text-right text-[11px] font-semibold text-gray-400">
              {form.message.length} / 2000
            </p>
          </div>

          <div className="sm:col-span-2">
            <div className={labelClass}>{t('espace.demandeNew.fields.attachments')}</div>
            <label
              htmlFor="attachments"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition hover:border-secondary hover:bg-secondary-50/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <FontAwesomeIcon icon={faCloudArrowUp} className="h-5 w-5" />
              </span>
              <div className="mt-3 text-sm font-bold text-primary">
                {t('espace.demandeNew.fields.dropTitle')}
              </div>
              <div className="mt-1 text-xs font-medium text-gray-500">
                {t('espace.demandeNew.fields.dropHint')}
              </div>
              <input
                id="attachments"
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>

            {form.attachments.length > 0 && (
              <ul className="mt-3 space-y-2">
                {form.attachments.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-2.5 text-sm"
                  >
                    <div className="min-w-0 truncate">
                      <span className="font-semibold text-primary">{a.name}</span>
                      <span className="ml-2 text-xs font-medium text-gray-400">
                        {formatSize(a.size)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      aria-label="Supprimer"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/espace-client/demandes')}
            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            {t('espace.demandeNew.cancel')}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary px-7 py-3 text-sm disabled:opacity-50 disabled:hover:bg-accent"
          >
            {submitting ? (
              <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
            )}
            {t('espace.demandeNew.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
