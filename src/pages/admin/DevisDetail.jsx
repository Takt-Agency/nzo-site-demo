import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
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
  faRulerCombined,
  faRepeat,
  faImage,
  faUser,
  faEnvelope,
  faPhone,
  faBuilding,
  faPencil,
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
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import DevisActionModal from '../../components/admin/DevisActionModal.jsx'
import ConvertMissionModal from '../../components/admin/ConvertMissionModal.jsx'
import DevisThread from '../../components/espace/DevisThread.jsx'
import ServiceDetailsBlock, {
  serviceHasField,
} from '../../components/shared/ServiceDetailsBlock.jsx'
import { adminApi, ApiError } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

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

const timelineSteps = ['submitted', 'reviewed', 'quoted', 'accepted']
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
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(n)
}

function shortId(id) {
  return `DV-${id.slice(-6).toUpperCase()}`
}

export default function AdminDevisDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [modal, setModal] = useState(null) // 'send' | 'accept' | 'reject'
  const [convertOpen, setConvertOpen] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState(null)

  const fetcher = useCallback(() => adminApi.getDevis(id), [id])
  const { data, loading, error, reload } = useApi(fetcher, [id])
  const quote = data?.devis

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setReplyError(null)
    setSending(true)
    try {
      await adminApi.replyDevis(quote.id, reply.trim())
      setReply('')
      reload()
    } catch (err) {
      setReplyError(err.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  // --- Loading skeleton ---------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200" />
        <div className="h-20 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
      </div>
    )
  }

  // --- Not found / error --------------------------------------------------
  if (error || !quote) {
    const is404 = error instanceof ApiError && error.status === 404
    return (
      <div className="space-y-6">
        <Link
          to="/admin/devis"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          {t('admin.devisDetail.back', { defaultValue: 'Retour aux devis' })}
        </Link>
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faCircleExclamation} className="h-8 w-8 text-gray-400" />
          <h2 className="mt-4 text-lg font-bold text-primary">
            {is404
              ? t('admin.devisDetail.notFound', { defaultValue: 'Devis introuvable' })
              : t('admin.devisDetail.loadError', { defaultValue: 'Erreur de chargement' })}
          </h2>
          {error && !is404 && (
            <p className="mt-2 text-xs font-medium text-gray-500">{error.message}</p>
          )}
        </div>
      </div>
    )
  }

  // --- Derived values -----------------------------------------------------
  const features = t(`services.${quote.service}.includes`, { returnObjects: true })
  const totalTTC = quote.amount != null ? quote.amount * (1 + (quote.vatRate || 0) / 100) : null
  const currentStepIndex = stepByStatus[quote.status] ?? -1
  const isDeadEnd = quote.status === 'rejected' || quote.status === 'cancelled'

  const stepDates = {
    submitted: quote.createdAt,
    reviewed: currentStepIndex >= 1 ? quote.updatedAt : null,
    quoted: currentStepIndex >= 2 ? quote.updatedAt : null,
    accepted: currentStepIndex >= 3 ? quote.updatedAt : null,
  }

  const submitAction = async (payload) => {
    await adminApi.updateDevis(quote.id, payload)
    reload()
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/devis"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {t('admin.devisDetail.back', { defaultValue: 'Retour aux devis' })}
      </Link>

      <AdminPageHeader
        eyebrow={shortId(quote.id)}
        title={t(`services.${quote.service}.title`, { defaultValue: quote.service })}
        description={t('admin.devisDetail.receivedOn', {
          defaultValue: 'Reçu le {{date}}',
          date: formatDate(quote.receivedAt || quote.createdAt, true),
        })}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={quote.status} label={t(`admin.statuses.${quote.status}`)} />
            {(quote.status === 'new' || quote.status === 'pending') && (
              <button
                type="button"
                onClick={() => setModal('send')}
                className="btn-primary px-4 py-2 text-xs"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
                {t('admin.devis.actions.send')}
              </button>
            )}
            {quote.status === 'quoted' && (
              <>
                <button
                  type="button"
                  onClick={() => setModal('send')}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-secondary px-4 py-2 text-xs font-bold text-secondary transition hover:bg-secondary hover:text-white"
                >
                  <FontAwesomeIcon icon={faPencil} className="h-3 w-3" />
                  {t('admin.devisDetail.editAmount', { defaultValue: 'Modifier' })}
                </button>
                <button
                  type="button"
                  onClick={() => setModal('accept')}
                  className="btn-primary px-4 py-2 text-xs"
                >
                  <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                  {t('admin.devis.actions.accept')}
                </button>
              </>
            )}
            {quote.status !== 'accepted' && quote.status !== 'rejected' && quote.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => setModal('reject')}
                className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:border-red-300 hover:text-red-600"
              >
                <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                {t('admin.devis.actions.reject')}
              </button>
            )}
          </div>
        }
      />

      {/* Client summary */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 p-5 ring-1 ring-secondary/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-secondary-700 text-sm font-bold text-white shadow-md">
              <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-secondary-700">
                {t('admin.devisDetail.client', { defaultValue: 'Client' })}
              </div>
              <Link
                to={`/admin/clients/${quote.clientId}`}
                className="text-sm font-bold text-primary transition hover:text-secondary md:text-base"
              >
                {quote.clientName || '—'}
              </Link>
              {quote.user?.company && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <FontAwesomeIcon icon={faBuilding} className="h-2.5 w-2.5" />
                  {quote.user.company}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-gray-600">
            {quote.user?.email && (
              <a
                href={`mailto:${quote.user.email}`}
                className="inline-flex items-center gap-1.5 transition hover:text-secondary"
              >
                <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3 text-secondary" />
                {quote.user.email}
              </a>
            )}
            {quote.user?.phone && (
              <a
                href={`tel:${quote.user.phone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-1.5 transition hover:text-secondary"
              >
                <FontAwesomeIcon icon={faPhone} className="h-3 w-3 text-secondary" />
                {quote.user.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* KPIs — Surface & Frequency only shown when meaningful for the picked
          service (e.g. hidden for arrosage, animaux, photovoltaïque…). */}
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
          <div className="mt-2 text-base font-bold text-primary">{formatDate(quote.startDate)}</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 text-secondary" />
            {t('espace.devisDetail.summary.location')}
          </div>
          <div className="mt-2 truncate text-base font-bold text-primary">{quote.city || '—'}</div>
        </div>
      </div>

      {/* Adaptive per-service details (plantCount, petType, panelCount, absence
          window, etc.). Renders nothing if the devis has no service-specific
          data — e.g. bureaux with surface only. */}
      <ServiceDetailsBlock service={quote.service} data={quote} />

      {/* Timeline */}
      {!isDeadEnd && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
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
                    {stepDates[step] ? formatDate(stepDates[step]) : '—'}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {quote.status === 'accepted' && !quote.convertedToMission && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-accent to-accent-700 p-6 shadow-lg shadow-accent/20 ring-1 ring-accent/30 md:p-7">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white ring-2 ring-white/30 backdrop-blur-sm">
                <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                  {t('admin.devisDetail.acceptedEyebrow', { defaultValue: 'PROCHAINE ÉTAPE' })}
                </div>
                <div className="mt-0.5 text-lg font-bold text-white md:text-xl">
                  {t('admin.devisDetail.acceptedTitle', { defaultValue: 'Devis accepté' })}
                </div>
                <div className="mt-1 max-w-xl text-sm font-medium text-white/85">
                  {t('admin.devisDetail.acceptedHint', {
                    defaultValue: 'Convertissez maintenant ce devis en mission.',
                  })}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setConvertOpen(true)}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-accent-700 shadow-lg transition hover:scale-[1.02] hover:bg-white/95 md:shrink-0"
            >
              <FontAwesomeIcon icon={faCalendarCheck} className="h-3.5 w-3.5" />
              {t('admin.devisDetail.convertCta', { defaultValue: 'Convertir en mission' })}
              <span className="transition group-hover:translate-x-0.5">→</span>
            </button>
          </div>
        </div>
      )}

      {isDeadEnd && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center text-sm font-semibold text-gray-500">
          {quote.status === 'cancelled'
            ? 'Cette demande a été annulée.'
            : 'Ce devis a été refusé.'}
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

          {/* Per-room photos */}
          {Array.isArray(quote.rooms) && quote.rooms.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('admin.devisDetail.rooms', { defaultValue: 'Pièces à nettoyer' })}
              </h2>
              <div className="mt-4 space-y-4">
                {quote.rooms.map((r, i) => (
                  <div key={`${r.key}-${i}`} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-50 text-secondary">
                        <FontAwesomeIcon icon={ROOM_ICONS[r.key] || faEllipsis} className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-sm font-bold text-primary">
                          {t(`devis.rooms.${r.key}`, { defaultValue: r.key })}
                          <span className="ml-2 text-xs font-semibold text-gray-400">
                            × {r.count}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-gray-500">
                          {r.photos?.length || 0} photo(s)
                        </div>
                      </div>
                    </div>
                    {r.photos?.length > 0 && (
                      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                        {r.photos.map((url, j) => (
                          <li
                            key={j}
                            className="overflow-hidden rounded-lg ring-1 ring-gray-200"
                          >
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt={`${r.key} ${j + 1}`}
                                className="aspect-square w-full object-cover transition hover:opacity-80"
                              />
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General photos */}
          {Array.isArray(quote.photos) && quote.photos.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
                <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5 text-secondary" />
                {t('admin.devisDetail.generalPhotos', { defaultValue: 'Photos générales' })}
              </h2>
              <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {quote.photos.map((url, i) => (
                  <li key={i} className="overflow-hidden rounded-xl ring-1 ring-gray-200">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="aspect-square w-full object-cover transition hover:opacity-80"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(features) && features.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('espace.devisDetail.includes.title')}
              </h2>
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

          {/* Conversation thread between client and admin */}
          {(quote.replies?.length > 0 || quote.staffMessage) && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
                <FontAwesomeIcon icon={faCommentDots} className="h-3.5 w-3.5 text-secondary" />
                {t('admin.devisDetail.thread', { defaultValue: 'Échange avec le client' })}
              </h2>
              <div className="mt-4">
                <DevisThread
                  replies={quote.replies}
                  staffMessage={quote.staffMessage}
                  viewer="admin"
                />
              </div>
            </div>
          )}

          {/* Admin reply form — always available so admin can drop a message anytime */}
          {quote.status !== 'cancelled' && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('admin.devisDetail.replyForm', { defaultValue: 'Répondre au client' })}
              </h2>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {t('admin.devisDetail.replyHint', {
                  defaultValue: 'Le client recevra une notification dans son espace.',
                })}
              </p>
              <form onSubmit={handleSendReply} className="mt-4">
                <textarea
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={t('admin.devisDetail.replyPlaceholder', {
                    defaultValue: 'Votre message…',
                  })}
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
                {replyError && (
                  <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
                    {replyError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="btn-primary mt-3 px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  {sending ? (
                    <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3 animate-pulse" />
                  ) : (
                    <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
                  )}
                  Envoyer
                </button>
              </form>
            </div>
          )}
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
                    <span>
                      {t('espace.devisDetail.summary.vat', { rate: quote.vatRate })}
                    </span>
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
                {t('admin.devisDetail.notQuoted', {
                  defaultValue: 'Devis non chiffré — cliquez sur Envoyer pour proposer un montant.',
                })}
              </div>
            )}
          </div>

          {quote.convertedToMission && (
            <div className="rounded-2xl border border-secondary-200 bg-secondary-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-white">
                  <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-primary">
                    {t('admin.devisDetail.converted', { defaultValue: 'Mission planifiée' })}
                  </div>
                  <Link
                    to={`/admin/missions`}
                    className="text-xs font-bold text-secondary transition hover:text-secondary-700"
                  >
                    Voir la mission →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {modal && (
        <DevisActionModal
          devis={quote}
          mode={modal}
          onClose={() => setModal(null)}
          onSubmit={submitAction}
        />
      )}

      {convertOpen && (
        <ConvertMissionModal
          devis={quote}
          onClose={() => setConvertOpen(false)}
          onSuccess={() => reload()}
        />
      )}
    </div>
  )
}
