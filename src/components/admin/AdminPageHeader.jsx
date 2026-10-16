export default function AdminPageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 pb-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-700">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-1 text-xl font-bold tracking-tight text-primary md:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm font-medium text-gray-500">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
