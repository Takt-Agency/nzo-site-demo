import { useCallback, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuilding,
  faMoneyBillTrendUp,
  faLock,
  faGlobe,
  faArrowRight,
  faCircleExclamation,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import CompanyModal from '../../components/admin/CompanyModal.jsx'
import PricingModal from '../../components/admin/PricingModal.jsx'
import PasswordModal from '../../components/shared/PasswordModal.jsx'
import LanguageModal from '../../components/shared/LanguageModal.jsx'
import { adminApi } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'

function SettingsCard({ icon, color, title, description, onClick, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-start gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md md:p-6"
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${color}`}
      >
        <FontAwesomeIcon icon={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-primary md:text-base">{title}</h2>
          <FontAwesomeIcon
            icon={faArrowRight}
            className="h-3 w-3 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-secondary"
          />
        </div>
        <p className="mt-1 text-xs font-medium leading-snug text-gray-500">{description}</p>
        {hint && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary-50 px-2 py-0.5 text-[10px] font-bold text-secondary-700">
            <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" />
            {hint}
          </div>
        )}
      </div>
    </button>
  )
}

export default function AdminParametres() {
  const [modal, setModal] = useState(null) // 'company' | 'pricing' | 'password' | 'language'

  const fetcher = useCallback(() => adminApi.getSettings(), [])
  const { data, loading, error, reload } = useApi(fetcher)
  const settings = data?.settings || { company: {}, pricing: {}, defaults: {} }

  const hasCompany = settings.company?.name && settings.company?.address
  const hasRates = (settings.pricing?.rates || []).length > 0

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="CONFIGURATION"
        title="Paramètres"
        description="Configuration de votre société, tarifs, sécurité et préférences."
      />

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-3.5 w-3.5" />
          {error.message}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <SettingsCard
          icon={faBuilding}
          color="bg-gradient-to-br from-primary-700 to-secondary-700"
          title="Société"
          description="Raison sociale, IDE, adresse, contact, IBAN — apparaît sur les factures."
          onClick={() => setModal('company')}
          hint={!loading && hasCompany ? settings.company.name : null}
        />
        <SettingsCard
          icon={faMoneyBillTrendUp}
          color="bg-gradient-to-br from-accent to-accent-700"
          title="Tarification"
          description="Grille tarifaire par service, TVA, conditions de paiement et acompte."
          onClick={() => setModal('pricing')}
          hint={
            !loading && hasRates
              ? `${settings.pricing.rates.length} tarif${
                  settings.pricing.rates.length > 1 ? 's' : ''
                } · TVA ${settings.pricing.vatRate}%`
              : null
          }
        />
        <SettingsCard
          icon={faLock}
          color="bg-gradient-to-br from-tertiary-600 to-tertiary-700"
          title="Mot de passe"
          description="Modifier le mot de passe de votre compte administrateur."
          onClick={() => setModal('password')}
        />
        <SettingsCard
          icon={faGlobe}
          color="bg-gradient-to-br from-emerald-500 to-emerald-700"
          title="Langues et région"
          description="Langue d'affichage, fuseau horaire — utilisés sur l'interface et les documents."
          onClick={() => setModal('language')}
          hint={
            settings.defaults?.language
              ? `Langue : ${settings.defaults.language.toUpperCase()}`
              : null
          }
        />
      </div>

      <div className="rounded-2xl border-2 border-dashed border-secondary/20 bg-secondary-50/40 p-4 text-xs font-medium leading-relaxed text-gray-600">
        <strong className="font-bold text-secondary-700">
          Phase 2 — Facturation automatique :
        </strong>{' '}
        les informations société et la grille tarifaire saisies ici seront utilisées pour générer
        automatiquement les factures (montant calculé, TVA appliquée, coordonnées remplies).
      </div>

      {modal === 'company' && (
        <CompanyModal
          initial={settings.company}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      )}
      {modal === 'pricing' && (
        <PricingModal
          initial={settings.pricing}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      )}
      {modal === 'password' && <PasswordModal onClose={() => setModal(null)} />}
      {modal === 'language' && (
        <LanguageModal
          mode="admin"
          initial={settings.defaults}
          onClose={() => setModal(null)}
          onSave={async (payload) => {
            await adminApi.updateSettings({ defaults: payload })
            reload()
          }}
        />
      )}
    </div>
  )
}
