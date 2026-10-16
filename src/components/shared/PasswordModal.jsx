import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faSpinner,
  faLock,
  faEye,
  faEyeSlash,
  faCircleCheck,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { meApi } from '../../lib/api.js'

// Shared password-change modal — usable from any logged-in dashboard
// (admin, agent, client). Validates locally + lets the backend confirm
// the current password.
export default function PasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [show, setShow] = useState({ current: false, next: false })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const update = (patch) => setForm((p) => ({ ...p, ...patch }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (form.newPassword !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setSubmitting(true)
    try {
      await meApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setSuccess(true)
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-primary">
            <FontAwesomeIcon icon={faLock} className="h-4 w-4 text-secondary" />
            Changer le mot de passe
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          {success ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-sm font-bold text-emerald-800">Mot de passe mis à jour !</div>
                <div className="text-xs font-medium text-emerald-700">
                  Utilisez le nouveau à la prochaine connexion.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Mot de passe actuel *
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={show.current ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={form.currentPassword}
                    onChange={(e) => update({ currentPassword: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-11 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
                  >
                    <FontAwesomeIcon
                      icon={show.current ? faEyeSlash : faEye}
                      className="h-3.5 w-3.5"
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Nouveau mot de passe *
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={show.next ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={form.newPassword}
                    onChange={(e) => update({ newPassword: e.target.value })}
                    placeholder="8 caractères minimum"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-11 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
                  >
                    <FontAwesomeIcon
                      icon={show.next ? faEyeSlash : faEye}
                      className="h-3.5 w-3.5"
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Confirmer *
                </label>
                <input
                  type={show.next ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.confirm}
                  onChange={(e) => update({ confirm: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
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
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 text-xs disabled:opacity-50"
                >
                  {submitting && (
                    <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
                  )}
                  Mettre à jour
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
