import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faSpinner,
  faUserGroup,
  faTrash,
  faKey,
  faCircleCheck,
  faCamera,
} from '@fortawesome/free-solid-svg-icons'
import { adminApi, meApi } from '../../lib/api.js'

function initialsOf(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
}

const ROLES = [
  { value: 'chef', label: "Chef d'équipe" },
  { value: 'senior', label: 'Agent senior' },
  { value: 'agent', label: 'Agent' },
  { value: 'training', label: 'En formation' },
]

const STATUSES = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
]

// Create / edit / delete an agent. `agent` is null when creating.
export default function AgentFormModal({ agent, onClose, onSuccess }) {
  const editing = !!agent
  const [form, setForm] = useState({
    name: agent?.name || '',
    role: agent?.role || 'agent',
    email: agent?.email || '',
    phone: agent?.phone || '',
    status: agent?.status || 'active',
    rating: agent?.rating ?? '',
    // Backend returns 'YYYY-MM-DD' (or null) via toPublic — the same shape
    // the native <input type="date"> value expects, so no formatting needed.
    birthDate: agent?.birthDate || '',
    photoUrl: agent?.photoUrl || '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef(null)
  const hasAccount = !!agent?.hasAccount

  const pickPhoto = () => fileInputRef.current?.click()
  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploadingPhoto(true)
    try {
      // Reuses the shared /me/uploads/photos endpoint — the returned URL is
      // stored on the agent via the normal patch below (no need for a
      // separate agent-photo endpoint on the admin side).
      const res = await meApi.uploadPhotos([file])
      const url = res.items?.[0]?.url
      if (!url) throw new Error('Upload sans URL retournée.')
      update({ photoUrl: url })
    } catch (err) {
      setError(err.message || 'Upload photo impossible')
    } finally {
      setUploadingPhoto(false)
      // Reset the input so re-selecting the same file re-fires onChange.
      e.target.value = ''
    }
  }

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        status: form.status,
        rating: form.rating === '' ? null : Number(form.rating),
        // Empty string clears the field on update (backend controller
        // interprets that as null). On create, empty means "not provided".
        birthDate: form.birthDate || null,
        photoUrl: form.photoUrl || null,
      }
      // Include the password only when the admin actually typed one. On create,
      // an email + password pair tells the backend to also create a login
      // account for this agent.
      if (form.password.trim()) {
        if (form.password.trim().length < 8) {
          throw new Error('Le mot de passe doit contenir au moins 8 caractères.')
        }
        payload.password = form.password.trim()
      }
      const res = editing
        ? await adminApi.updateAgent(agent.id, payload)
        : await adminApi.createAgent(payload)
      onSuccess(res.agent)
      onClose()
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer ${agent.name} ?`)) return
    setError(null)
    setDeleting(true)
    try {
      await adminApi.deleteAgent(agent.id)
      onSuccess(null)
      onClose()
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-primary">
            <FontAwesomeIcon icon={faUserGroup} className="h-4 w-4 text-secondary" />
            {editing ? 'Modifier le membre' : 'Ajouter un membre'}
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
          {/* Profile photo — 96px avatar with a hidden file input under
              the "Modifier" button. Preview shows either the uploaded URL,
              a Blob during upload, or a fallback with initials + camera icon. */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
              {form.photoUrl ? (
                <img
                  src={form.photoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <span className="text-xl font-bold text-primary/60">
                    {initialsOf(form.name).toUpperCase()}
                  </span>
                  <FontAwesomeIcon icon={faCamera} className="h-3 w-3" />
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Photo de profil
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={pickPhoto}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-secondary bg-white px-3.5 py-1.5 text-[11px] font-bold text-secondary transition hover:bg-secondary hover:text-white disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faCamera} className="h-3 w-3" />
                  {form.photoUrl ? 'Changer' : 'Importer'}
                </button>
                {form.photoUrl && (
                  <button
                    type="button"
                    onClick={() => update({ photoUrl: '' })}
                    className="inline-flex items-center gap-1 rounded-full border-2 border-gray-200 px-3.5 py-1.5 text-[11px] font-bold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-2.5 w-2.5" />
                    Retirer
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Nom complet *
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Karim Bensaada"
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Rôle *
              </label>
              <select
                value={form.role}
                onChange={(e) => update({ role: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Statut
              </label>
              <select
                value={form.status}
                onChange={(e) => update({ status: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="karim.b@nzoimmoclean.ch"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Téléphone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update({ phone: e.target.value })}
                placeholder="+41 79 555 12 11"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Note (0 – 5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={(e) => update({ rating: e.target.value })}
                placeholder="4.8"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Date de naissance
              </label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => update({ birthDate: e.target.value })}
                // Cap at today so the admin can't accidentally enter a future
                // date. No lower bound — we don't validate ancient dates
                // (some ID/passport dates are just placeholders).
                max={new Date().toISOString().slice(0, 10)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faKey} className="h-3.5 w-3.5 text-accent-700" />
              <div className="text-xs font-bold uppercase tracking-wider text-accent-700">
                Accès à l'espace agent
              </div>
            </div>
            {hasAccount && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" />
                Compte actif
              </div>
            )}
            <p className="mt-2 text-[11px] font-medium leading-relaxed text-gray-600">
              {editing
                ? hasAccount
                  ? 'Définissez un nouveau mot de passe pour réinitialiser l\'accès. Laissez vide pour ne pas changer.'
                  : "Renseignez un email + mot de passe ici pour créer un compte de connexion à l'espace agent."
                : "Renseignez un email + mot de passe pour créer un compte de connexion. L'agent pourra ensuite voir ses missions et téléverser des photos depuis son espace."}
            </p>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={(e) => update({ password: e.target.value })}
              placeholder={editing && hasAccount ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe (8 caractères min.)'}
              className="mt-2.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {editing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ? (
                    <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                  )}
                  Supprimer
                </button>
              )}
            </div>
            <div className="flex gap-2">
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
                {submitting && <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />}
                {editing ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
