import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBell,
  faFilePen,
  faSprayCanSparkles,
  faCircleCheck,
  faFileInvoiceDollar,
  faCalendarCheck,
  faTriangleExclamation,
  faStar,
  faCheckDouble,
  faInbox,
  faClipboardList,
  faXmark,
  faShieldHalved,
  faStopwatch,
  faBellSlash,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext.jsx'
import { meApi } from '../../lib/api.js'
import { getNotificationsSocket } from '../../lib/realtime.js'

const typeStyles = {
  welcome: { icon: faStar, color: 'bg-accent/10 text-accent-700' },
  quote_received: { icon: faFilePen, color: 'bg-secondary/10 text-secondary' },
  new_quote: { icon: faFilePen, color: 'bg-secondary/10 text-secondary' },
  quote_accepted: { icon: faCircleCheck, color: 'bg-accent/10 text-accent-700' },
  quote_rejected: { icon: faXmark, color: 'bg-gray-100 text-gray-500' },
  mission_scheduled: { icon: faCalendarCheck, color: 'bg-secondary/10 text-secondary' },
  mission_completed: { icon: faCircleCheck, color: 'bg-accent/10 text-accent-700' },
  mission_reminder: { icon: faStopwatch, color: 'bg-secondary/10 text-secondary' },
  mission_overdue: { icon: faBellSlash, color: 'bg-amber-100 text-amber-700' },
  mission_overdue_admin: { icon: faBellSlash, color: 'bg-red-100 text-red-700' },
  sos_alert: { icon: faShieldHalved, color: 'bg-red-100 text-red-700' },
  invoice_issued: { icon: faFileInvoiceDollar, color: 'bg-tertiary-50 text-tertiary-700' },
  demande_received: { icon: faClipboardList, color: 'bg-secondary/10 text-secondary' },
  demande_replied: { icon: faClipboardList, color: 'bg-accent/10 text-accent-700' },
  complaint_received: { icon: faTriangleExclamation, color: 'bg-amber-100 text-amber-700' },
  complaint_replied: { icon: faTriangleExclamation, color: 'bg-accent/10 text-accent-700' },
  system: { icon: faBell, color: 'bg-gray-100 text-gray-500' },
  default: { icon: faSprayCanSparkles, color: 'bg-gray-100 text-gray-500' },
}

const POLL_INTERVAL_MS = 60_000

