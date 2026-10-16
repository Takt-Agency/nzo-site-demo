import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faReply,
  faPaperPlane,
  faSpinner,
  faTriangleExclamation,
  faClock,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import DevisThread from '../../components/espace/DevisThread.jsx'
import RowActions from '../../components/admin/RowActions.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const severityColors = {
  low: 'bg-gray-100 text-gray-500',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-50 text-red-600',
}

export default function AdminReclamations() {
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeId, setActiveId] = useState(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const fetcher = useCallback(() => adminApi.listReclamations(), [])
  const { data, loading, error: loadError, reload } = useApi(fetcher)
  const items = data?.items || []
  const filtered = statusFilter === 'all' ? items : items.filter((r) => r.status === statusFilter)
  const active = items.find((r) => r.id === activeId) || null

  const tabs = ['all', 'open', 'in_review', 'resolved', 'closed']

  const handleReply = async (e) => {
    e.preventDefault()
    if (!reply.trim() || !active) return
    setError(null)
    setSending(true)
    try {
      await adminApi.replyReclamation(active.id, reply.trim())
      setReply('')
      reload()
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  const handleResolve = async () => {
    if (!active) return
    if (!confirm('Marquer cette réclamation comme résolue ?')) return
    setError(null)
    try {
      await adminApi.updateReclamation(active.id, { status: 'resolved' })
      reload()
    } catch (err) {
      setError(err.message || 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={t('admin.reclamations.eyebrow')}
        title={t('admin.reclamations.title')}
        description={t('admin.reclamations.subtitle')}
      />

      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {loadError.message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((s) => {
          const a = statusFilter === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                a
                  ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-primary'
              }`}
            >
              {s === 'all' ? t('admin.devis.tabs.all') : t(`admin.statuses.${s}`)}
            </button>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          {loading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-6 w-6 text-gray-300" />
              <p className="mt-3 text-sm font-bold text-primary">Aucune réclamation</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const sel = active?.id === r.id
                return (
                  <li key={r.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveId(r.id)}
                      className={`block w-full p-4 text-left transition ${
                        sel ? 'bg-secondary-50/60' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 pr-10">
                        <StatusBadge status={r.status} label={t(`admin.statuses.${r.status}`)} />
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${severityColors[r.severity]}`}
                        >
                          {t(`admin.reclamations.severity.${r.severity}`)}
                        </span>
                      </div>
                      <div className="mt-1.5 truncate text-sm font-bold text-primary">
                        {r.subject}
                      </div>
                      <div className="mt-0.5 text-xs font-medium text-secondary-700">
                        {r.clientName}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                        {formatDate(r.receivedAt)}
                      </div>
                    </button>
                    <div className="absolute right-3 top-3">
                      <RowActions
                        resource="reclamations"
                        id={r.id}
                        isArchived={r.isArchived}
                        itemLabel={`la réclamation « ${r.subject} »`}
                        onChange={reload}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          {!active ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
              <FontAwesomeIcon icon={faReply} className="h-7 w-7 text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-gray-500">
                Sélectionnez une réclamation pour la traiter.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {active.id.slice(-6).toUpperCase()}
                  </div>
                  <h3 className="mt-1 text-base font-bold text-primary md:text-lg">
                    {active.subject}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-secondary-700">{active.clientName}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                      {t(`admin.reclamations.category.${active.category}`)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 ${severityColors[active.severity]}`}>
                      {t(`admin.reclamations.severity.${active.severity}`)}
                    </span>
                  </div>
                </div>
                <StatusBadge status={active.status} label={t(`admin.statuses.${active.status}`)} />
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm font-medium leading-relaxed text-gray-700">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Description — {formatDate(active.receivedAt)}
                </div>
                <p className="mt-2 whitespace-pre-line">{active.description}</p>
              </div>

              {active.replies?.length > 0 && (
                <div className="mt-5">
                  <DevisThread replies={active.replies} viewer="admin" />
                </div>
              )}

              {active.status !== 'resolved' && active.status !== 'closed' && (
                <form onSubmit={handleReply} className="mt-5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Répondre au client
                  </label>
                  <textarea
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Votre réponse…"
                    className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  {error && (
                    <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
                      {error}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={sending || !reply.trim()}
                      className="btn-primary px-5 py-2 text-xs disabled:opacity-50"
                    >
                      {sending ? (
                        <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
                      )}
                      Envoyer
                    </button>
                    <button
                      type="button"
                      onClick={handleResolve}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-accent/40 px-4 py-2 text-xs font-bold text-accent-700 transition hover:bg-accent/10"
                    >
                      <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                      Marquer résolue
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
