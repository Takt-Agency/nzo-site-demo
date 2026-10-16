import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faCalendarCheck,
  faLocationDot,
  faClock,
  faUsers,
  faFilePen,
  faImage,
  faCircleExclamation,
  faCircleCheck,
  faCamera,
  faLock,
  faFileLines,
  faSprayCanSparkles,
  faStar,
  faPaperPlane,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/espace/PageHeader.jsx'
import PhotoLightbox from '../../components/shared/PhotoLightbox.jsx'
import ServiceDetailsBlock from '../../components/shared/ServiceDetailsBlock.jsx'
import { meApi, ApiError } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const statusBadge = {
  scheduled: 'bg-secondary-100 text-secondary-700',
  inProgress: 'bg-tertiary-50 text-tertiary-700',
  completed: 'bg-accent/10 text-accent-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const timelineSteps = ['scheduled', 'inProgress', 'completed']

function formatDate(iso, withTime = false) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(
    'fr-CH',
    withTime
      ? {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      : { dateStyle: 'medium' },
  ).format(new Date(iso))
}

function formatCurrency(n, currency = 'CHF') {
  if (n == null) return null
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(n)
}

function shortId(id) {
  if (!id) return ''
  return `MS-${id.slice(-6).toUpperCase()}`
}

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function MissionDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  // Lightbox state: which set of photos is open and which one is active.
  const [lightbox, setLightbox] = useState({ photos: [], index: 0 })

  const openLightbox = (photos, index) => setLightbox({ photos, index })
  const closeLightbox = () => setLightbox({ photos: [], index: 0 })

  const fetcher = useCallback(() => meApi.getMission(id), [id])
  const { data, loading, error, reload } = useApi(fetcher, [id])
  const mission = data?.mission

  // --- Loading ----------------------------------------------------------
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

  // --- Not found / error ------------------------------------------------
  if (error || !mission) {
    const is404 = error instanceof ApiError && error.status === 404
    return (
      <div className="space-y-6">
        <Link
          to="/espace-client/missions"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          {t('espace.missionDetail.back')}
        </Link>
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faCircleExclamation} className="h-8 w-8 text-gray-400" />
          <h2 className="mt-4 text-lg font-bold text-primary">
            {is404 ? t('espace.missionDetail.notFound') : 'Erreur de chargement'}
          </h2>
          {error && !is404 && (
            <p className="mt-2 text-xs font-medium text-gray-500">{error.message}</p>
          )}
        </div>
      </div>
    )
  }

  // --- Derived ----------------------------------------------------------
  const currentStepIndex = timelineSteps.indexOf(mission.status)
  const isCancelled = mission.status === 'cancelled'
  const isCompleted = mission.status === 'completed'

  const stepDates = {
    scheduled: mission.createdAt || mission.date,
    inProgress: mission.startedAt,
    completed: mission.completedAt,
  }

  const beforePhotos = (mission.progressPhotos || []).filter((p) => p.phase === 'before')
  const duringPhotos = (mission.progressPhotos || []).filter((p) => p.phase === 'during')
  const afterPhotos = (mission.progressPhotos || []).filter((p) => p.phase === 'after')

  return (
    <div className="space-y-6">
      <Link
        to="/espace-client/missions"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {t('espace.missionDetail.back')}
      </Link>

      <PageHeader
        eyebrow={shortId(mission.id)}
        title={mission.title}
        description={
          isCompleted
            ? t('espace.missionDetail.completedOn', {
                date: formatDate(mission.completedAt || mission.date, true),
              })
            : t('espace.missionDetail.scheduledFor', {
                date: formatDate(mission.date, true),
              })
        }
        action={
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
              statusBadge[mission.status] || statusBadge.scheduled
            }`}
          >
            {isCompleted && (
              <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5 h-2.5 w-2.5" />
            )}
            {t(`espace.missions.statuses.${mission.status}`, { defaultValue: mission.status })}
          </span>
        }
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <FontAwesomeIcon icon={faCalendarCheck} className="h-3 w-3 text-secondary" />
            {t('espace.missionDetail.summary.date')}
          </div>
          <div className="mt-2 text-sm font-bold text-primary">{formatDate(mission.date)}</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <FontAwesomeIcon icon={faClock} className="h-3 w-3 text-secondary" />
            {t('espace.missionDetail.summary.duration')}
          </div>
          <div className="mt-2 text-xl font-bold text-primary">{mission.duration}h</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <FontAwesomeIcon icon={faSprayCanSparkles} className="h-3 w-3 text-secondary" />
            Service
          </div>
          <div className="mt-2 truncate text-base font-bold text-primary">
            {t(`services.${mission.service}.title`, { defaultValue: mission.service })}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 text-secondary" />
            {t('espace.missionDetail.summary.location')}
          </div>
          <div className="mt-2 truncate text-base font-bold text-primary">
            {mission.city || '—'}
          </div>
        </div>
      </div>

      {/* Timeline — hidden if cancelled */}
      {!isCancelled && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-7">
          <h2 className="text-base font-bold text-primary md:text-lg">
            {t('espace.missionDetail.timeline.title')}
          </h2>
          <ol className="mt-6 flex items-start">
            {timelineSteps.map((step, idx) => {
              const reached = idx <= currentStepIndex
              const active = idx === currentStepIndex
              const isLast = idx === timelineSteps.length - 1
              const leftReached = idx <= currentStepIndex
              const rightReached = idx < currentStepIndex
              const stepDate = stepDates[step]
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
                    {t(`espace.missionDetail.timeline.steps.${step}`, { defaultValue: step })}
                  </div>
                  <div className="mt-1 text-[10px] font-medium text-gray-500">
                    {stepDate ? formatDate(stepDate) : '—'}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center text-sm font-semibold text-gray-500">
          Cette mission a été annulée.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Adaptive per-service details copied from the source devis. */}
          <ServiceDetailsBlock service={mission.service} data={mission} />

          {/* Address */}
          {(mission.address || mission.city) && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('espace.missionDetail.address.title')}
              </h2>
              <div className="mt-3 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-50 text-secondary">
                  <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
                </span>
                <div className="text-sm font-medium leading-relaxed text-gray-700">
                  {mission.address}
                  {mission.address && mission.city && <br />}
                  {mission.city}
                </div>
              </div>
            </div>
          )}

          {/* Notes (instructions) */}
          {mission.notes && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-bold text-primary md:text-lg">
                {t('espace.missionDetail.description.title', { defaultValue: 'Détails' })}
              </h2>
              <div className="mt-3 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                  <FontAwesomeIcon icon={faFileLines} className="h-3.5 w-3.5" />
                </span>
                <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
                  {mission.notes}
                </p>
              </div>
            </div>
          )}

          {/* Photo blocks */}
          <PhotoBlock
            phase="before"
            label="Avant l'intervention"
            subtitle="Photos prises au début par notre équipe."
            photos={beforePhotos}
            missionStatus={mission.status}
            badgeClass="bg-primary text-white"
            iconBg="bg-primary/10 text-primary"
            onPhotoClick={openLightbox}
          />
          <PhotoBlock
            phase="during"
            label="Pendant l'intervention"
            subtitle="Suivi en temps réel de l'avancement."
            photos={duringPhotos}
            missionStatus={mission.status}
            badgeClass="bg-secondary text-white"
            iconBg="bg-secondary/10 text-secondary"
            onPhotoClick={openLightbox}
          />
          <PhotoBlock
            phase="after"
            label="Après l'intervention"
            subtitle="Résultat final — partagé une fois la mission terminée."
            photos={afterPhotos}
            missionStatus={mission.status}
            badgeClass="bg-accent text-white"
            iconBg="bg-accent/15 text-accent-700"
            onPhotoClick={openLightbox}
          />

          {isCompleted && (
            <FeedbackBlock
              missionId={mission.id}
              existing={mission.clientFeedback}
              onSubmitted={reload}
            />
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          {/* Team */}
          {mission.staff?.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-sm font-bold text-primary">
                {t('espace.missionDetail.team.title', { defaultValue: 'Équipe sur place' })}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {mission.staff.map((name, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-secondary-700 text-[11px] font-bold text-white">
                      {initials(name)}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                <FontAwesomeIcon icon={faUsers} className="h-3 w-3 text-accent" />
                {mission.staff.length}{' '}
                {mission.staff.length > 1 ? 'agents assignés' : 'agent assigné'}
              </div>
            </div>
          )}

          {/* Amount */}
          {mission.amount != null && (
            <div className="rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 p-5 text-white shadow-md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/65">
                Montant
              </div>
              <div className="mt-1 text-2xl font-bold leading-tight">
                {formatCurrency(mission.amount)}
              </div>
            </div>
          )}

          {/* Linked devis */}
          {mission.devis && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-sm font-bold text-primary">
                {t('espace.missionDetail.linked.title', { defaultValue: 'Liens' })}
              </h3>
              <Link
                to={`/espace-client/devis/${mission.devis}`}
                className="group mt-3 flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 transition hover:border-secondary/40 hover:bg-secondary-50/30"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-50 text-secondary">
                    <FontAwesomeIcon icon={faFilePen} className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {t('espace.missionDetail.linked.quote', { defaultValue: 'Devis associé' })}
                    </div>
                    <div className="text-sm font-bold text-primary group-hover:text-secondary">
                      DV-{mission.devis.slice(-6).toUpperCase()}
                    </div>
                  </div>
                </div>
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="h-3 w-3 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-secondary"
                />
              </Link>
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

function FeedbackBlock({ missionId, existing, onSubmitted }) {
  const [rating, setRating] = useState(existing?.rating || 0)
  const [hover, setHover] = useState(0)
  const [text, setText] = useState(existing?.text || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(!existing)

  // Read-only mode when feedback already exists and user isn't editing.
  if (existing && !editing) {
    return (
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
            <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4 text-accent" />
            Votre avis sur cette mission
          </h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-bold text-secondary transition hover:text-secondary-700"
          >
            Modifier
          </button>
        </div>
        <div className="mt-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <FontAwesomeIcon
              key={n}
              icon={faStar}
              className={`h-5 w-5 ${n <= existing.rating ? 'text-yellow-400' : 'text-gray-200'}`}
            />
          ))}
          <span className="ml-2 text-xs font-bold text-gray-500">{existing.rating}/5</span>
        </div>
        {existing.text && (
          <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
            « {existing.text} »
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Envoyé le{' '}
            {new Intl.DateTimeFormat('fr-CH', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }).format(new Date(existing.submittedAt))}
          </div>
          {/* Surface the moderation status so the client knows whether
              their review is publicly visible on the /avis page. */}
          {existing.reviewStatus === 'approved' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" />
              Publié sur le site
            </span>
          )}
          {(!existing.reviewStatus || existing.reviewStatus === 'pending') && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              En attente de validation
            </span>
          )}
          {existing.reviewStatus === 'rejected' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
              Non publié
            </span>
          )}
        </div>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (rating < 1) return
    setError(null)
    setSubmitting(true)
    try {
      await meApi.submitMissionFeedback(missionId, { rating, text: text.trim() })
      setEditing(false)
      onSubmitted?.()
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-base font-bold text-primary md:text-lg">Donnez votre avis</h2>
      <p className="mt-1 text-xs font-medium text-gray-500">
        Évaluez la prestation et laissez-nous un mot — ça aide notre équipe à progresser.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Note globale
          </div>
          <div
            className="mt-2 flex items-center gap-1"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = (hover || rating) >= n
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                  className="rounded p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  <FontAwesomeIcon
                    icon={faStar}
                    className={`h-7 w-7 transition ${filled ? 'text-yellow-400' : 'text-gray-200'}`}
                  />
                </button>
              )
            })}
            {rating > 0 && (
              <span className="ml-2 text-xs font-bold text-gray-500">{rating}/5</span>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="feedback-text" className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Commentaire (optionnel)
          </label>
          <textarea
            id="feedback-text"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Qu'avez-vous pensé de la prestation ?"
            className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {submitting ? (
              <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
            )}
            {existing ? 'Mettre à jour' : 'Envoyer mon avis'}
          </button>
          {existing && (
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setRating(existing.rating)
                setText(existing.text || '')
              }}
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-5 py-2 text-sm font-bold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function formatPhotoTime(iso) {
  if (!iso) return null
  return new Intl.DateTimeFormat('fr-CH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function PhotoBlock({
  phase,
  label,
  subtitle,
  photos,
  missionStatus,
  badgeClass,
  iconBg,
  onPhotoClick,
}) {
  const hasPhotos = photos.length > 0

  // Empty state copy per phase based on mission status.
  let emptyTitle = ''
  let emptyText = ''
  let emptyIcon = faCamera
  if (!hasPhotos) {
    if (phase === 'before') {
      if (missionStatus === 'scheduled') {
        emptyTitle = 'Bientôt disponible'
        emptyText = "Les photos seront ajoutées à l'arrivée de l'équipe sur place."
        emptyIcon = faLock
      } else {
        emptyTitle = 'Aucune photo'
        emptyText = "Aucune photo n'a été prise avant l'intervention."
      }
    } else if (phase === 'during') {
      if (missionStatus === 'inProgress') {
        emptyTitle = 'En cours'
        emptyText = "L'équipe ajoutera des photos pendant l'intervention."
      } else if (missionStatus === 'scheduled') {
        emptyTitle = 'Bientôt disponible'
        emptyText = "Les photos d'avancement apparaîtront pendant la mission."
        emptyIcon = faLock
      } else {
        emptyTitle = 'Aucune photo'
        emptyText = "Aucune photo prise pendant l'intervention."
      }
    } else if (phase === 'after') {
      if (missionStatus === 'completed') {
        emptyTitle = 'Aucune photo finale'
        emptyText = "L'équipe n'a pas encore partagé les photos finales."
      } else {
        emptyTitle = 'À la fin de la mission'
        emptyText = "Les photos finales seront publiées une fois la mission terminée."
        emptyIcon = faLock
      }
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-primary md:text-lg">{label}</h2>
            <p className="mt-0.5 text-[11px] font-medium text-gray-500">{subtitle}</p>
          </div>
        </div>
        {hasPhotos && (
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
          >
            <FontAwesomeIcon icon={faImage} className="h-2.5 w-2.5" />
            {photos.length}
          </span>
        )}
      </div>

      <div className="p-5">
        {hasPhotos ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {photos.map((photo, idx) => (
              <li key={photo.id}>
                <figure className="overflow-hidden rounded-xl ring-1 ring-gray-100">
                  <button
                    type="button"
                    onClick={() => onPhotoClick?.(photos, idx)}
                    className="group relative block aspect-[4/3] w-full overflow-hidden bg-gray-100"
                    aria-label="Agrandir la photo"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || phase}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                      <span className="rounded-full bg-white/0 px-3 py-1.5 text-[11px] font-bold text-white opacity-0 transition group-hover:bg-white/20 group-hover:opacity-100 group-hover:backdrop-blur-sm">
                        Agrandir
                      </span>
                    </span>
                  </button>
                  {(photo.caption || photo.uploadedAt) && (
                    <figcaption className="flex items-center justify-between gap-2 border-t border-gray-100 bg-white px-3 py-2">
                      <span className="truncate text-[12px] font-semibold text-primary">
                        {photo.caption || photo.uploadedBy || '—'}
                      </span>
                      {photo.uploadedAt && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-gray-400">
                          <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                          {formatPhotoTime(photo.uploadedAt)}
                        </span>
                      )}
                    </figcaption>
                  )}
                </figure>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 ring-1 ring-gray-200">
              <FontAwesomeIcon icon={emptyIcon} className="h-4 w-4" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-primary">{emptyTitle}</h3>
            <p className="mt-1 max-w-xs text-xs font-medium text-gray-500">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  )
}
