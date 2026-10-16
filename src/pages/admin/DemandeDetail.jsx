import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCircleExclamation,
  faClock,
  faUser,
  faUserGear,
  faEnvelope,
  faPhone,
  faPaperPlane,
  faSpinner,
  faCheck,
  faTag,
  faFileLines,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import DevisThread from '../../components/espace/DevisThread.jsx'
import { adminApi, ApiError } from '../../lib/api.js'
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

const TYPE_LABELS_FR = {
  info: 'Information',
  mission: 'À propos d\'une mission',
  devis: 'À propos d\'un devis',
  planning: 'Planning',
  equipment: 'Matériel',
  leave: 'Congés / absence',
  incident: 'Incident',
  other: 'Autre',
}

export default function AdminDemandeDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [actionError, setActionError] = useState(null)

  const fetcher = useCallback(() => adminApi.getDemande(id), [id])
  const { data, loading, error, reload } = useApi(fetcher, [id])
  const d = data?.demande

  const onReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setActionError(null)
    setSending(true)
    try {
      await adminApi.replyDemande(id, reply.trim())
      setReply('')
      reload()
    } catch (err) {
      setActionError(err.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  const setStatus = async (status) => {
    setActionError(null)
    setUpdating(true)
    try {
      await adminApi.updateDemande(id, { status })
      reload()
    } catch (err) {
      setActionError(err.message || 'Erreur')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    )
  }

  if (error || !d) {
    const is404 = error instanceof ApiError && error.status === 404
    return (
      <div className="space-y-4">
        <Link
          to="/admin/demandes"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          Retour aux demandes
        </Link>
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faCircleExclamation} className="h-8 w-8 text-gray-400" />
          <h2 className="mt-4 text-lg font-bold text-primary">
            {is404 ? 'Demande introuvable' : 'Erreur de chargement'}
          </h2>
          {error && !is404 && (
            <p className="mt-2 text-xs font-medium text-gray-500">{error.message}</p>
          )}
        </div>
      </div>
    )
  }

  const isAgent = d.from === 'agent'
  const senderTone = isAgent
    ? 'from-accent/15 to-accent/5 ring-accent/20'
    : 'from-primary-50 to-secondary-50 ring-secondary/10'
  const senderBadgeTone = isAgent
    ? 'bg-accent text-white'
    : 'bg-gradient-to-br from-primary-700 to-secondary-700 text-white'
  const senderLabel = isAgent ? 'AGENT TERRAIN' : 'CLIENT'

  return (
    <div className="space-y-6">
      <Link
        to="/admin/demandes"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        Retour aux demandes
      </Link>

      <AdminPageHeader
        eyebrow={`DM-${id.slice(-6).toUpperCase()}`}
        title={d.subject}
        description={`${TYPE_LABELS_FR[d.type] || d.type} · Reçue le ${formatDate(d.receivedAt, true)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={d.status} label={t(`admin.statuses.${d.status}`)} />
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                PRIORITY_TONE[d.priority] || PRIORITY_TONE.normal
              }`}
            >
              {t(`admin.demandes.priority.${d.priority}`, { defaultValue: d.priority })}
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

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Sender card — visually different for agent vs client */}
          <div className={`rounded-2xl bg-gradient-to-br p-5 ring-1 ${senderTone}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-md ${senderBadgeTone}`}
                >
                  <FontAwesomeIcon icon={isAgent ? faUserGear : faUser} className="h-5 w-5" />
                </span>
                <div>
                  <div
                    className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                      isAgent ? 'text-accent-700' : 'text-secondary-700'
                    }`}
                  >
                    {senderLabel}
                  </div>
                  {isAgent ? (
                    <div className="text-base font-bold text-primary md:text-lg">{d.clientName}</div>
                  ) : (
                    <Link
                      to={`/admin/clients/${d.clientId}`}
                      className="text-base font-bold text-primary transition hover:text-secondary md:text-lg"
                    >
                      {d.clientName}
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-gray-600 sm:justify-end">
                {d.user?.email && (
                  <a
                    href={`mailto:${d.user.email}`}
                    className="inline-flex items-center gap-1.5 transition hover:text-secondary"
                  >
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className={`h-3 w-3 ${isAgent ? 'text-accent' : 'text-secondary'}`}
                    />
                    {d.user.email}
                  </a>
                )}
                {d.user?.phone && (
                  <a
                    href={`tel:${d.user.phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-1.5 transition hover:text-secondary"
                  >
                    <FontAwesomeIcon
                      icon={faPhone}
                      className={`h-3 w-3 ${isAgent ? 'text-accent' : 'text-secondary'}`}
                    />
                    {d.user.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Initial message */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
                <FontAwesomeIcon icon={faFileLines} className="h-3.5 w-3.5 text-secondary" />
                Message initial
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                {formatDate(d.receivedAt, true)}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
              {d.message}
            </p>
            {d.relatedRef && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary-50 px-3 py-1 text-[11px] font-bold text-secondary-700">
                <FontAwesomeIcon icon={faTag} className="h-2.5 w-2.5" />
                Réf. associée : {d.relatedRef}
              </div>
            )}
          </div>

          {/* Thread */}
          {d.replies?.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">Conversation</h2>
              <div className="mt-4">
                <DevisThread replies={d.replies} viewer="admin" />
              </div>
            </div>
          )}

          {/* Reply form */}
          {d.status !== 'closed' && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">
                Répondre à {isAgent ? "l'agent" : 'au client'}
              </h2>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {isAgent
                  ? "L'agent recevra une notification dans son espace agent."
                  : 'Le client recevra une notification dans son espace.'}
              </p>
              <form onSubmit={onReply} className="mt-4">
                <textarea
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Votre réponse…"
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
                <div className="mt-3 flex flex-wrap gap-2">
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
                    Envoyer la réponse
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          {/* Status & actions */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Statut</h2>
            <div className="mt-3 space-y-2">
              {[
                { value: 'new', label: 'Nouvelle' },
                { value: 'in_review', label: "À l'étude" },
                { value: 'replied', label: 'Répondue' },
                { value: 'closed', label: 'Clôturée' },
              ].map((s) => {
                const active = d.status === s.value
                return (
                  <button
                    key={s.value}
                    type="button"
                    disabled={updating || active}
                    onClick={() => setStatus(s.value)}
                    className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-2 text-left text-xs font-bold transition ${
                      active
                        ? 'border-accent bg-accent/5 text-accent-700'
                        : 'border-gray-200 text-gray-700 hover:border-accent/40 hover:text-primary'
                    } ${updating ? 'opacity-50' : ''}`}
                  >
                    {s.label}
                    {active && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Meta */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Détails</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">Type</dt>
                <dd className="font-bold text-primary">
                  {TYPE_LABELS_FR[d.type] || d.type}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">Priorité</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                      PRIORITY_TONE[d.priority] || PRIORITY_TONE.normal
                    }`}
                  >
                    {t(`admin.demandes.priority.${d.priority}`, { defaultValue: d.priority })}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">Origine</dt>
                <dd className="font-bold text-primary">
                  {isAgent ? 'Agent terrain' : 'Client'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">Reçue</dt>
                <dd className="font-bold text-primary">{formatDate(d.receivedAt, true)}</dd>
              </div>
              {d.updatedAt && d.updatedAt !== d.createdAt && (
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-gray-500">Mise à jour</dt>
                  <dd className="font-bold text-primary">{formatDate(d.updatedAt, true)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">Réponses</dt>
                <dd className="font-bold text-primary">{d.replies?.length || 0}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}
