import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCircleExclamation,
  faClock,
  faPaperPlane,
  faSpinner,
  faTag,
  faFileLines,
  faLock,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import DevisThread from '../../components/espace/DevisThread.jsx'
import { agentApi, ApiError } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function formatDate(iso, withYear = false) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(
    'fr-CH',
    withYear
      ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' },
  ).format(new Date(iso))
}

const PRIORITY_TONE = {
  low: 'bg-gray-100 text-gray-600 ring-gray-200',
  normal: 'bg-secondary/10 text-secondary-700 ring-secondary/30',
  high: 'bg-red-50 text-red-700 ring-red-200',
}

const STATUS_TONE = {
  new: 'bg-accent/10 text-accent-700 ring-accent/30',
  in_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  replied: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-gray-100 text-gray-600 ring-gray-200',
}

export default function AgentDemandeDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [actionError, setActionError] = useState(null)

  const fetcher = useCallback(() => agentApi.getDemande(id), [id])
  const { data, loading, error, reload } = useApi(fetcher, [id])
  const d = data?.demande

  const onReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setActionError(null)
    setSending(true)
    try {
      await agentApi.replyDemande(id, reply.trim())
      setReply('')
      reload()
    } catch (err) {
      setActionError(err.message || t('agent.errors.generic'))
    } finally {
      setSending(false)
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

  if (error || !d) {
    const is404 = error instanceof ApiError && error.status === 404
    return (
      <div className="space-y-4">
        <Link
          to="/espace-agent/demandes"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          {t('agent.demandeDetail.back')}
        </Link>
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faCircleExclamation} className="h-8 w-8 text-gray-400" />
          <h2 className="mt-4 text-lg font-bold text-primary">
            {is404 ? t('agent.demandeDetail.notFound') : t('agent.demandeDetail.loadError')}
          </h2>
          {error && !is404 && (
            <p className="mt-2 text-xs font-medium text-gray-500">{error.message}</p>
          )}
        </div>
      </div>
    )
  }

  const isClosed = d.status === 'closed'

  return (
    <div className="space-y-5">
      <Link
        to="/espace-agent/demandes"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {t('agent.demandeDetail.back')}
      </Link>

      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
              STATUS_TONE[d.status] || STATUS_TONE.new
            }`}
          >
            {t(`agent.demandeStatuses.${d.status}`, { defaultValue: d.status })}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
              PRIORITY_TONE[d.priority] || PRIORITY_TONE.normal
            }`}
          >
            {t(`agent.priorities.${d.priority}`, { defaultValue: d.priority })}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            {t('agent.demandeDetail.refPrefix')}{d.id.slice(-6).toUpperCase()}
          </span>
        </div>
        <h1 className="mt-2 text-xl font-bold leading-tight md:text-2xl">{d.subject}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-white/85">
          <span>{t(`agent.demandeTypes.${d.type}`, { defaultValue: d.type })}</span>
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faClock} className="h-3 w-3 text-accent" />
            {t('agent.demandeDetail.sentOn', { date: formatDate(d.createdAt, true) })}
          </span>
        </div>
      </div>

      {actionError && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
          {actionError}
        </div>
      )}

      {d.status === 'closed' && (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-500 text-white">
            <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-bold text-gray-700">{t('agent.demandeDetail.closedTitle')}</div>
            <div className="text-xs font-medium text-gray-500">
              {t('agent.demandeDetail.closedText')}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Original message */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
                <FontAwesomeIcon icon={faFileLines} className="h-3.5 w-3.5 text-accent" />
                {t('agent.demandeDetail.yourRequest')}
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                {formatDate(d.createdAt, true)}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
              {d.message}
            </p>
            {d.relatedRef && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-bold text-accent-700">
                <FontAwesomeIcon icon={faTag} className="h-2.5 w-2.5" />
                {t('agent.demandeDetail.relatedRef', { ref: d.relatedRef })}
              </div>
            )}
          </div>

          {/* Thread */}
          {d.replies?.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">{t('agent.demandeDetail.conversation')}</h2>
              <div className="mt-4">
                {/* Pass viewer='client' so the agent's own messages render
                    right-aligned. DevisThread keys off 'from' field which is
                    'agent' or 'admin' on the backend — for visual purposes we
                    map the agent into the 'client' viewer slot. */}
                <DevisThread
                  replies={d.replies.map((r) =>
                    r.from === 'agent' ? { ...r, from: 'client' } : r,
                  )}
                  viewer="client"
                />
              </div>
            </div>
          )}

          {/* Reply form */}
          {!isClosed ? (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">{t('agent.demandeDetail.replyTitle')}</h2>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {t('agent.demandeDetail.replyHint')}
              </p>
              <form onSubmit={onReply} className="mt-4">
                <textarea
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={t('agent.demandeDetail.replyPlaceholder')}
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <div className="mt-3">
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-accent/30 transition hover:bg-accent-600 disabled:opacity-50"
                  >
                    {sending ? (
                      <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
                    ) : (
                      <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
                    )}
                    {t('agent.demandeDetail.send')}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-600">
              <FontAwesomeIcon icon={faLock} className="h-4 w-4 text-gray-400" />
              {t('agent.demandeDetail.closedLock')}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('agent.demandeDetail.details')}</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">{t('agent.demandeDetail.fieldType')}</dt>
                <dd className="font-bold text-primary">{t(`agent.demandeTypes.${d.type}`, { defaultValue: d.type })}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">{t('agent.demandeDetail.fieldPriority')}</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                      PRIORITY_TONE[d.priority] || PRIORITY_TONE.normal
                    }`}
                  >
                    {t(`agent.priorities.${d.priority}`, { defaultValue: d.priority })}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">{t('agent.demandeDetail.fieldStatus')}</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                      STATUS_TONE[d.status] || STATUS_TONE.new
                    }`}
                  >
                    {t(`agent.demandeStatuses.${d.status}`, { defaultValue: d.status })}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">{t('agent.demandeDetail.fieldSent')}</dt>
                <dd className="font-bold text-primary">{formatDate(d.createdAt, true)}</dd>
              </div>
              {d.updatedAt && d.updatedAt !== d.createdAt && (
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-gray-500">{t('agent.demandeDetail.fieldUpdated')}</dt>
                  <dd className="font-bold text-primary">{formatDate(d.updatedAt, true)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">{t('agent.demandeDetail.fieldReplies')}</dt>
                <dd className="font-bold text-primary">{d.replies?.length || 0}</dd>
              </div>
            </dl>
          </div>

          <Link
            to="/espace-agent/demandes/nouvelle"
            className="block rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-4 text-xs transition hover:border-accent/60 hover:bg-accent/10"
          >
            <div className="font-bold text-accent-700">{t('agent.demandeDetail.ctaNew')}</div>
            <p className="mt-1 leading-relaxed text-gray-600">
              {t('agent.demandeDetail.ctaNewHint')}
            </p>
          </Link>
        </aside>
      </div>
    </div>
  )
}
