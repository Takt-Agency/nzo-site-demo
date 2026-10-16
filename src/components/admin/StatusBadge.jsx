const palette = {
  // Devis
  new: 'bg-accent/10 text-accent-700',
  pending: 'bg-secondary-100 text-secondary-700',
  quoted: 'bg-tertiary-50 text-tertiary-700',
  accepted: 'bg-accent text-white',
  rejected: 'bg-gray-200 text-gray-600',
  // Missions
  scheduled: 'bg-secondary-100 text-secondary-700',
  inProgress: 'bg-amber-100 text-amber-700',
  completed: 'bg-accent/10 text-accent-700',
  cancelled: 'bg-gray-100 text-gray-500',
  // Factures
  paid: 'bg-accent/10 text-accent-700',
  overdue: 'bg-red-50 text-red-600',
  // Demandes / réclamations
  in_review: 'bg-tertiary-50 text-tertiary-700',
  replied: 'bg-accent/10 text-accent-700',
  closed: 'bg-gray-100 text-gray-500',
  open: 'bg-amber-100 text-amber-700',
  resolved: 'bg-accent/10 text-accent-700',
  // Clients / équipe
  active: 'bg-accent/10 text-accent-700',
  inactive: 'bg-gray-100 text-gray-500',
  training: 'bg-secondary-100 text-secondary-700',
}

export default function StatusBadge({ status, label }) {
  const cls = palette[status] || palette.pending
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      {label || status}
    </span>
  )
}
