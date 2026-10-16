import { useCallback, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faDownload,
  faCheck,
  faXmark,
  faClock,
  faCalendarCheck,
  faLocationDot,
  faFileLines,
  faCircleCheck,
  faCircleExclamation,
  faCommentDots,
  faPaperPlane,
  faSpinner,
  faRulerCombined,
  faRepeat,
  faImage,
  faUtensils,
  faCouch,
  faBed,
  faShower,
  faToilet,
  faLaptop,
  faRoad,
  faDoorOpen,
  faTree,
  faWarehouse,
  faEllipsis,
} from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/espace/PageHeader.jsx'
import DevisThread from '../../components/espace/DevisThread.jsx'
import ServiceDetailsBlock, {
  serviceHasField,
} from '../../components/shared/ServiceDetailsBlock.jsx'
import { meApi, ApiError } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const statusBadge = {
  new: 'bg-secondary-100 text-secondary-700',
  pending: 'bg-secondary-100 text-secondary-700',
  quoted: 'bg-tertiary-50 text-tertiary-700',
  accepted: 'bg-accent text-white',
  rejected: 'bg-gray-200 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

const timelineSteps = ['submitted', 'reviewed', 'quoted', 'accepted']

const ROOM_ICONS = {
  cuisine: faUtensils,
  salon: faCouch,
  chambre: faBed,
  sdb: faShower,
  toilette: faToilet,
  bureau: faLaptop,
  couloir: faRoad,
  entree: faDoorOpen,
  balcon: faTree,
  cave: faWarehouse,
  autre: faEllipsis,
}

const stepByStatus = {
  new: 0,
  pending: 1,
  quoted: 2,
  accepted: 3,
  rejected: -1,
  cancelled: -1,
}

function formatDate(iso, withTime = false) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(
    'fr-CH',
    withTime
      ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { dateStyle: 'medium' },
  ).format(new Date(iso))
}

function formatPrice(n, currency = 'CHF') {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(n)
}

function shortId(id) {
  if (!id) return ''
  return `DV-${id.slice(-6).toUpperCase()}`
}

