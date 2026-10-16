import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import AgentSidebar from './AgentSidebar.jsx'
import AgentTopBar from './AgentTopBar.jsx'

export default function AgentLayout() {
  const { t } = useTranslation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <AgentSidebar />
        </div>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-72 max-w-[85%] flex-col">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute -right-12 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-md"
              aria-label={t('agent.topbar.closeMenu')}
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </button>
            <AgentSidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AgentTopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
