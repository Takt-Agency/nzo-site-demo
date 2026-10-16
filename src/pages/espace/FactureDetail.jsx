import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCircleExclamation,
  faFileInvoiceDollar,
  faDownload,
  faCircleCheck,
  faClock,
  faSprayCanSparkles,
  faBuilding,
  faEnvelope,
  faPhone,
  faLocationDot,
  faMoneyCheckDollar,
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons'
import { meApi, ApiError } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function formatDate(iso, withYear = true) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(
    'fr-CH',
    withYear ? { day: '2-digit', month: 'long', year: 'numeric' } : { dateStyle: 'medium' },
  ).format(new Date(iso))
}

function formatAmount(n, currency = 'CHF') {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(n || 0)
}

const STATUS_TONE = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  overdue: 'bg-red-50 text-red-700 ring-red-200',
  cancelled: 'bg-gray-100 text-gray-600 ring-gray-200',
}
const STATUS_LABEL = {
  pending: 'À payer',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
}

export default function FactureDetail() {
  const { id } = useParams()
  const fetcher = useCallback(() => meApi.getFacture(id), [id])
  const { data, loading, error } = useApi(fetcher, [id])
  const f = data?.facture

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    )
  }

  if (error || !f) {
    const is404 = error instanceof ApiError && error.status === 404
    return (
      <div className="space-y-4">
        <Link
          to="/espace-client/factures"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          Retour à mes factures
        </Link>
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faCircleExclamation} className="h-8 w-8 text-gray-400" />
          <h2 className="mt-4 text-lg font-bold text-primary">
            {is404 ? 'Facture introuvable' : 'Erreur de chargement'}
          </h2>
        </div>
      </div>
    )
  }

  const subtotal = f.amount
  const tva = subtotal * ((f.vatRate || 0) / 100)
  const ttc = subtotal + tva
  const isPaid = f.status === 'paid'

  return (
    <div className="space-y-6">
      <Link
        to="/espace-client/factures"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        Retour à mes factures
      </Link>

      {/* Header card with amount */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 p-6 text-white shadow-md md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
              STATUS_TONE[f.status] || STATUS_TONE.pending
            }`}
          >
            {STATUS_LABEL[f.status] || f.status}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            {f.number}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
              TOTAL TTC
            </div>
            <div className="mt-1 text-3xl font-bold leading-tight md:text-4xl">
              {formatAmount(ttc, f.currency)}
            </div>
            {f.dueDate && !isPaid && (
              <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-white/80">
                <FontAwesomeIcon icon={faClock} className="h-3 w-3 text-accent" />
                Échéance : {formatDate(f.dueDate)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/espace-client/factures/${f.id}/imprimer`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-primary shadow-md transition hover:scale-[1.02]"
            >
              <FontAwesomeIcon icon={faFilePdf} className="h-3.5 w-3.5 text-red-600" />
              Télécharger en PDF
            </a>
            {f.pdfUrl && (
              <a
                href={f.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
                PDF externe
              </a>
            )}
          </div>
        </div>
      </div>

      {isPaid && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
            <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-bold text-emerald-800">Facture payée</div>
            <div className="text-xs font-medium text-emerald-700">
              {f.paidAt ? `Réglée le ${formatDate(f.paidAt)}` : 'Merci pour votre paiement.'}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Company header (snapshot from settings at issuance) */}
          {f.companySnapshot && f.companySnapshot.name && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
                <FontAwesomeIcon icon={faBuilding} className="h-3.5 w-3.5 text-secondary" />
                Émise par
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-bold text-primary">
                    {f.companySnapshot.name}
                    {f.companySnapshot.legalForm ? ` ${f.companySnapshot.legalForm}` : ''}
                  </div>
                  {f.companySnapshot.ide && (
                    <div className="text-[11px] font-medium text-gray-500">
                      N° IDE : {f.companySnapshot.ide}
                    </div>
                  )}
                  {f.companySnapshot.address && (
                    <div className="mt-2 inline-flex items-start gap-1.5 text-xs font-medium text-gray-600">
                      <FontAwesomeIcon
                        icon={faLocationDot}
                        className="mt-0.5 h-2.5 w-2.5 text-secondary"
                      />
                      <span>
                        {f.companySnapshot.address}
                        <br />
                        {f.companySnapshot.postalCode} {f.companySnapshot.city}
                        {f.companySnapshot.country ? `, ${f.companySnapshot.country}` : ''}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-xs font-medium text-gray-600">
                  {f.companySnapshot.phone && (
                    <a
                      href={`tel:${f.companySnapshot.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-1.5 transition hover:text-secondary"
                    >
                      <FontAwesomeIcon icon={faPhone} className="h-2.5 w-2.5 text-secondary" />
                      {f.companySnapshot.phone}
                    </a>
                  )}
                  {f.companySnapshot.email && (
                    <a
                      href={`mailto:${f.companySnapshot.email}`}
                      className="flex items-center gap-1.5 transition hover:text-secondary"
                    >
                      <FontAwesomeIcon icon={faEnvelope} className="h-2.5 w-2.5 text-secondary" />
                      {f.companySnapshot.email}
                    </a>
                  )}
                  {f.companySnapshot.iban && (
                    <div className="flex items-start gap-1.5">
                      <FontAwesomeIcon
                        icon={faMoneyCheckDollar}
                        className="mt-0.5 h-2.5 w-2.5 text-secondary"
                      />
                      <span>
                        <span className="font-bold text-primary">IBAN :</span>{' '}
                        {f.companySnapshot.iban}
                        {f.companySnapshot.bank && (
                          <span className="block text-[11px] text-gray-500">
                            {f.companySnapshot.bank}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Breakdown */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-base font-bold text-primary md:text-lg">
              <FontAwesomeIcon icon={faFileInvoiceDollar} className="h-3.5 w-3.5 text-secondary" />
              Détail
            </h2>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Sous-total HT</span>
                <span className="font-bold text-primary">{formatAmount(subtotal, f.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">TVA ({f.vatRate}%)</span>
                <span className="font-bold text-primary">{formatAmount(tva, f.currency)}</span>
              </div>
              <div className="my-2 h-px bg-gray-100" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">Total TTC</span>
                <span className="text-lg font-bold text-accent-700">
                  {formatAmount(ttc, f.currency)}
                </span>
              </div>
            </div>
          </div>

          {f.mission && (
            <Link
              to={`/espace-client/missions/${f.mission}`}
              className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-secondary/30 bg-secondary-50/40 p-4 transition hover:border-secondary hover:bg-secondary-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-white">
                <FontAwesomeIcon icon={faSprayCanSparkles} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-primary">Mission associée</div>
                <div className="text-xs font-medium text-gray-600">
                  Voir le détail de la mission liée à cette facture →
                </div>
              </div>
            </Link>
          )}

          {f.companySnapshot?.paymentTerms && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs font-medium leading-relaxed text-gray-600">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Conditions de paiement
              </div>
              <p className="mt-1.5 whitespace-pre-line">{f.companySnapshot.paymentTerms}</p>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Informations</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">Numéro</dt>
                <dd className="font-bold text-primary">{f.number}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">Émise le</dt>
                <dd className="font-bold text-primary">{formatDate(f.issueDate)}</dd>
              </div>
              {f.dueDate && (
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-gray-500">Échéance</dt>
                  <dd className="font-bold text-primary">{formatDate(f.dueDate)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="font-medium text-gray-500">Statut</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                      STATUS_TONE[f.status] || STATUS_TONE.pending
                    }`}
                  >
                    {STATUS_LABEL[f.status] || f.status}
                  </span>
                </dd>
              </div>
              {f.paidAt && (
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-gray-500">Payée le</dt>
                  <dd className="font-bold text-emerald-700">{formatDate(f.paidAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-secondary/30 bg-secondary-50/40 p-4 text-xs">
            <div className="font-bold text-secondary-700">Une question ?</div>
            <p className="mt-1 leading-relaxed text-gray-600">
              Pour toute question sur cette facture, contactez-nous via votre espace ou par
              téléphone.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
