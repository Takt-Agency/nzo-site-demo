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
  faBroom,
  faClock,
  faHouseChimneyCrack,
  faFileInvoiceDollar,
  faEllipsis,
  faCloudArrowUp,
  faXmark,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/espace/PageHeader.jsx'

const categories = [
  { key: 'quality', icon: faBroom },
  { key: 'delay', icon: faClock },
  { key: 'damage', icon: faHouseChimneyCrack },
  { key: 'billing', icon: faFileInvoiceDollar },
  { key: 'other', icon: faEllipsis },
]

const severities = ['low', 'medium', 'high']

const resolutions = ['redo', 'refund', 'gesture', 'discuss']

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 transition focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20'
const labelClass = 'block text-sm font-semibold text-primary'

export default function ReclamationNew() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    category: 'quality',
    severity: 'medium',
    incidentDate: '',
    relatedRef: '',
    subject: '',
    description: '',
    resolution: 'redo',
    attachments: [],
    consent: false,
  })

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const canSubmit =
    form.subject.trim().length >= 3 &&
    form.description.trim().length >= 20 &&
    form.consent &&
    !submitting

  const handleFiles = (files) => {
    const arr = Array.from(files)
      .slice(0, 6 - form.attachments.length)
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
      await meApi.createReclamation({
        category: form.category,
        severity: form.severity,
        incidentDate: form.incidentDate || undefined,
        relatedRef: form.relatedRef,
        subject: form.subject,
        description: form.description,
        resolution: form.resolution,
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
            {t('espace.reclamationNew.success.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium text-gray-600">
            {t('espace.reclamationNew.success.message')}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/espace-client/reclamations" className="btn-primary px-6 py-3 text-sm">
              {t('espace.reclamationNew.success.backToList')}
            </Link>
            <Link
              to="/espace-client"
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              {t('espace.reclamationNew.success.dashboard')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('espace.reclamationNew.eyebrow')}
        title={t('espace.reclamationNew.title')}
        description={t('espace.reclamationNew.subtitle')}
        action={
          <Link
            to="/espace-client/reclamations"
            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
            {t('espace.reclamationNew.back')}
          </Link>
        }
      />

      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold text-amber-900">
              {t('espace.reclamationNew.notice.title')}
            </div>
            <p className="mt-1 text-xs font-medium text-amber-800">
              {t('espace.reclamationNew.notice.text')}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8"
      >
        <div>
          <div className={labelClass}>{t('espace.reclamationNew.fields.category')} *</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map(({ key, icon }) => {
              const active = form.category === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => update({ category: key })}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition ${
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
                  <span className="text-xs font-bold leading-tight text-primary">
                    {t(`espace.reclamationNew.categories.${key}`)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="subject" className={labelClass}>
              {t('espace.reclamationNew.fields.subject')} *
            </label>
            <input
              id="subject"
              required
              maxLength={120}
              value={form.subject}
              onChange={(e) => update({ subject: e.target.value })}
              placeholder={t('espace.reclamationNew.fields.subjectPlaceholder')}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass}>{t('espace.reclamationNew.fields.severity')}</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {severities.map((s) => {
                const active = form.severity === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update({ severity: s })}
                    className={`rounded-xl border-2 p-2.5 text-xs font-bold transition ${
                      active
                        ? 'border-secondary bg-secondary/5 text-secondary'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-secondary/40'
                    }`}
                  >
                    {t(`espace.reclamationNew.severities.${s}`)}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="incidentDate" className={labelClass}>
              {t('espace.reclamationNew.fields.incidentDate')}
            </label>
            <input
              id="incidentDate"
              type="date"
              value={form.incidentDate}
              onChange={(e) => update({ incidentDate: e.target.value })}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="relatedRef" className={labelClass}>
              {t('espace.reclamationNew.fields.relatedRef')}
            </label>
            <input
              id="relatedRef"
              value={form.relatedRef}
              onChange={(e) => update({ relatedRef: e.target.value })}
              placeholder={t('espace.reclamationNew.fields.relatedRefPlaceholder')}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelClass}>
              {t('espace.reclamationNew.fields.description')} *
            </label>
            <textarea
              id="description"
              rows={6}
              required
              minLength={20}
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder={t('espace.reclamationNew.fields.descriptionPlaceholder')}
              className={`mt-2 resize-y ${inputClass}`}
            />
            <p className="mt-1.5 text-right text-[11px] font-semibold text-gray-400">
              {form.description.length} / 3000
            </p>
          </div>

          <div className="sm:col-span-2">
            <div className={labelClass}>{t('espace.reclamationNew.fields.resolution')}</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {resolutions.map((r) => {
                const active = form.resolution === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => update({ resolution: r })}
                    className={`rounded-xl border-2 p-3 text-left text-xs font-bold transition ${
                      active
                        ? 'border-secondary bg-secondary/5 text-secondary'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-secondary/40'
                    }`}
                  >
                    {t(`espace.reclamationNew.resolutions.${r}`)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className={labelClass}>{t('espace.reclamationNew.fields.attachments')}</div>
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
                {t('espace.reclamationNew.fields.dropTitle')}
              </div>
              <div className="mt-1 text-xs font-medium text-gray-500">
                {t('espace.reclamationNew.fields.dropHint')}
              </div>
              <input
                id="attachments"
                type="file"
                multiple
                accept="image/*,.pdf"
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

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-xs font-medium text-gray-600 sm:col-span-2">
            <input
              type="checkbox"
              required
              checked={form.consent}
              onChange={(e) => update({ consent: e.target.checked })}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-accent focus:ring-accent"
            />
            <span>
              {t('espace.reclamationNew.consent')} <span className="text-accent">*</span>
            </span>
          </label>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/espace-client/reclamations')}
            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            {t('espace.reclamationNew.cancel')}
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
            {t('espace.reclamationNew.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
