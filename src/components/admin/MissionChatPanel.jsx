import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faSpinner, faComments } from '@fortawesome/free-solid-svg-icons'
import { adminApi } from '../../lib/api.js'
import { getAdminSocket } from '../../lib/realtime.js'

// Direct admin ↔ agent chat scoped to one mission. Messages live on the
// Mission document (embedded array), so we reuse the existing mission API:
// send via POST, refresh on incoming socket event. Socket delivers new
// messages in real time so we no longer poll every 10s (the aggressive
// polling was reloading the whole mission page and flashing the UI).
function fmtTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('fr-CH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MissionChatPanel({ mission, onRefresh }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)
  const messages = mission?.messages || []
  const unread = mission?.unreadForAdmin || 0

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  // Mark agent messages as read as soon as the panel is mounted.
  useEffect(() => {
    if (!mission?.id) return
    adminApi.markMissionMessagesRead(mission.id).catch(() => {})
  }, [mission?.id])

  // Socket-based realtime — the backend fires `mission:message` on the
  // admin namespace whenever anyone posts a message. We refresh the mission
  // only when an event matches THIS mission's id, so unrelated chatter on
  // other missions doesn't trigger a page reload.
  useEffect(() => {
    if (!mission?.id) return
    const socket = getAdminSocket()
    const onMessage = (payload) => {
      if (payload?.missionId === mission.id) onRefresh?.()
    }
    socket.on('mission:message', onMessage)
    return () => {
      socket.off('mission:message', onMessage)
    }
  }, [mission?.id, onRefresh])

  const send = async () => {
    const clean = text.trim()
    if (clean.length < 1) return
    setError(null)
    setSending(true)
    try {
      await adminApi.postMissionMessage(mission.id, clean)
      setText('')
      await onRefresh?.()
    } catch (err) {
      setError(err.message || 'Envoi impossible')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full min-h-[520px] flex-col rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <FontAwesomeIcon icon={faComments} className="h-3.5 w-3.5 text-accent-700" />
          </div>
          <div>
            <div className="text-sm font-bold text-primary">Discussion avec l'agent</div>
            <div className="text-[11px] font-semibold text-gray-500">
              Directement lié à cette mission
            </div>
          </div>
        </div>
        {unread > 0 && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {unread} non lu{unread > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <FontAwesomeIcon icon={faComments} className="h-8 w-8 text-gray-200" />
            <div className="mt-3 text-sm font-bold text-primary">Aucun message</div>
            <div className="mt-1 text-xs text-gray-500">
              Écrivez à l'agent pour toute question sur cette intervention.
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const isMe = m.from === 'admin'
            const prev = messages[i - 1]
            const sameAuthor = prev && prev.from === m.from
            return (
              <div
                key={m.id || `${m.createdAt}-${i}`}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                    isMe
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  } ${sameAuthor ? 'mt-0.5' : 'mt-2'}`}
                >
                  {!sameAuthor && (
                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isMe ? 'text-white/70' : 'text-primary'
                      }`}
                    >
                      {isMe ? m.userName || 'Vous' : m.userName || 'Agent'}
                    </div>
                  )}
                  <div className={`mt-1 text-sm leading-5 ${isMe ? 'text-white' : 'text-gray-800'}`}>
                    {m.text}
                  </div>
                  <div
                    className={`mt-1 text-[10px] ${
                      isMe ? 'text-white/60' : 'text-gray-400'
                    }`}
                  >
                    {fmtTime(m.createdAt)}
                    {m.readAt && isMe && ' · Vu'}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {error && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-gray-100 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Écrire à l'agent…"
          disabled={sending}
          rows={1}
          className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-accent focus:bg-white"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || text.trim().length < 1}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-sm transition hover:bg-accent-600 disabled:opacity-40"
        >
          {sending ? (
            <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
