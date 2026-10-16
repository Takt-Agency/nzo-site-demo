import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faSpinner, faPaperPlane } from '@fortawesome/free-solid-svg-icons'

// Modal used by the admin to send a quote (set amount + message) or accept/reject.
export default function DevisActionModal({ devis, mode, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState(devis?.amount ?? '')
  const [validUntil, setValidUntil] = useState(
    devis?.validUntil ? new Date(devis.validUntil).toISOString().slice(0, 10) : '',
  )
  const [staffMessage, setStaffMessage] = useState(devis?.staffMessage || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      let payload
      if (mode === 'send') {
        if (!amount || Number(amount) <= 0) {
          throw new Error(t('admin.devis.modal.amountRequired', { defaultValue: 'Montant requis' }))
        }
        payload = {
          status: 'quoted',
          amount: Number(amount),
          validUntil: validUntil || undefined,
          staffMessage: staffMessage || undefined,
        }
      } else if (mode === 'accept') {
        payload = { status: 'accepted' }
      } else if (mode === 'reject') {
        payload = { status: 'rejected', staffMessage: staffMessage || undefined }
      }
      await onSubmit(payload)
      onClose()
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const titles = {
    send: t('admin.devis.modal.sendTitle', { defaultValue: 'Envoyer le devis' }),
    accept: t('admin.devis.modal.acceptTitle', { defaultValue: 'Marquer comme accepté' }),
    reject: t('admin.devis.modal.rejectTitle', { defaultValue: 'Rejeter le devis' }),
  }
  const ctas = {
    send: t('admin.devis.modal.sendCta', { defaultValue: 'Envoyer le devis' }),
    accept: t('admin.devis.modal.acceptCta', { defaultValue: 'Confirmer l\'acceptation' }),
    reject: t('admin.devis.modal.rejectCta', { defaultValue: 'Confirmer le rejet' }),
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-bold text-primary">{titles[mode]}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="rounded-xl bg-gray-50 p-3 text-xs">
            <div className="font-bold text-primary">{devis.clientName}</div>
            <div className="mt-0.5 text-gray-500">
              {t(`services.${devis.service}.title`, { defaultValue: devis.service })} · {devis.surface} m²
            </div>
          </div>

          {mode === 'send' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t('admin.devis.modal.amount', { defaultValue: 'Montant (CHF, HT)' })} *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1240"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t('admin.devis.modal.validUntil', { defaultValue: 'Valable jusqu\'au' })}
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t('admin.devis.modal.message', { defaultValue: 'Message au client' })}
                </label>
                <textarea
                  rows={3}
                  value={staffMessage}
                  onChange={(e) => setStaffMessage(e.target.value)}
                  placeholder={t('admin.devis.modal.messagePlaceholder', {
                    defaultValue: 'Précisez les détails de la prestation, conditions…',
                  })}
                  className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
            </>
          )}

          {mode === 'reject' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('admin.devis.modal.rejectReason', { defaultValue: 'Motif (optionnel)' })}
              </label>
              <textarea
                rows={3}
                value={staffMessage}
                onChange={(e) => setStaffMessage(e.target.value)}
                placeholder={t('admin.devis.modal.rejectReasonPlaceholder', {
                  defaultValue: 'Expliquer brièvement la raison du refus…',
                })}
                className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          )}

          {mode === 'accept' && (
            <p className="text-sm font-medium text-gray-600">
              {t('admin.devis.modal.acceptHint', {
                defaultValue:
                  'Marquer ce devis comme accepté côté admin. Le client recevra une notification.',
              })}
            </p>
          )}

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
              {t('admin.devis.modal.cancel', { defaultValue: 'Annuler' })}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-5 py-2 text-xs disabled:opacity-50"
            >
              {submitting ? (
                <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
              )}
              {ctas[mode]}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
