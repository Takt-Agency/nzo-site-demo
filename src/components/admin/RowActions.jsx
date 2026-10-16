import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical, faBoxArchive, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { adminApi } from '../../lib/api.js'

// Reusable kebab menu rendered on each row of admin lists. Always exposes
// Archive (soft-delete) and Unarchive actions. Hard-delete is disabled by
// design — admins archive instead, and can restore at any time.
//
// Extra entries can be passed via `extra` (array of {label, icon, onClick}).
export default function RowActions({
  resource,
  id,
  isArchived = false,
  itemLabel = 'cet élément',
  onChange,
  extra = [],
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleArchive = async () => {
    if (busy) return
    if (!confirm(`Archiver ${itemLabel} ? L'admin pourra le restaurer à tout moment.`)) return
    setBusy(true)
    try {
      await adminApi.archiveResource(resource, id)
      setOpen(false)
      onChange?.()
    } catch (err) {
      alert(err.message || 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const handleUnarchive = async () => {
    if (busy) return
    setBusy(true)
    try {
      await adminApi.unarchiveResource(resource, id)
      setOpen(false)
      onChange?.()
    } catch (err) {
      alert(err.message || 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-primary"
        aria-label="Actions"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-100">
          {extra.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                item.onClick()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-secondary-50 hover:text-secondary"
            >
              {item.icon && <FontAwesomeIcon icon={item.icon} className="h-3 w-3" />}
              {item.label}
            </button>
          ))}
          {extra.length > 0 && <div className="border-t border-gray-100" />}
          {isArchived ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleUnarchive()
              }}
              disabled={busy}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="h-3 w-3" />
              Désarchiver
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleArchive()
              }}
              disabled={busy}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 transition hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faBoxArchive} className="h-3 w-3" />
              Archiver
            </button>
          )}
        </div>
      )}
    </div>
  )
}
