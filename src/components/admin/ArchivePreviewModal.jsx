import { useCallback, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faSpinner,
  faCircleExclamation,
  faUser,
  faUserGear,
  faEnvelope,
  faPhone,
  faBuilding,
  faClock,
  faCalendarDay,
  faLocationDot,
  faRulerCombined,
  faTag,
  faMoneyBillTrendUp,
  faSprayCanSparkles,
  faRotateLeft,
  faFileLines,
  faStar,
  faQuoteLeft,
} from '@fortawesome/free-solid-svg-icons'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function formatDate(iso, withTime = true) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(
    'fr-CH',
    withTime
      ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' },
  ).format(new Date(iso))
}

function formatCurrency(n, currency = 'CHF') {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(n)
}

const TYPE_TITLES = {
  clients: 'Client archivé',
  devis: 'Devis archivé',
  missions: 'Mission archivée',
  demandes: 'Demande archivée',
  reclamations: 'Réclamation archivée',
  agents: 'Agent archivé',
  factures: 'Facture archivée',
  reviews: 'Avis archivé',
}

// Generic preview modal for any archived resource. Read-only on purpose —
// editing should go through the regular pages after restore.
export default function ArchivePreviewModal({ type, id, onClose, onRestore, restoring }) {
  // Pick the right fetcher per type.
  const fetcher = useCallback(() => {
    switch (type) {
      case 'clients':
        return adminApi.getClient(id)
      case 'devis':
        return adminApi.getDevis(id)
      case 'missions':
        return adminApi.getMission(id)
      case 'demandes':
        return adminApi.getDemande(id)
      case 'reclamations':
        return adminApi.getReclamation(id)
      case 'agents':
        return adminApi.getAgent(id)
      case 'factures':
        return adminApi.getFacture(id)
      case 'reviews':
        // Reviews are stored on the parent mission — fetch the mission and
        // surface the embedded feedback in the renderer below.
        return adminApi.getMission(id)
      default:
        return Promise.reject(new Error('Type inconnu'))
    }
  }, [type, id])

  const { data, loading, error } = useApi(fetcher, [type, id])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
              ARCHIVE
            </div>
            <h3 className="mt-1 text-base font-bold text-primary md:text-lg">
              {TYPE_TITLES[type] || 'Élément archivé'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
            aria-label="Fermer"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <FontAwesomeIcon
                icon={faSpinner}
                className="h-6 w-6 animate-spin text-secondary"
              />
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
              {error.message}
            </div>
          )}

          {data && !loading && !error && <Body type={type} data={data} />}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 px-5 py-2 text-xs font-bold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Fermer
          </button>
          {onRestore && (
            <button
              type="button"
              onClick={onRestore}
              disabled={restoring}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {restoring ? (
                <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faRotateLeft} className="h-3 w-3" />
              )}
              Restaurer cet élément
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Type-specific renderers ----------------------------------------------

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-gray-700">{children || '—'}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h4>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function Body({ type, data }) {
  switch (type) {
    case 'clients':
      return <ClientView client={data.client} aggregates={data.aggregates} />
    case 'devis':
      return <DevisView devis={data.devis} />
    case 'missions':
      return <MissionView mission={data.mission} />
    case 'demandes':
      return <DemandeView demande={data.demande} />
    case 'reclamations':
      return <ReclamationView reclamation={data.reclamation} />
    case 'agents':
      return <AgentView agent={data.agent} />
    case 'factures':
      return <FactureView facture={data.facture} />
    case 'reviews':
      return <ReviewView mission={data.mission} />
    default:
      return null
  }
}