function relativeTime(dateStr, locale) {
  if (!dateStr) return ''
  const now = new Date()
  const then = new Date(dateStr)
  const diffSec = Math.round((then - now) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const absSec = Math.abs(diffSec)
  if (absSec < 60) return rtf.format(Math.round(diffSec), 'second')
  if (absSec < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (absSec < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  if (absSec < 604800) return rtf.format(Math.round(diffSec / 86400), 'day')
  if (absSec < 2592000) return rtf.format(Math.round(diffSec / 604800), 'week')
  return rtf.format(Math.round(diffSec / 2592000), 'month')
}

export default function NotificationBell() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  // Lightweight badge refresh (only fetches the count). Used by polling.
  const refreshCount = useCallback(async () => {
    if (!user) return
    try {
      const { count } = await meApi.unreadNotificationsCount()
      setUnread(count)
    } catch {
      /* silent — likely network blip */
    }
  }, [user])

  // Full list fetch (used when opening the panel).
  const refreshList = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { items } = await meApi.listNotifications(50)
      setItems(items)
      setUnread(items.filter((n) => !n.read).length)
    } catch {
      /* silent — caller will see stale data */
    } finally {
      setLoading(false)
    }
  }, [user])

  // Initial fetch + polling + realtime socket. Realtime is the fast path;
  // polling stays as a safety net for reconnect gaps or dropped events.
  useEffect(() => {
    if (!user) {
      setItems([])
      setUnread(0)
      return
    }
    refreshCount()
    const id = setInterval(refreshCount, POLL_INTERVAL_MS)

    // Wire up the /notifications namespace — the server pushes each new
    // Notification created for this user via `notification:new`. Prepend
    // it to the panel list (kept trimmed) + bump the badge without a fetch.
    let socket
    try {
      socket = getNotificationsSocket()
      const onNew = (notif) => {
        setUnread((c) => c + 1)
        setItems((prev) => {
          // Guard against duplicates when polling and socket land in
          // parallel — de-dupe on id.
          if (prev.some((n) => n.id === notif.id)) return prev
          return [notif, ...prev].slice(0, 50)
        })
      }
      socket.on('notification:new', onNew)
      // On (re)connect, resync so any events missed while offline show up.
      socket.on('connect', refreshCount)
    } catch {
      /* socket unreachable — polling keeps things working */
    }

    return () => {
      clearInterval(id)
      if (socket) {
        socket.off('notification:new')
        socket.off('connect')
      }
    }
  }, [user, refreshCount])

  // When the panel opens, fetch the full list to make sure we show fresh items.
  useEffect(() => {
    if (open) refreshList()
  }, [open, refreshList])

  // Close on outside-click + Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const hasUnread = unread > 0

  const markOne = async (id) => {
    // Optimistic update — flip read in place, fix on error.
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnread((c) => Math.max(0, c - 1))
    try {
      await meApi.markNotificationRead(id)
    } catch {
      refreshList()
    }
  }

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
    try {
      await meApi.markAllNotificationsRead()
    } catch {
      refreshList()
    }
  }

  // Hide the bell entirely when not connected (rare since the espace is protected)
  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('espace.notifications.aria')}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition ${
          open
            ? 'bg-secondary text-white shadow-md shadow-secondary/30'
            : 'bg-white text-gray-600 ring-1 ring-gray-100 shadow-sm hover:text-primary'
        }`}
      >
        <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
        {hasUnread && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold leading-none text-white shadow-sm shadow-accent/30 ring-2 ring-gray-50">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          />
          <div
            role="menu"
            className="fixed inset-x-3 top-20 z-50 flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100 lg:absolute lg:inset-x-auto lg:right-0 lg:top-full lg:mt-2 lg:max-h-none lg:w-[22rem] lg:origin-top-right"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <div className="text-sm font-bold text-primary">
                  {t('espace.notifications.title')}
                </div>
                <div className="text-[11px] font-semibold text-gray-500">
                  {hasUnread
                    ? t('espace.notifications.unreadCount', { count: unread })
                    : t('espace.notifications.allRead')}
                </div>
              </div>
              {hasUnread && (
                <button
                  type="button"
                  onClick={markAll}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-secondary-700 transition hover:bg-secondary hover:text-white"
                >
                  <FontAwesomeIcon icon={faCheckDouble} className="h-3 w-3" />
                  {t('espace.notifications.markAll')}
                </button>
              )}
            </div>

            {loading && items.length === 0 ? (
              <div className="flex-1 space-y-3 p-4 lg:max-h-[26rem]">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <FontAwesomeIcon icon={faInbox} className="h-4 w-4" />
                </span>
                <h3 className="mt-4 text-sm font-bold text-primary">
                  {t('espace.notifications.empty.title')}
                </h3>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  {t('espace.notifications.empty.text')}
                </p>
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto lg:max-h-[26rem] lg:flex-none">
                {items.map((n) => {
                  const style = typeStyles[n.type] || typeStyles.default
                  const Wrapper = n.link ? Link : 'div'
                  const wrapperProps = n.link
                    ? {
                        to: n.link,
                        onClick: () => {
                          if (!n.read) markOne(n.id)
                          setOpen(false)
                        },
                      }
                    : {
                        onClick: () => !n.read && markOne(n.id),
                        role: 'button',
                      }
                  return (
                    <li key={n.id}>
                      <Wrapper
                        {...wrapperProps}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                          n.read ? '' : 'bg-secondary-50/40'
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.color}`}
                        >
                          <FontAwesomeIcon icon={style.icon} className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <div
                              className={`flex-1 text-sm leading-snug ${
                                n.read ? 'font-semibold text-gray-700' : 'font-bold text-primary'
                              }`}
                            >
                              {n.title}
                            </div>
                            {!n.read && (
                              <span
                                aria-label={t('espace.notifications.unreadDot')}
                                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
                              />
                            )}
                          </div>
                          {n.text && (
                            <div className="mt-0.5 text-xs font-medium text-gray-600">
                              {n.text}
                            </div>
                          )}
                          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            {relativeTime(n.date, i18n.language)}
                          </div>
                        </div>
                      </Wrapper>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 text-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11px] font-bold uppercase tracking-wider text-secondary transition hover:text-secondary-700"
              >
                {t('espace.notifications.close')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
