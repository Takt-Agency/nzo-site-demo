import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInbox } from '@fortawesome/free-solid-svg-icons'

export default function EmptyState({ icon = faInbox, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-gray-100">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-50 text-secondary">
        <FontAwesomeIcon icon={icon} className="h-5 w-5" />
      </span>
      <h3 className="mt-5 text-base font-bold text-primary">{title}</h3>
      {text && <p className="mt-2 max-w-md text-sm font-medium text-gray-500">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