function ReviewView({ mission }) {
  if (!mission || !mission.clientFeedback) return null
  const fb = mission.clientFeedback
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 p-4 ring-1 ring-yellow-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-white shadow-md">
              <FontAwesomeIcon icon={faStar} className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                AVIS CLIENT
              </div>
              <div className="text-base font-bold text-primary">{mission.clientName}</div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <FontAwesomeIcon
                key={i}
                icon={faStar}
                className={`h-4 w-4 ${i < (fb.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}
              />
            ))}
            <span className="ml-1 text-sm font-bold text-primary">{fb.rating}/5</span>
          </div>
        </div>
      </div>

      {fb.text && (
        <Section title="Commentaire">
          <div className="relative">
            <FontAwesomeIcon
              icon={faQuoteLeft}
              className="absolute -left-1 -top-1 h-6 w-6 text-yellow-100"
            />
            <p className="relative pl-7 text-sm font-medium leading-relaxed text-gray-700">
              {fb.text}
            </p>
          </div>
        </Section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Service">{mission.service}</Field>
        <Field label="Mission">{mission.title}</Field>
        <Field label="Soumis le">{formatDate(fb.submittedAt)}</Field>
      </div>
    </div>
  )
}

function ClientView({ client, aggregates }) {
  if (!client) return null
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 p-4 ring-1 ring-secondary/10">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-secondary-700 text-white shadow-md">
          <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-base font-bold text-primary">{client.name}</div>
          {client.company && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <FontAwesomeIcon icon={faBuilding} className="h-2.5 w-2.5" />
              {client.company}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <a
            href={`mailto:${client.email}`}
            className="inline-flex items-center gap-1.5 text-secondary hover:underline"
          >
            <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3" />
            {client.email}
          </a>
        </Field>
        <Field label="Téléphone">
          {client.phone ? (
            <a
              href={`tel:${client.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-1.5 text-secondary hover:underline"
            >
              <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
              {client.phone}
            </a>
          ) : (
            '—'
          )}
        </Field>
        <Field label="Type de compte">{client.type}</Field>
        <Field label="Client depuis">{formatDate(client.sinceDate, false)}</Field>
      </div>

      <Section title="Activité">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Devis
            </div>
            <div className="mt-1 text-lg font-bold text-primary">
              {aggregates?.devis?.length || 0}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Missions
            </div>
            <div className="mt-1 text-lg font-bold text-primary">
              {aggregates?.missions?.length || 0}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Factures
            </div>
            <div className="mt-1 text-lg font-bold text-primary">
              {aggregates?.factures?.length || 0}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Réglé
            </div>
            <div className="mt-1 text-lg font-bold text-primary">
              {formatCurrency(aggregates?.facturesPaid || 0)}
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

function DevisView({ devis }) {
  if (!devis) return null
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 p-4 ring-1 ring-secondary/10">
        <div className="text-[10px] font-bold uppercase tracking-wider text-secondary-700">
          DV-{devis.id.slice(-6).toUpperCase()} · {devis.service}
        </div>
        <div className="mt-1 text-base font-bold text-primary">{devis.clientName}</div>
        <div className="mt-1 inline-flex items-center gap-3 text-xs font-medium text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faRulerCombined} className="h-3 w-3 text-secondary" />
            {devis.surface} m²
          </span>
          {devis.amount != null && (
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faMoneyBillTrendUp} className="h-3 w-3 text-secondary" />
              {formatCurrency(devis.amount, devis.currency)}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Statut">{devis.status}</Field>
        <Field label="Fréquence">{devis.frequency}</Field>
        <Field label="Début souhaité">{formatDate(devis.startDate, false)}</Field>
        <Field label="Adresse">
          {devis.address ? `${devis.address}, ${devis.postalCode || ''} ${devis.city || ''}` : '—'}
        </Field>
      </div>

      {devis.notes && (
        <Section title="Précisions client">
          <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
            {devis.notes}
          </p>
        </Section>
      )}
    </div>
  )
}

function MissionView({ mission }) {
  if (!mission) return null
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 p-4 ring-1 ring-secondary/10">
        <div className="text-[10px] font-bold uppercase tracking-wider text-secondary-700">
          MS-{mission.id.slice(-6).toUpperCase()} · {mission.status}
        </div>
        <div className="mt-1 text-base font-bold text-primary">{mission.title}</div>
        <div className="text-xs font-medium text-gray-600">{mission.clientName}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date">
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCalendarDay} className="h-3 w-3 text-accent" />
            {formatDate(mission.date)}
          </span>
        </Field>
        <Field label="Durée">{mission.duration ? `${mission.duration} h` : '—'}</Field>
        <Field label="Adresse">
          {mission.address ? (
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 text-accent" />
              {mission.address}
            </span>
          ) : (
            '—'
          )}
        </Field>
        <Field label="Montant">{formatCurrency(mission.amount)}</Field>
      </div>

      {mission.staff?.length > 0 && (
        <Section title="Équipe assignée">
          <div className="flex flex-wrap gap-1.5">
            {mission.staff.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary-50 px-2.5 py-0.5 text-xs font-semibold text-secondary-700"
              >
                <FontAwesomeIcon icon={faSprayCanSparkles} className="h-2.5 w-2.5" />
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {mission.notes && (
        <Section title="Notes">
          <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
            {mission.notes}
          </p>
        </Section>
      )}
    </div>
  )
}

function DemandeView({ demande }) {
  if (!demande) return null
  const isAgent = demande.from === 'agent'
  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl p-4 ring-1 ${
          isAgent
            ? 'bg-gradient-to-br from-accent/15 to-accent/5 ring-accent/20'
            : 'bg-gradient-to-br from-primary-50 to-secondary-50 ring-secondary/10'
        }`}
      >
        <div
          className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${
            isAgent ? 'text-accent-700' : 'text-secondary-700'
          }`}
        >
          <FontAwesomeIcon icon={isAgent ? faUserGear : faUser} className="h-2.5 w-2.5" />
          {isAgent ? 'AGENT TERRAIN' : 'CLIENT'} · {demande.type}
        </div>
        <div className="mt-1 text-base font-bold text-primary">{demande.subject}</div>
        <div className="text-xs font-medium text-gray-600">{demande.clientName}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Statut">{demande.status}</Field>
        <Field label="Priorité">{demande.priority}</Field>
        <Field label="Reçue">{formatDate(demande.receivedAt)}</Field>
      </div>

      <Section title="Message">
        <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
          {demande.message}
        </p>
        {demande.relatedRef && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary-50 px-3 py-1 text-[11px] font-bold text-secondary-700">
            <FontAwesomeIcon icon={faTag} className="h-2.5 w-2.5" />
            Réf. associée : {demande.relatedRef}
          </div>
        )}
      </Section>

      {demande.replies?.length > 0 && (
        <Section title={`Conversation (${demande.replies.length})`}>
          <ul className="space-y-2">
            {demande.replies.map((r) => (
              <li
                key={r.id}
                className={`rounded-xl p-3 text-xs ${
                  r.from === 'admin'
                    ? 'bg-accent/10 text-primary ring-1 ring-accent/20'
                    : 'bg-white text-primary ring-1 ring-gray-200'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {r.from === 'admin' ? 'Admin' : isAgent ? 'Agent' : 'Client'} ·{' '}
                  {formatDate(r.createdAt)}
                </div>
                <p className="mt-1 whitespace-pre-line font-medium leading-relaxed">{r.text}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function ReclamationView({ reclamation }) {
  if (!reclamation) return null
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-red-50 to-amber-50 p-4 ring-1 ring-red-200">
        <div className="text-[10px] font-bold uppercase tracking-wider text-red-700">
          RC-{reclamation.id.slice(-6).toUpperCase()} · {reclamation.category}
        </div>
        <div className="mt-1 text-base font-bold text-primary">{reclamation.subject}</div>
        <div className="text-xs font-medium text-gray-600">{reclamation.clientName}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Statut">{reclamation.status}</Field>
        <Field label="Gravité">{reclamation.severity}</Field>
        <Field label="Date incident">
          {reclamation.incidentDate ? formatDate(reclamation.incidentDate, false) : '—'}
        </Field>
      </div>

      <Section title="Description">
        <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
          {reclamation.description}
        </p>
      </Section>

      {reclamation.replies?.length > 0 && (
        <Section title={`Conversation (${reclamation.replies.length})`}>
          <ul className="space-y-2">
            {reclamation.replies.map((r) => (
              <li
                key={r.id}
                className={`rounded-xl p-3 text-xs ${
                  r.from === 'admin'
                    ? 'bg-accent/10 text-primary ring-1 ring-accent/20'
                    : 'bg-white text-primary ring-1 ring-gray-200'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {r.from === 'admin' ? 'Admin' : 'Client'} · {formatDate(r.createdAt)}
                </div>
                <p className="mt-1 whitespace-pre-line font-medium leading-relaxed">{r.text}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function AgentView({ agent }) {
  if (!agent) return null
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-secondary-50 p-4 ring-1 ring-emerald-200">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-700 text-white shadow-md">
          <FontAwesomeIcon icon={faUserGear} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-base font-bold text-primary">{agent.name}</div>
          <div className="text-xs font-medium text-gray-600">{agent.role}</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          {agent.email ? (
            <a href={`mailto:${agent.email}`} className="text-secondary hover:underline">
              {agent.email}
            </a>
          ) : (
            '—'
          )}
        </Field>
        <Field label="Téléphone">
          {agent.phone ? (
            <a
              href={`tel:${agent.phone.replace(/\s/g, '')}`}
              className="text-secondary hover:underline"
            >
              {agent.phone}
            </a>
          ) : (
            '—'
          )}
        </Field>
        <Field label="Statut">{agent.status}</Field>
        <Field label="Compte de connexion">
          {agent.hasAccount ? 'Actif' : 'Aucun'}
        </Field>
        {agent.rating != null && <Field label="Note">{Number(agent.rating).toFixed(1)} / 5</Field>}
      </div>
    </div>
  )
}

function FactureView({ facture }) {
  if (!facture) return null
  const subtotal = facture.amount || 0
  const tva = subtotal * ((facture.vatRate || 0) / 100)
  const ttc = subtotal + tva
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200">
        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
          <FontAwesomeIcon icon={faFileLines} className="mr-1 h-2.5 w-2.5" />
          {facture.number}
        </div>
        <div className="mt-1 text-2xl font-bold text-primary">
          {formatCurrency(ttc, facture.currency)}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Total TTC
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client">{facture.clientName}</Field>
        <Field label="Statut">{facture.status}</Field>
        <Field label="Émise le">{formatDate(facture.issueDate, false)}</Field>
        <Field label="Échéance">
          {facture.dueDate ? formatDate(facture.dueDate, false) : '—'}
        </Field>
      </div>

      <Section title="Détail">
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-500">Sous-total HT</span>
            <span className="font-bold text-primary">
              {formatCurrency(subtotal, facture.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-500">TVA ({facture.vatRate}%)</span>
            <span className="font-bold text-primary">{formatCurrency(tva, facture.currency)}</span>
          </div>
          <div className="my-2 h-px bg-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-primary">Total TTC</span>
            <span className="text-base font-bold text-accent-700">
              {formatCurrency(ttc, facture.currency)}
            </span>
          </div>
        </div>
      </Section>

      {facture.notes && (
        <Section title="Notes">
          <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-gray-700">
            {facture.notes}
          </p>
        </Section>
      )}
    </div>
  )
}
