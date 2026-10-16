import { useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFilePdf,
  faPrint,
  faArrowLeft,
  faPhone,
  faEnvelope,
  faGlobe,
  faLocationDot,
  faCircleCheck,
  faCalendarDay,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext.jsx'
import { adminApi, meApi, ApiError } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { logos } from '../assets/images/index.js'

// Standalone print-optimised A4 invoice. Modern design with branded header,
// itemised body, totals card and footer. Auto-triggers the browser print
// dialog so the user can save as PDF (vector quality, no dependency).

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-CH', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  )
}

function formatShortDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium' }).format(new Date(iso))
}

function formatAmount(n, currency = 'CHF') {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(n || 0)
}

const STATUS_TONE = {
  paid: { label: 'Payée', bg: '#10b981', text: '#fff' },
  pending: { label: 'À payer', bg: '#f59e0b', text: '#fff' },
  overdue: { label: 'En retard', bg: '#ef4444', text: '#fff' },
  cancelled: { label: 'Annulée', bg: '#9ca3af', text: '#fff' },
  archived: { label: 'Archivée', bg: '#6b7280', text: '#fff' },
}

export default function FacturePrint() {
  const { id } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const printedRef = useRef(false)

  const fetcher = useCallback(
    () => (isAdmin ? adminApi.getFacture(id) : meApi.getFacture(id)),
    [id, isAdmin],
  )
  const { data, loading, error } = useApi(fetcher, [id, isAdmin])
  const f = data?.facture

  useEffect(() => {
    if (loading || error || !f || printedRef.current) return
    printedRef.current = true
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [loading, error, f])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-secondary/30 border-t-secondary" />
      </div>
    )
  }

  if (error || !f) {
    const is404 = error instanceof ApiError && error.status === 404
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6 text-center">
        <div>
          <h1 className="text-lg font-bold text-primary">
            {is404 ? 'Facture introuvable' : 'Erreur de chargement'}
          </h1>
          {error && !is404 && (
            <p className="mt-2 text-xs font-medium text-gray-500">{error.message}</p>
          )}
        </div>
      </div>
    )
  }

  const c = f.companySnapshot || {}
  const subtotal = f.amount || 0
  const tva = subtotal * ((f.vatRate || 0) / 100)
  const ttc = subtotal + tva
  const status = STATUS_TONE[f.status] || STATUS_TONE.pending

  const billTo = isAdmin
    ? {
        name: f.clientName || '—',
        email: f.user?.email,
        phone: f.user?.phone,
        company: f.user?.company,
      }
    : {
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        email: user?.email,
        phone: user?.phone,
        company: user?.company,
      }

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: none !important;
          }
        }
        .invoice-num-stripe {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%);
        }
      `}</style>

      {/* Toolbar — hidden when printing */}
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          Retour
        </button>
        <div className="hidden text-[11px] font-medium text-gray-500 md:block">
          Astuce : choisissez « Enregistrer au format PDF » dans le dialogue d'impression.
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-white shadow-sm shadow-secondary/30 transition hover:bg-secondary-600"
        >
          <FontAwesomeIcon icon={faPrint} className="h-3 w-3" />
          Imprimer / PDF
        </button>
      </div>

      {/* The sheet — A4 dimensions */}
      <div
        className="print-sheet mx-auto bg-white text-[11px] leading-relaxed text-gray-900 shadow-2xl"
        style={{ width: '210mm', minHeight: '297mm' }}
      >
        {/* HEADER — branded gradient strip */}
        <header className="invoice-num-stripe relative overflow-hidden px-12 py-10 text-white">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-8">
            {/* Logo + company name */}
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
                <img
                  src={logos.main}
                  alt="Nzo Immo Clean"
                  className="h-full w-full object-contain"
                  crossOrigin="anonymous"
                />
              </div>
              <div>
                <div className="text-xl font-bold leading-tight">
                  {c.name || 'Nzo Immo Clean'}
                  {c.legalForm ? (
                    <span className="ml-1 text-sm font-medium text-white/85">{c.legalForm}</span>
                  ) : null}
                </div>
                {c.ide && (
                  <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/70">
                    N° IDE : {c.ide}
                  </div>
                )}
                <div className="mt-3 space-y-0.5 text-[10px] font-medium text-white/85">
                  {c.address && (
                    <div className="flex items-start gap-1.5">
                      <FontAwesomeIcon icon={faLocationDot} className="mt-0.5 h-2.5 w-2.5" />
                      <span>
                        {c.address}, {c.postalCode} {c.city}
                        {c.country ? `, ${c.country}` : ''}
                      </span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faPhone} className="h-2.5 w-2.5" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faEnvelope} className="h-2.5 w-2.5" />
                      <span>{c.email}</span>
                    </div>
                  )}
                  {c.website && (
                    <div className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faGlobe} className="h-2.5 w-2.5" />
                      <span>{c.website}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice meta */}
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                FACTURE
              </div>
              <div className="mt-1 text-2xl font-bold leading-tight">{f.number}</div>
              <div className="mt-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: status.bg, color: status.text }}
                >
                  {f.status === 'paid' && (
                    <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" />
                  )}
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="px-12 py-8">
          {/* Bill to + dates */}
          <section className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                Facturé à
              </div>
              <div className="mt-2 text-base font-bold text-primary">{billTo.name}</div>
              {billTo.company && (
                <div className="text-[11px] font-medium text-gray-700">{billTo.company}</div>
              )}
              <div className="mt-1 space-y-0.5 text-[10px] font-medium text-gray-500">
                {billTo.email && <div>{billTo.email}</div>}
                {billTo.phone && <div>{billTo.phone}</div>}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  <div className="font-bold uppercase tracking-wider text-gray-500">
                    <FontAwesomeIcon icon={faCalendarDay} className="mr-1 h-2.5 w-2.5" />
                    Émise le
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-primary">
                    {formatShortDate(f.issueDate)}
                  </div>
                </div>
                {f.dueDate && (
                  <div>
                    <div className="font-bold uppercase tracking-wider text-gray-500">
                      <FontAwesomeIcon icon={faCalendarDay} className="mr-1 h-2.5 w-2.5" />
                      Échéance
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-primary">
                      {formatShortDate(f.dueDate)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="font-bold uppercase tracking-wider text-gray-500">N° facture</div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-primary">{f.number}</div>
                </div>
                <div>
                  <div className="font-bold uppercase tracking-wider text-gray-500">Devise</div>
                  <div className="mt-0.5 text-sm font-bold text-primary">{f.currency}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Items table */}
          <section className="mt-10">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead>
                <tr
                  className="text-[9px] font-bold uppercase tracking-[0.12em] text-white"
                  style={{ background: '#0f172a' }}
                >
                  <th className="rounded-l-lg px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Qté</th>
                  <th className="px-4 py-3 text-right">Prix unitaire HT</th>
                  <th className="rounded-r-lg px-4 py-3 text-right">Total HT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-4 align-top">
                    <div className="font-bold text-primary">Prestation de service</div>
                    {f.notes && (
                      <div className="mt-1 whitespace-pre-line text-[10px] font-medium leading-relaxed text-gray-600">
                        {f.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top text-right font-medium text-gray-700">1</td>
                  <td className="px-4 py-4 align-top text-right font-medium text-gray-700">
                    {formatAmount(subtotal, f.currency)}
                  </td>
                  <td className="px-4 py-4 align-top text-right font-bold text-primary">
                    {formatAmount(subtotal, f.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Totals card */}
          <section className="mt-6 flex justify-end">
            <div className="w-80 overflow-hidden rounded-xl border border-gray-200">
              <div className="bg-gray-50 px-5 py-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-gray-600">Sous-total HT</span>
                  <span className="font-bold text-primary">
                    {formatAmount(subtotal, f.currency)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-gray-600">TVA ({f.vatRate}%)</span>
                  <span className="font-bold text-primary">{formatAmount(tva, f.currency)}</span>
                </div>
              </div>
              <div
                className="flex items-center justify-between px-5 py-4 text-white"
                style={{ background: '#0f172a' }}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                  Total TTC
                </span>
                <span className="text-xl font-bold leading-none">
                  {formatAmount(ttc, f.currency)}
                </span>
              </div>
            </div>
          </section>

          {/* Banking + payment terms */}
          {(c.iban || c.bank || c.paymentTerms) && (
            <section className="mt-12 grid grid-cols-2 gap-8 border-t border-gray-200 pt-6">
              {(c.iban || c.bank) && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                    Coordonnées bancaires
                  </div>
                  <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50/60 p-3 text-[10px] font-medium text-gray-700">
                    {c.bank && <div className="font-bold text-primary">{c.bank}</div>}
                    {c.iban && (
                      <div className="mt-1 font-mono">
                        <span className="text-gray-500">IBAN : </span>
                        {c.iban}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {c.paymentTerms && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                    Conditions de paiement
                  </div>
                  <p className="mt-2 whitespace-pre-line text-[10px] font-medium leading-relaxed text-gray-700">
                    {c.paymentTerms}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Thank-you note */}
          <section className="mt-12 rounded-xl border-2 border-dashed border-primary/15 bg-gradient-to-br from-primary/5 to-secondary/5 p-5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary-700">
              MERCI
            </div>
            <p className="mt-1 text-sm font-medium text-primary">
              Merci pour votre confiance — n'hésitez pas à nous contacter pour toute question
              concernant cette facture.
            </p>
          </section>
        </div>

        {/* FOOTER */}
        <footer
          className="mt-auto px-12 py-4 text-center text-[9px] font-medium text-white"
          style={{ background: '#0f172a' }}
        >
          {c.name || 'Nzo Immo Clean'}
          {c.ide && ` · IDE ${c.ide}`}
          {c.address && ` · ${c.address}, ${c.postalCode} ${c.city}`}
          {c.email && ` · ${c.email}`}
          {c.phone && ` · ${c.phone}`}
        </footer>
      </div>

      <div
        className="no-print mx-auto mt-4 max-w-[210mm] rounded-xl bg-white p-3 text-center text-[11px] font-medium text-gray-500 shadow-sm ring-1 ring-gray-100"
      >
        Facture {f.number} · émise le {formatDate(f.issueDate)}
      </div>
    </div>
  )
}
