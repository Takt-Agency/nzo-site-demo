import { useCallback, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faPlay,
  faCheck,
  faSpinner,
  faCircleCheck,
  faCircleExclamation,
  faLocationDot,
  faPhone,
  faUser,
  faClock,
  faRulerCombined,
  faCamera,
  faImage,
  faCalendarDay,
} from '@fortawesome/free-solid-svg-icons'
import ServiceDetailsBlock from '../../components/shared/ServiceDetailsBlock.jsx'
import { agentApi, meApi, ApiError } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const PHASES = [
  { key: 'before', tone: 'bg-blue-50 text-blue-700 ring-blue-200' },
  { key: 'during', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { key: 'after', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
]

const STATUS_TONE = {
  scheduled: 'bg-secondary/10 text-secondary-700 ring-secondary/30',
  inProgress: 'bg-accent/10 text-accent-700 ring-accent/30',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

export default function AgentMissionDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const fetcher = useCallback(() => agentApi.getMission(id), [id])
  const { data, loading, error, reload } = useApi(fetcher, [id])
  const m = data?.mission

  const [busy, setBusy] = useState(null) // 'start' | 'complete' | 'upload-<phase>'
  const [actionError, setActionError] = useState(null)

  const start = async () => {
    setActionError(null)
    setBusy('start')
    try {
      await agentApi.startMission(id)
      reload()
    } catch (err) {
      setActionError(err.message || t('agent.errors.generic'))
    } finally {
      setBusy(null)
    }
  }

  const complete = async () => {
    if (!confirm(t('agent.missionDetail.confirmComplete'))) return
    setActionError(null)
    setBusy('complete')
    try {
      await agentApi.completeMission(id)
      reload()
    } catch (err) {
      setActionError(err.message || t('agent.errors.generic'))
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    )
  }

  if (error || !m) {
    const is404 = error instanceof ApiError && error.status === 404
    return (
      <div className="space-y-4">
        <Link
          to="/espace-agent/missions"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          {t('agent.missionDetail.back')}
        </Link>
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faCircleExclamation} className="h-8 w-8 text-gray-400" />
          <h2 className="mt-4 text-lg font-bold text-primary">
            {is404 ? t('agent.missionDetail.notFound') : t('agent.missionDetail.loadError')}
          </h2>
          {error && !is404 && (
            <p className="mt-2 text-xs font-medium text-gray-500">{error.message}</p>
          )}
        </div>
      </div>
    )
  }

  const photosByPhase = {
    before: m.progressPhotos.filter((p) => p.phase === 'before'),
    during: m.progressPhotos.filter((p) => p.phase === 'during'),
    after: m.progressPhotos.filter((p) => p.phase === 'after'),
  }

  const canStart = m.status === 'scheduled'
  const canComplete = m.status === 'inProgress'

  return (
    <div className="space-y-5">
      <Link
        to="/espace-agent/missions"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {t('agent.missionDetail.back')}
      </Link>

      {/* Header card */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
              STATUS_TONE[m.status] || STATUS_TONE.scheduled
            }`}
          >
            {t(`agent.statuses.${m.status}`, { defaultValue: m.status })}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            {t('agent.missionDetail.refPrefix')}{m.id.slice(-6).toUpperCase()}
          </span>
        </div>
        <h1 className="mt-2 text-xl font-bold leading-tight md:text-2xl">{m.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-medium text-white/85">
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCalendarDay} className="h-3 w-3 text-accent" />
            {formatDateTime(m.date)}
          </span>
          {m.duration && (
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faClock} className="h-3 w-3 text-accent" />
              {t('agent.missionDetail.duration', { hours: m.duration })}
            </span>
          )}
          {m.city && (
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 text-accent" />
              {m.city}
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
          {actionError}
        </div>
      )}

      {/* Action bar */}
      {(canStart || canComplete) && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold text-primary">
                {canStart
                  ? t('agent.missionDetail.actionStartTitle')
                  : t('agent.missionDetail.actionInProgressTitle')}
              </div>
              <div className="text-xs font-medium text-gray-500">
                {canStart
                  ? t('agent.missionDetail.actionStartHint')
                  : t('agent.missionDetail.actionCompleteHint')}
              </div>
            </div>
            {canStart && (
              <button
                type="button"
                onClick={start}
                disabled={busy !== null}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-md shadow-accent/30 transition hover:bg-accent-600 disabled:opacity-50"
              >
                {busy === 'start' ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faPlay} className="h-3.5 w-3.5" />
                )}
                {t('agent.missionDetail.btnStart')}
              </button>
            )}
            {canComplete && (
              <button
                type="button"
                onClick={complete}
                disabled={busy !== null}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy === 'complete' ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
                )}
                {t('agent.missionDetail.btnComplete')}
              </button>
            )}
          </div>
        </div>
      )}

      {m.status === 'completed' && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
            <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-bold text-emerald-800">{t('agent.missionDetail.completedBadgeTitle')}</div>
            <div className="text-xs font-medium text-emerald-700">
              {t('agent.missionDetail.completedBadgeText', { date: formatDateTime(m.completedAt) })}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Adaptive per-service details (plants, pets, panels, absence
              period…) so the agent knows what the client actually needs. */}
          <ServiceDetailsBlock service={m.service} data={m} />

          {/* Photos by phase */}
          {PHASES.map(({ key, tone }) => (
            <PhaseBlock
              key={key}
              missionId={m.id}
              phase={key}
              label={t(`agent.missionDetail.phases.${key}`)}
              tone={tone}
              photos={photosByPhase[key]}
              disabled={m.status === 'completed' || m.status === 'cancelled' || busy !== null}
              onUploaded={reload}
            />
          ))}

          {/* Notes */}
          {m.notes && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary">{t('agent.missionDetail.notesTitle')}</h2>
              <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
                {m.notes}
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Client info */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('agent.missionDetail.clientTitle')}</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-secondary-700 text-xs font-bold text-white">
                <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-primary">{m.clientName}</div>
              </div>
            </div>
            {m.clientPhone && (
              <a
                href={`tel:${m.clientPhone.replace(/\s/g, '')}`}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-secondary px-4 py-2.5 text-xs font-bold text-secondary transition hover:bg-secondary hover:text-white"
              >
                <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
                {t('agent.missionDetail.callClient')}
              </a>
            )}
          </div>

          {/* Address */}
          {(m.address || m.city) && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('agent.missionDetail.addressTitle')}</h2>
              <div className="mt-3 flex items-start gap-2 text-sm font-medium leading-relaxed text-gray-700">
                <FontAwesomeIcon icon={faLocationDot} className="mt-1 h-3 w-3 text-secondary" />
                <span>
                  {m.address}
                  {m.address && m.city && <br />}
                  {m.city}
                </span>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('agent.missionDetail.timelineTitle')}</h2>
            <ul className="mt-3 space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-white">
                  <FontAwesomeIcon icon={faCheck} className="h-2 w-2" />
                </span>
                <div>
                  <div className="font-bold text-primary">{t('agent.missionDetail.timelineScheduled')}</div>
                  <div className="font-medium text-gray-500">{formatDateTime(m.date)}</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span
                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white ${
                    m.startedAt ? 'bg-accent' : 'bg-gray-200'
                  }`}
                >
                  <FontAwesomeIcon icon={faPlay} className="h-2 w-2" />
                </span>
                <div>
                  <div className="font-bold text-primary">{t('agent.missionDetail.timelineStarted')}</div>
                  <div className="font-medium text-gray-500">
                    {m.startedAt ? formatDateTime(m.startedAt) : '—'}
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span
                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white ${
                    m.completedAt ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <FontAwesomeIcon icon={faCircleCheck} className="h-2 w-2" />
                </span>
                <div>
                  <div className="font-bold text-primary">{t('agent.missionDetail.timelineCompleted')}</div>
                  <div className="font-medium text-gray-500">
                    {m.completedAt ? formatDateTime(m.completedAt) : '—'}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PhaseBlock({ missionId, phase, label, tone, photos, disabled, onUploaded }) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const onPick = () => {
    if (disabled || uploading) return
    inputRef.current?.click()
  }

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    setUploadError(null)
    setUploading(true)
    try {
      const up = await meApi.uploadPhotos(files)
      const photosPayload = (up.items || []).map((it) => ({ url: it.url, phase }))
      if (photosPayload.length > 0) {
        await agentApi.addPhotos(missionId, photosPayload)
        onUploaded()
      }
    } catch (err) {
      setUploadError(err.message || t('agent.errors.upload'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${tone}`}
          >
            {t('agent.missionDetail.phasePhotosLabel', { phase: label })}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {t('agent.missionDetail.photoCount', { count: photos.length })}
          </span>
        </div>
        <button
          type="button"
          onClick={onPick}
          disabled={disabled || uploading}
          className="inline-flex items-center gap-2 rounded-full border-2 border-secondary px-4 py-2 text-xs font-bold text-secondary transition hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-secondary"
        >
          {uploading ? (
            <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
          ) : (
            <FontAwesomeIcon icon={faCamera} className="h-3 w-3" />
          )}
          {t('agent.missionDetail.photoAdd')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={onFiles}
        />
      </div>

      {uploadError && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
          {uploadError}
        </div>
      )}

      {photos.length === 0 ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 p-4 text-xs font-medium text-gray-500">
          <FontAwesomeIcon icon={faImage} className="h-3 w-3 text-gray-400" />
          {t('agent.missionDetail.photosEmpty')}
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {photos.map((p, i) => (
            <li key={p.id || i} className="overflow-hidden rounded-xl ring-1 ring-gray-200">
              <a href={p.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={p.url}
                  alt={t('agent.missionDetail.photoAltLabel', { phase: label, n: i + 1 })}
                  className="aspect-square w-full object-cover transition hover:opacity-80"
                />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
