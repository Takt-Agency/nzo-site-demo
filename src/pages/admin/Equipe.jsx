import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faEnvelope,
  faPhone,
  faStar,
  faSprayCanSparkles,
  faPencil,
  faUsersGear,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import AgentFormModal from '../../components/admin/AgentFormModal.jsx'
import RowActions from '../../components/admin/RowActions.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

const ROLE_LABELS = {
  chef: "Chef d'équipe",
  senior: 'Agent senior',
  agent: 'Agent',
  training: 'En formation',
}

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function AdminEquipe() {
  const { t } = useTranslation()
  const [modal, setModal] = useState(null) // null | 'create' | agent object

  const fetcher = useCallback(() => adminApi.listAgents(), [])
  const { data, loading, error, reload } = useApi(fetcher)
  const agents = data?.items || []

  const onSuccess = () => reload()

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={t('admin.equipe.eyebrow')}
        title={t('admin.equipe.title')}
        description={t('admin.equipe.subtitle', { count: agents.length })}
        action={
          <button
            type="button"
            onClick={() => setModal('create')}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            {t('admin.equipe.new')}
          </button>
        }
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
            />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <FontAwesomeIcon icon={faUsersGear} className="h-8 w-8 text-gray-300" />
          <p className="mt-4 text-sm font-bold text-primary">Aucun agent enregistré</p>
          <p className="mt-1 text-xs font-medium text-gray-500">
            Ajoutez votre premier membre d'équipe pour l'assigner à des missions.
          </p>
          <button
            type="button"
            onClick={() => setModal('create')}
            className="btn-primary mt-6 px-5 py-2.5 text-sm"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            {t('admin.equipe.new')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-secondary-700 text-base font-bold tracking-wider text-white shadow-md">
                  {initials(a.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-primary md:text-base">
                    {a.name}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-gray-500">
                    {ROLE_LABELS[a.role] || a.role}
                  </div>
                  <div className="mt-1.5">
                    <StatusBadge status={a.status} label={t(`admin.statuses.${a.status}`)} />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setModal(a)}
                    aria-label="Modifier"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-secondary-50 hover:text-secondary"
                  >
                    <FontAwesomeIcon icon={faPencil} className="h-3 w-3" />
                  </button>
                  <RowActions
                    resource="agents"
                    id={a.id}
                    isArchived={a.isArchived}
                    itemLabel={`l'agent ${a.name}`}
                    onChange={reload}
                  />
                </div>
              </div>

              {(a.email || a.phone) && (
                <div className="mt-4 space-y-2 text-xs font-medium text-gray-600">
                  {a.email && (
                    <a
                      href={`mailto:${a.email}`}
                      className="flex items-center gap-2 transition hover:text-secondary"
                    >
                      <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3 text-secondary" />
                      <span className="truncate">{a.email}</span>
                    </a>
                  )}
                  {a.phone && (
                    <a
                      href={`tel:${a.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 transition hover:text-secondary"
                    >
                      <FontAwesomeIcon icon={faPhone} className="h-3 w-3 text-secondary" />
                      {a.phone}
                    </a>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <FontAwesomeIcon icon={faSprayCanSparkles} className="h-3 w-3 text-accent" />
                  {a.activeMissions} {t('admin.equipe.activeMissions')}
                </div>
                {a.rating != null && (
                  <div className="flex items-center gap-1 font-bold text-amber-600">
                    <FontAwesomeIcon icon={faStar} className="h-3 w-3" />
                    {Number(a.rating).toFixed(1)}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <AgentFormModal
          agent={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSuccess={onSuccess}
        />
      )}
    </div>
  )
}
