import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCalendarDay,
  faLocationDot,
  faUsers,
  faClock,
  faCircleCheck,
  faCircleExclamation,
  faCloudArrowUp,
  faXmark,
  faPlay,
  faSpinner,
  faImage,
  faStar,
  faFileInvoiceDollar,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import MissionLiveTimer, { MissionFinalDuration } from '../../components/admin/MissionLiveTimer.jsx'
import MissionChatPanel from '../../components/admin/MissionChatPanel.jsx'
import PhotoLightbox from '../../components/shared/PhotoLightbox.jsx'
import ServiceDetailsBlock from '../../components/shared/ServiceDetailsBlock.jsx'
import { adminApi, meApi, ApiError } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function formatDate(iso, withTime = true) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(
    'fr-CH',
    withTime
      ? { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { dateStyle: 'medium' },
  ).format(new Date(iso))
}

function formatCurrency(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(n)
}

function shortId(id) {
  return `MS-${id.slice(-6).toUpperCase()}`
}

const PHASES = [
  { value: 'before', label: 'Avant' },
  { value: 'during', label: 'Pendant' },
  { value: 'after', label: 'Après' },
]

export default function AdminMissionDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [uploading, setUploading] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [uploadPhase, setUploadPhase] = useState('during')
  // Lightbox: which set of photos is open and which one is active.
  const [lightbox, setLightbox] = useState({ photos: [], index: 0 })
  const openLightbox = (photos, index) => setLightbox({ photos, index })
  const closeLightbox = () => setLightbox({ photos: [], index: 0 })

  const fetcher = useCallback(() => adminApi.getMission(id), [id])
  const { data, loading, error, reload } = useApi(fetcher, [id])
  const mission = data?.mission

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
      </div>
    )
  }

  if (error || !mission) {
    const is404 = error instanceof ApiError && error.status === 404
    return (
      <div className="space-y-6">
        <Link
          to="/admin/missions"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          Retour
        </Link>
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faCircleExclamation} className="h-8 w-8 text-gray-400" />
          <h2 className="mt-4 text-lg font-bold text-primary">
            {is404 ? 'Mission introuvable' : 'Erreur de chargement'}
          </h2>
        </div>
      </div>
    )
  }

  const handleStatusChange = async (newStatus) => {
    setActionError(null)
    setStatusBusy(true)
    try {
      await adminApi.updateMission(mission.id, { status: newStatus })
      reload()
    } catch (err) {
      setActionError(err.message || 'Erreur')
    } finally {
      setStatusBusy(false)
    }
  }

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return
    setActionError(null)
    setUploading(true)
    try {
      // Upload via the shared endpoint, then attach URLs to the mission.
      const { items } = await meApi.uploadPhotos(Array.from(files))
      await adminApi.addMissionPhotos(
        mission.id,
        items.map((it) => ({ url: it.url, phase: uploadPhase })),
      )
      reload()
    } catch (err) {
      setActionError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = async (photoId) => {
    if (!confirm('Supprimer cette photo ?')) return
    try {
      await adminApi.removeMissionPhoto(mission.id, photoId)
      reload()
    } catch (err) {
      setActionError(err.message || 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/missions"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        Retour aux missions
      </Link>

      <AdminPageHeader
        eyebrow={shortId(mission.id)}
        title={mission.title}
        description={mission.clientName}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={mission.status} label={t(`admin.statuses.${mission.status}`)} />
            {mission.status === 'scheduled' && (
              <button
                type="button"
                onClick={() => handleStatusChange('inProgress')}
                disabled={statusBusy}
                className="btn-primary px-4 py-2 text-xs disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPlay} className="h-3 w-3" />
                Démarrer
              </button>
            )}
            {mission.status === 'inProgress' && (
              <button
                type="button"
                onClick={() => handleStatusChange('completed')}
                disabled={statusBusy}
                className="btn-primary px-4 py-2 text-xs disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                Marquer terminée
              </button>
            )}
            {mission.status === 'completed' && (
              <Link
                to={`/admin/factures/nouvelle?mission=${mission.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-bold text-white shadow-sm shadow-accent/30 transition hover:bg-accent-600"
              >
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="h-3 w-3" />
                Convertir en facture
              </Link>
            )}
            {mission.status !== 'cancelled' && mission.status !== 'completed' && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Annuler cette mission ?')) handleStatusChange('cancelled')
                }}
                disabled={statusBusy}
                className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:border-red-300 hover:text-red-600"
              >
                <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                Annuler
              </button>
            )}
          </div>
        }
      />

      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {actionError}
        </div>
      )}

      {mission.status === 'completed' && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-accent to-accent-700 p-5 shadow-lg shadow-accent/20 md:p-6">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white ring-2 ring-white/30 backdrop-blur-sm">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                  PROCHAINE ÉTAPE
                </div>
                <div className="mt-0.5 text-base font-bold text-white md:text-lg">
                  Émettre la facture pour cette mission
                </div>
                <div className="mt-1 text-xs font-medium text-white/85">
                  Mission terminée
                  {mission.amount ? ` · Montant ${formatCurrency(mission.amount)}` : ''}.
                </div>
              </div>
            </div>
            <Link
              to={`/admin/factures/nouvelle?mission=${mission.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-accent-700 shadow-md transition hover:scale-[1.02]"
            >
              <FontAwesomeIcon icon={faFileInvoiceDollar} className="h-3.5 w-3.5" />
              Créer la facture →
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Mission info */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-base font-bold text-primary md:text-lg">Informations</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Date et heure
                </dt>
                <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FontAwesomeIcon icon={faCalendarDay} className="h-3 w-3 text-accent" />
                  {formatDate(mission.date)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Durée
                </dt>
                <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FontAwesomeIcon icon={faClock} className="h-3 w-3 text-accent" />
                  {mission.duration}h
                </dd>
              </div>
              {mission.address && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Adresse
                  </dt>
                  <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 text-accent" />
                    {mission.address}
                  </dd>
                </div>
              )}
              {mission.staff?.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Agents assignés
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {mission.staff.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 rounded-full bg-secondary-50 px-2.5 py-0.5 text-xs font-semibold text-secondary-700"
                      >
                        <FontAwesomeIcon icon={faUsers} className="h-2.5 w-2.5" />
                        {s}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
            {mission.notes && (
              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Notes internes
                </div>
                <p className="mt-1 whitespace-pre-line text-sm font-medium text-gray-700">
                  {mission.notes}
                </p>
              </div>
            )}
          </div>

          {/* Adaptive per-service details copied from the source devis. */}
          <ServiceDetailsBlock service={mission.service} data={mission} />

          {/* Photos */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
                <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5 text-secondary" />
                Photos d'avancement
                <span className="text-xs font-semibold text-gray-400">
                  ({mission.progressPhotos?.length || 0})
                </span>
              </h2>
              <div className="flex items-center gap-1.5">
                {PHASES.map((p) => {
                  const active = uploadPhase === p.value
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setUploadPhase(p.value)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                        active
                          ? 'bg-secondary text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <label
              htmlFor="mission-photos"
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition hover:border-secondary hover:bg-secondary-50/40 ${
                uploading ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {uploading ? (
                <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-secondary" />
              ) : (
                <FontAwesomeIcon icon={faCloudArrowUp} className="h-6 w-6 text-secondary" />
              )}
              <div className="mt-3 text-sm font-bold text-primary">
                {uploading ? 'Upload en cours…' : `Ajouter des photos (${PHASES.find((p) => p.value === uploadPhase).label})`}
              </div>
              <div className="mt-1 text-xs font-medium text-gray-500">
                JPG, PNG, WebP — 5 Mo max par image
              </div>
              <input
                id="mission-photos"
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>

            {mission.progressPhotos?.length > 0 && (
              <div className="mt-5 space-y-4">
                {PHASES.map((phase) => {
                  const phasePhotos = mission.progressPhotos.filter((p) => p.phase === phase.value)
                  if (phasePhotos.length === 0) return null
                  return (
                    <div key={phase.value}>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        {phase.label} ({phasePhotos.length})
                      </div>
                      <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                        {phasePhotos.map((p, idx) => (
                          <li
                            key={p.id}
                            className="group relative overflow-hidden rounded-lg ring-1 ring-gray-200"
                          >
                            <button
                              type="button"
                              onClick={() => openLightbox(phasePhotos, idx)}
                              aria-label="Agrandir la photo"
                              className="block w-full"
                            >
                              <img
                                src={p.url}
                                alt={p.caption || phase.label}
                                className="aspect-square w-full object-cover transition group-hover:opacity-80"
                              />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemovePhoto(p.id)
                              }}
                              aria-label="Supprimer"
                              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                            >
                              <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 p-6 text-white shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/65">
              Montant
            </div>
            <div className="mt-1 text-3xl font-bold leading-tight">
              {formatCurrency(mission.amount)}
            </div>
            {mission.devis && (
              <Link
                to={`/admin/devis/${mission.devis}`}
                className="mt-3 inline-flex text-xs font-bold text-white/80 transition hover:text-accent"
              >
                Voir le devis source →
              </Link>
            )}
          </div>

          {/* Live chronometer — visible only while the intervention runs.
              Reads server `startedAt` so a page refresh keeps the count. */}
          {mission.status === 'inProgress' && mission.startedAt && (
            <MissionLiveTimer
              startedAt={mission.startedAt}
              estimatedHours={mission.duration}
            />
          )}

          {mission.startedAt && (
            <div className="rounded-2xl bg-white p-4 text-xs shadow-sm ring-1 ring-gray-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Démarrée
              </div>
              <div className="mt-1 font-semibold text-primary">{formatDate(mission.startedAt)}</div>
            </div>
          )}
          {mission.completedAt && (
            <div className="rounded-2xl bg-accent/5 p-4 text-xs ring-1 ring-accent/20">
              <div className="text-[10px] font-bold uppercase tracking-wider text-accent-700">
                Terminée
              </div>
              <div className="mt-1 font-semibold text-primary">
                {formatDate(mission.completedAt)}
              </div>
            </div>
          )}

          {/* Persisted real duration once completed — this is the field the
              monthly agent stats report will aggregate later. */}
          {mission.status === 'completed' && mission.actualDurationMinutes ? (
            <MissionFinalDuration
              actualDurationMinutes={mission.actualDurationMinutes}
              estimatedHours={mission.duration}
            />
          ) : null}

          {/* Direct admin ↔ agent chat scoped to this mission — mission.messages
              is embedded so we reuse the same refresh path as the rest of the
              page (via `refresh` from useApi). */}
          <MissionChatPanel mission={mission} onRefresh={reload} />

          {mission.clientFeedback && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-yellow-200">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-primary">Avis client</h3>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <FontAwesomeIcon
                      key={n}
                      icon={faStar}
                      className={`h-3.5 w-3.5 ${
                        n <= mission.clientFeedback.rating ? 'text-yellow-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs font-bold text-gray-700">
                    {mission.clientFeedback.rating}/5
                  </span>
                </div>
              </div>
              {mission.clientFeedback.text && (
                <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
                  « {mission.clientFeedback.text} »
                </p>
              )}
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Reçu le {formatDate(mission.clientFeedback.submittedAt, false)}
              </div>
            </div>
          )}
        </aside>
      </div>

      {lightbox.photos.length > 0 && (
        <PhotoLightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onClose={closeLightbox}
          onIndexChange={(i) => setLightbox((prev) => ({ ...prev, index: i }))}
        />
      )}
    </div>
  )
}
