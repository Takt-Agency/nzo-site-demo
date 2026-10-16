import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCircleExclamation,
  faTriangleExclamation,
  faClock,
  faTag,
  faPaperPlane,
  faSpinner,
  faCircleCheck,
  faLock,
  faFileLines,
} from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/espace/PageHeader.jsx'
import DevisThread from '../../components/espace/DevisThread.jsx'
import { meApi, ApiError } from '../../lib/api.js'
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

const SEVERITY_TONE = {
  low: 'bg-gray-100 text-gray-600 ring-gray-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  high: 'bg-red-50 text-red-700 ring-red-200',
}

const STATUS_TONE = {
  open: 'bg-amber-50 text-amber-700 ring-amber-200',
  in_review: 'bg-secondary/10 text-secondary-700 ring-secondary/30',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-gray-100 text-gray-600 ring-gray-200',
}

export default function ReclamationDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [actionError, setActionError] = useState(null)

  const fetcher = useCallback(() => meApi.getReclamation(id), [id])
  const { data, loading, error, reload } = useApi(fetcher, [id])
  const r = data?.reclamation

  const onReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setActionError(null)
    setSending(true)
    try {
      await meApi.replyReclamation(id, reply.trim())
      setReply('')
      reload()
    } catch (err) {
      setActionError(err.message || 'Erreur')
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

  if (error || !r) {
    const is404 = error instanceof ApiError && error.status === 404
    return (
      <div className="space-y-4">
        <Link
          to="/espace-client/reclamations"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          Retour à mes réclamations
        </Link>
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faCircleExclamation} className="h-8 w-8 text-gray-400" />
          <h2 className="mt-4 text-lg font-bold text-primary">
            {is404 ? 'Réclamation introuvable' : 'Erreur de chargement'}
          </h2>
          {error && !is404 && (
            <p className="mt-2 text-xs font-medium text-gray-500">{error.message}</p>
          )}
        </div>
      </div>
    )
  }

  const isClosed = r.status === 'closed'

  return (
    <div className="space-y-6">
      <Link
        to="/espace-client/reclamations"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        Retour à mes réclamations
      </Link>

      <PageHeader
        eyebrow={`RC-${id.slice(-6).toUpperCase()}`}
        title={r.subject}
        description={`${t(`espace.reclamationNew.categories.${r.category}`, { defaultValue: r.category })} · Reçue le ${formatDate(r.createdAt, true)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                STATUS_TONE[r.status] || STATUS_TONE.open
              }`}
            >
              {t(`admin.statuses.${r.status}`, { defaultValue: r.status })}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                SEVERITY_TONE[r.severity] || SEVERITY_TONE.medium
              }`}
            >
              {t(`espace.reclamationNew.severities.${r.severity}`, { defaultValue: r.severity })}
            </span>
          </div>
        }
      />

      {actionError && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
          {actionError}
        </div>
      )}

      {r.status === 'resolved' && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
            <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-bold text-emerald-800">Réclamation résolue</div>
            <div className="text-xs font-medium text-emerald-700">
              {r.resolvedAt ? `Le ${formatDate(r.resolvedAt, true)}` : 'Merci pour votre patience.'}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Original description */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
                <FontAwesomeIcon icon={faFileLines} className="h-3.5 w-3.5 text-secondary" />
                Votre réclamation
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                {formatDate(r.createdAt, true)}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
              {r.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {r.relatedRef && (
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary-50 px-3 py-1 text-[11px] font-bold text-secondary-700">
                  <FontAwesomeIcon icon={faTag} className="h-2.5 w-2.5" />
                  Réf. associée : {r.relatedRef}
                </span>
              )}
              {r.resolution && (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600">
                  Résolution souhaitée :{' '}
                  {t(`espace.reclamationNew.resolutions.${r.resolution}`, { defaultValue: r.resolution })}
                </span>
              )}
            </div>
          </div>

          {/* Thread */}
          {r.replies?.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">Conversation</h2>
              <div className="mt-4">
                <DevisThread replies={r.replies} viewer="client" />
              </div>
            </div>
          )}

          {/* Reply form */}
          {!isClosed ? (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">Répondre à l'admin</h2>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Ajoutez une précision, des photos complémentaires ou répondez à la dernière demande
                de notre équipe.
              </p>
              <form onSubmit={onReply} className="mt-4">
                <textarea
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Votre message…"
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
                <div className="mt-3">
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
                  >
                    {sending ? (
                      <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
                    ) : (
                      <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
                    )}
                    Envoyer
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-600">
              <FontAwesomeIcon icon={faLock} className="h-4 w-4 text-gray-400" />
              Cette réclamation est clôturée — vous ne pouvez plus y répondre.
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Détails</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">Catégorie</dt>
                <dd className="font-bold text-primary">
                  {t(`espace.reclamationNew.categories.${r.category}`, { defaultValue: r.category })}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">Gravité</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                      SEVERITY_TONE[r.severity] || SEVERITY_TONE.medium
                    }`}
                  >
                    {t(`espace.reclamationNew.severities.${r.severity}`, { defaultValue: r.severity })}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">Statut</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                      STATUS_TONE[r.status] || STATUS_TONE.open
                    }`}
                  >
                    {t(`admin.statuses.${r.status}`, { defaultValue: r.status })}
                  </span>
                </dd>
              </div>
              {r.incidentDate && (
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-gray-500">Date incident</dt>
                  <dd className="font-bold text-primary">{formatDate(r.incidentDate)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">Réponses</dt>
                <dd className="font-bold text-primary">{r.replies?.length || 0}</dd>
              </div>
              {r.resolvedAt && (
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-gray-500">Résolue le</dt>
                  <dd className="font-bold text-emerald-700">{formatDate(r.resolvedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-secondary/30 bg-secondary-50/40 p-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-secondary-700">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-3 w-3" />
              Besoin d'aide ?
            </div>
            <p className="mt-1.5 leading-relaxed text-gray-600">
              Si votre situation est urgente, contactez-nous directement par téléphone ou
              WhatsApp — un conseiller vous répondra immédiatement.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
