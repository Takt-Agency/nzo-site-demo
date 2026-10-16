import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faHeadset } from '@fortawesome/free-solid-svg-icons'

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

// Render the back-and-forth thread between client and admin. Used in both
// the client devis detail page and the admin one.
// `viewer` is 'client' or 'admin' — used to right-align the viewer's own bubbles.
export default function DevisThread({ replies = [], viewer = 'client', staffMessage = null }) {
  if (replies.length === 0 && !staffMessage) return null

  const items = []
  if (staffMessage) {
    items.push({
      from: 'admin',
      text: staffMessage,
      createdAt: null,
      isInitial: true,
    })
  }
  items.push(...replies)

  return (
    <ul className="space-y-3">
      {items.map((r, i) => {
        const mine = r.from === viewer
        const isAdmin = r.from === 'admin'
        return (
          <li
            key={r.id || i}
            className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
          >
            {!mine && (
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isAdmin ? 'bg-accent text-white' : 'bg-secondary text-white'
                }`}
              >
                <FontAwesomeIcon icon={isAdmin ? faHeadset : faUser} className="h-3 w-3" />
              </span>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                mine
                  ? 'bg-secondary text-white'
                  : isAdmin
                    ? 'bg-accent/10 text-primary ring-1 ring-accent/20'
                    : 'bg-gray-100 text-primary'
              }`}
            >
              {r.isInitial && (
                <div
                  className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${
                    mine ? 'text-white/70' : 'text-accent-700'
                  }`}
                >
                  Message initial
                </div>
              )}
              <p className="whitespace-pre-line font-medium leading-relaxed">{r.text}</p>
              {r.createdAt && (
                <div
                  className={`mt-1 text-[10px] font-semibold ${
                    mine ? 'text-white/70' : 'text-gray-400'
                  }`}
                >
                  {formatDate(r.createdAt)}
                </div>
              )}
            </div>
            {mine && (
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isAdmin ? 'bg-accent text-white' : 'bg-secondary text-white'
                }`}
              >
                <FontAwesomeIcon icon={isAdmin ? faHeadset : faUser} className="h-3 w-3" />
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
