import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faSpinner, faSprayCanSparkles } from '@fortawesome/free-solid-svg-icons'
import { adminApi } from '../../lib/api.js'

function tomorrowIso() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}

// Modal used to convert an accepted devis into a scheduled mission.
// Lets the admin pick: title, date/time, duration, assigned agents, notes.
export default function ConvertMissionModal({ devis, onClose, onSuccess }) {
  const { t } = useTranslation()
  const [agents, setAgents] = useState([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [title, setTitle] = useState(
    `${devis.service[0].toUpperCase() + devis.service.slice(1)} — ${devis.surface} m²`,
  )
  const [date, setDate] = useState(tomorrowIso())
  const [duration, setDuration] = useState(4)
  const [staffIds, setStaffIds] = useState([])
  const [notes, setNotes] = useState(devis.notes || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    adminApi
      .listAgents()
      .then((res) => {
        if (!cancelled) setAgents(res.items || [])
      })
      .catch(() => {
        /* silent — admin can still convert without preselecting agents */
      })
      .finally(() => {
        if (!cancelled) setLoadingAgents(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggleAgent = (id) => {
    setStaffIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await adminApi.convertDevis(devis.id, {
        title,
        date,
        duration: Number(duration),
        staffIds,
        notes,
      })
      onSuccess(res.mission)
      onClose()
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-primary">
            <FontAwesomeIcon icon={faSprayCanSparkles} className="h-4 w-4 text-secondary" />
            {t('admin.devisDetail.convertTitle', { defaultValue: 'Convertir en mission' })}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(100vh-12rem)] space-y-4 overflow-y-auto p-5">
          <div className="rounded-xl bg-gray-50 p-3 text-xs">
            <div className="font-bold text-primary">{devis.clientName}</div>
            <div className="mt-0.5 text-gray-500">
              {devis.service} · {devis.surface} m² · {devis.amount} {devis.currency || 'CHF'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Titre de la mission *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Date et heure *
              </label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Durée (h)
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Agents assignés
            </label>
            {loadingAgents ? (
              <div className="mt-1.5 h-12 animate-pulse rounded-xl bg-gray-100" />
            ) : agents.length === 0 ? (
              <p className="mt-1.5 text-xs font-medium text-gray-500">
                Aucun agent disponible. Lance{' '}
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px]">
                  npm run seed:agents
                </code>{' '}
                côté backend pour en créer.
              </p>
            ) : (
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                {agents.map((a) => {
                  const active = staffIds.includes(a.id)
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAgent(a.id)}
                      className={`flex items-start gap-2.5 rounded-xl border-2 p-2.5 text-left transition ${
                        active
                          ? 'border-secondary bg-secondary/5'
                          : 'border-gray-200 bg-white hover:border-secondary/40'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          active ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {a.name
                          .split(' ')
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-primary">{a.name}</div>
                        <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                          {a.role}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Notes internes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions, accès, consignes spécifiques…"
              className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 px-5 py-2 text-xs font-bold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn-primary px-5 py-2 text-xs disabled:opacity-50">
              {submitting ? (
                <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faSprayCanSparkles} className="h-3 w-3" />
              )}
              Créer la mission
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