export default function DevisDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()

  const fetcher = useCallback(() => meApi.getDevis(id), [id])
  const { data, loading, error, reload } = useApi(fetcher, [id])
  const quote = data?.devis

  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [sentOk, setSentOk] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [actionError, setActionError] = useState(null)

  // --- Loading skeleton --------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200" />
        <div className="h-20 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
      </div>
    )
  }

  // --- Not found / error -------------------------------------------------
  if (error || !quote) {
    const is404 = error instanceof ApiError && error.status === 404
    return (
      <div className="space-y-6">
        <Link
          to="/espace-client/devis"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          {t('espace.devisDetail.back')}
        </Link>
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faCircleExclamation} className="h-8 w-8 text-gray-400" />
          <h2 className="mt-4 text-lg font-bold text-primary">
            {is404 ? t('espace.devisDetail.notFound') : t('espace.devisDetail.loadError', { defaultValue: 'Erreur de chargement' })}
          </h2>
          {error && !is404 && (
            <p className="mt-2 text-xs font-medium text-gray-500">{error.message}</p>
          )}
        </div>
      </div>
    )
  }

  // --- Derived values ----------------------------------------------------
  const features = t(`services.${quote.service}.includes`, { returnObjects: true })
  const totalTTC = quote.amount != null ? quote.amount * (1 + (quote.vatRate || 0) / 100) : null
  const currentStepIndex = stepByStatus[quote.status] ?? -1
  const isDeadEnd = quote.status === 'rejected' || quote.status === 'cancelled'

  // Use createdAt for the submitted step and updatedAt for the current step
  // (real timeline tracking will come in phase 2 with a dedicated subdocument).
  const stepDates = {
    submitted: quote.createdAt,
    reviewed: currentStepIndex >= 1 ? quote.updatedAt : null,
    quoted: currentStepIndex >= 2 ? quote.updatedAt : null,
    accepted: currentStepIndex >= 3 ? quote.updatedAt : null,
  }

  const handleAccept = async () => {
    if (
      !confirm(
        t('espace.devisDetail.actions.acceptConfirm', {
          defaultValue: "Confirmer l'acceptation de ce devis ?",
        }),
      )
    )
      return
    setActionError(null)
    setAccepting(true)
    try {
      await meApi.acceptDevis(quote.id)
      reload()
    } catch (err) {
      setActionError(err.message || 'Erreur')
    } finally {
      setAccepting(false)
    }
  }
  const handleReject = () => alert(t('espace.devisDetail.actions.rejectMock'))
  const handleDownload = () => alert(t('espace.devisDetail.actions.downloadMock'))
  const handleCancel = () => {
    if (confirm(t('espace.devisDetail.actions.cancelConfirm'))) {
      navigate('/espace-client/devis')
    }
  }
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setActionError(null)
    setSending(true)
    try {
      await meApi.replyDevis(quote.id, reply.trim())
      setSentOk(true)
      setReply('')
      reload()
      setTimeout(() => setSentOk(false), 3000)
    } catch (err) {
      setActionError(err.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/espace-client/devis"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {t('espace.devisDetail.back')}
      </Link>

      <PageHeader
        eyebrow={shortId(quote.id)}
        title={t(`services.${quote.service}.title`, { defaultValue: quote.service })}
        description={t('espace.devisDetail.requestedOn', { date: formatDate(quote.createdAt) })}
        action={
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider ${statusBadge[quote.status] || statusBadge.pending}`}
          >
            {t(`espace.devis.statuses.${quote.status}`, { defaultValue: quote.status })}
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {serviceHasField(quote.service, 'surface') && quote.surface > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <FontAwesomeIcon icon={faRulerCombined} className="h-3 w-3 text-secondary" />
              {t('espace.devisDetail.summary.surface')}
            </div>
            <div className="mt-2 text-xl font-bold text-primary">{quote.surface} m²</div>
          </div>
        )}
        {serviceHasField(quote.service, 'frequency') && quote.frequency && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <FontAwesomeIcon icon={faRepeat} className="h-3 w-3 text-secondary" />
              {t('espace.devisDetail.summary.frequency')}
            </div>
            <div className="mt-2 text-base font-bold text-primary">
              {t(`devis.frequencies.${quote.frequency}`, { defaultValue: quote.frequency })}
            </div>
          </div>
        )}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <FontAwesomeIcon icon={faCalendarCheck} className="h-3 w-3 text-secondary" />
            {t('espace.devisDetail.summary.startDate')}
          </div>
          <div className="mt-2 text-base font-bold text-primary">
            {formatDate(quote.startDate)}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 text-secondary" />
            {t('espace.devisDetail.summary.location')}
          </div>
          <div className="mt-2 truncate text-base font-bold text-primary">{quote.city || '—'}</div>
        </div>
      </div>

      <ServiceDetailsBlock service={quote.service} data={quote} />

      {/* Timeline — hidden for cancelled/rejected as it doesn't apply */}
      {!isDeadEnd && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-7">
          <h2 className="text-base font-bold text-primary md:text-lg">
            {t('espace.devisDetail.timeline.title')}
          </h2>
          <ol className="mt-6 flex items-start">
            {timelineSteps.map((step, idx) => {
              const reached = idx <= currentStepIndex
              const active = idx === currentStepIndex
              const isLast = idx === timelineSteps.length - 1
              const leftReached = idx <= currentStepIndex
              const rightReached = idx < currentStepIndex
              const date = stepDates[step]

              return (
                <li key={step} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <span
                      className={`h-0.5 flex-1 transition ${
                        idx === 0 ? 'invisible' : leftReached ? 'bg-accent' : 'bg-gray-200'
                      }`}
                    />
                    <span
                      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                        reached
                          ? 'bg-accent text-white shadow-md shadow-accent/30'
                          : 'bg-white text-gray-400 ring-2 ring-gray-200'
                      } ${active ? 'ring-4 ring-accent/25' : ''}`}
                    >
                      {reached && idx < currentStepIndex ? (
                        <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <span
                      className={`h-0.5 flex-1 transition ${
                        isLast ? 'invisible' : rightReached ? 'bg-accent' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                  <div
                    className={`mt-3 text-[11px] font-bold uppercase tracking-wider sm:text-xs ${
                      active ? 'text-primary' : reached ? 'text-secondary-700' : 'text-gray-400'
                    }`}
                  >
                    {t(`espace.devisDetail.timeline.steps.${step}`)}
                  </div>
                  <div className="mt-1 text-[10px] font-medium text-gray-500">
                    {date ? formatDate(date) : '—'}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {isDeadEnd && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center text-sm font-semibold text-gray-500">
          {t(`espace.devisDetail.deadEnd.${quote.status}`, {
            defaultValue:
              quote.status === 'cancelled'
                ? 'Cette demande a été annulée.'
                : 'Ce devis a été refusé.',
          })}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {(quote.address || quote.postalCode || quote.city) && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('espace.devisDetail.address.title')}
              </h2>
              <div className="mt-3 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-50 text-secondary">
                  <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
                </span>
                <div className="text-sm font-medium leading-relaxed text-gray-700">
                  {quote.address}
                  {quote.address && (quote.postalCode || quote.city) && <br />}
                  {quote.postalCode} {quote.city}
                </div>
              </div>
            </div>
          )}

          {Array.isArray(features) && features.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('espace.devisDetail.includes.title')}
              </h2>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {t('espace.devisDetail.includes.subtitle')}
              </p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {features.map((feat, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm font-medium text-gray-700"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                      <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {quote.notes && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('espace.devisDetail.notes.title')}
              </h2>
              <div className="mt-3 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                  <FontAwesomeIcon icon={faFileLines} className="h-3.5 w-3.5" />
                </span>
                <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
                  {quote.notes}
                </p>
              </div>
            </div>
          )}

          {Array.isArray(quote.rooms) && quote.rooms.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('espace.devisDetail.rooms.title', { defaultValue: 'Pièces concernées' })}
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {quote.rooms.map((r) => (
                  <li
                    key={r.key}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary-50 px-3 py-1.5 text-xs font-bold text-secondary-700"
                  >
                    {ROOM_ICONS[r.key] && (
                      <FontAwesomeIcon icon={ROOM_ICONS[r.key]} className="h-3 w-3" />
                    )}
                    {t(`devis.rooms.${r.key}`, { defaultValue: r.key })}
                    <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-secondary">
                      × {r.count}
                    </span>
                  </li>
                ))}
              </ul>

              {quote.rooms.some((r) => Array.isArray(r.photos) && r.photos.length > 0) && (
                <div className="mt-6 space-y-5">
                  {quote.rooms
                    .filter((r) => Array.isArray(r.photos) && r.photos.length > 0)
                    .map((r) => (
                      <div key={r.key}>
                        <div className="flex items-center gap-2 text-sm font-bold text-primary">
                          {ROOM_ICONS[r.key] && (
                            <FontAwesomeIcon icon={ROOM_ICONS[r.key]} className="h-3.5 w-3.5 text-secondary" />
                          )}
                          {t(`devis.rooms.${r.key}`, { defaultValue: r.key })}
                          <span className="text-xs font-medium text-gray-400">
                            ({r.photos.length})
                          </span>
                        </div>
                        <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                          {r.photos.map((url, i) => (
                            <li
                              key={i}
                              className="overflow-hidden rounded-lg ring-1 ring-gray-200"
                            >
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={url}
                                  alt={`${r.key} ${i + 1}`}
                                  className="aspect-square w-full object-cover transition hover:opacity-80"
                                />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {Array.isArray(quote.photos) && quote.photos.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
                <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5 text-secondary" />
                {t('espace.devisDetail.photos.title', { defaultValue: 'Photos jointes' })}
              </h2>
              <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {quote.photos.map((url, i) => (
                  <li
                    key={i}
                    className="overflow-hidden rounded-xl ring-1 ring-gray-200"
                  >
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Photo ${i + 1}`} className="aspect-square w-full object-cover transition hover:opacity-80" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {quote.staffMessage && (
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('espace.devisDetail.staffMessage.title')}
              </h2>
              <div className="mt-3 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
                  <FontAwesomeIcon icon={faCommentDots} className="h-3.5 w-3.5" />
                </span>
                <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
                  {quote.staffMessage}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-base font-bold text-primary md:text-lg">
              {t('espace.devisDetail.reply.title')}
            </h2>
            <p className="mt-1 text-xs font-medium text-gray-500">
              {t('espace.devisDetail.reply.subtitle')}
            </p>

            {(quote.replies?.length > 0 || quote.staffMessage) && (
              <div className="mt-5">
                <DevisThread
                  replies={quote.replies}
                  staffMessage={quote.staffMessage}
                  viewer="client"
                />
              </div>
            )}

            {sentOk && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-xs font-semibold text-accent-700">
                <FontAwesomeIcon icon={faCircleCheck} className="h-3.5 w-3.5" />
                {t('espace.devisDetail.reply.sent')}
              </div>
            )}
            {actionError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {actionError}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="mt-4">
              <textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={t('espace.devisDetail.reply.placeholder')}
                className="input-field resize-y"
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="btn-primary mt-3 px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {sending ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
                )}
                {t('espace.devisDetail.reply.send')}
              </button>
            </form>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 p-6 text-white shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/65">
              {t('espace.devisDetail.summary.totalLabel')}
            </div>
            {quote.amount != null ? (
              <>
                <div className="mt-1 text-3xl font-bold leading-tight">
                  {formatPrice(quote.amount, quote.currency)}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-white/65">
                  {t('espace.devisDetail.summary.exclVat')}
                </div>
                <div className="mt-4 space-y-1.5 border-t border-white/15 pt-4 text-xs">
                  <div className="flex justify-between text-white/80">
                    <span>{t('espace.devisDetail.summary.subtotal')}</span>
                    <span>{formatPrice(quote.amount, quote.currency)}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>{t('espace.devisDetail.summary.vat', { rate: quote.vatRate })}</span>
                    <span>
                      {formatPrice(quote.amount * (quote.vatRate / 100), quote.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/15 pt-1.5 text-sm font-bold">
                    <span>{t('espace.devisDetail.summary.totalTTC')}</span>
                    <span>{formatPrice(totalTTC, quote.currency)}</span>
                  </div>
                </div>
                {quote.validUntil && (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/85">
                    <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5 text-accent" />
                    {t('espace.devisDetail.summary.validUntil', {
                      date: formatDate(quote.validUntil),
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-1 text-base font-medium text-white/80">
                {t('espace.devisDetail.summary.pending')}
              </div>
            )}
          </div>

          {quote.status === 'quoted' && (
            <div className="space-y-2.5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <button
                type="button"
                onClick={handleAccept}
                disabled={accepting}
                className="btn-primary w-full px-5 py-3 text-sm disabled:opacity-50"
              >
                {accepting ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
                )}
                {t('espace.devisDetail.actions.accept')}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary bg-white px-5 py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
              >
                <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
                {t('espace.devisDetail.actions.download')}
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-bold text-gray-500 transition hover:text-red-600"
              >
                <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                {t('espace.devisDetail.actions.reject')}
              </button>
            </div>
          )}

          {(quote.status === 'new' || quote.status === 'pending') && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 transition hover:border-red-300 hover:text-red-600"
              >
                <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                {t('espace.devisDetail.actions.cancel')}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
