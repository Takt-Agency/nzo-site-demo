import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Contact from './pages/Contact.jsx'
import Services from './pages/Services.jsx'
import ServiceDetail from './pages/ServiceDetail.jsx'
import About from './pages/About.jsx'
import Devis from './pages/Devis.jsx'
import Shop from './pages/Shop.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Checkout from './pages/Checkout.jsx'
import Reviews from './pages/Reviews.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Mentions from './pages/legal/Mentions.jsx'
import Privacy from './pages/legal/Privacy.jsx'
import CGV from './pages/legal/CGV.jsx'
import Cookies from './pages/legal/Cookies.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminClients from './pages/admin/Clients.jsx'
import AdminClientDetail from './pages/admin/ClientDetail.jsx'
import AdminDevis from './pages/admin/Devis.jsx'
import AdminDevisDetail from './pages/admin/DevisDetail.jsx'
import AdminMissions from './pages/admin/Missions.jsx'
import AdminMissionDetail from './pages/admin/MissionDetail.jsx'
import AdminPlanning from './pages/admin/Planning.jsx'
import AdminCarte from './pages/admin/Carte.jsx'
import AdminSos from './pages/admin/Sos.jsx'
import AdminFactures from './pages/admin/Factures.jsx'
import AdminFactureForm from './pages/admin/FactureForm.jsx'
import AdminDemandes from './pages/admin/Demandes.jsx'
import AdminDemandeDetail from './pages/admin/DemandeDetail.jsx'
import AdminReclamations from './pages/admin/Reclamations.jsx'
import AdminEquipe from './pages/admin/Equipe.jsx'
import AdminAvis from './pages/admin/Avis.jsx'
import AdminStats from './pages/admin/Stats.jsx'
import AdminAgentStat from './pages/admin/AgentStat.jsx'
import AdminArchives from './pages/admin/Archives.jsx'
import AdminParametres from './pages/admin/Parametres.jsx'
import EspaceLayout from './components/espace/EspaceLayout.jsx'
import AgentLayout from './components/agent/AgentLayout.jsx'
import AgentDashboard from './pages/agent/Dashboard.jsx'
import AgentMissions from './pages/agent/Missions.jsx'
import AgentMissionDetail from './pages/agent/MissionDetail.jsx'
import AgentCalendrier from './pages/agent/Calendrier.jsx'
import AgentDemandes from './pages/agent/Demandes.jsx'
import AgentDemandeNew from './pages/agent/DemandeNew.jsx'
import AgentDemandeDetail from './pages/agent/DemandeDetail.jsx'
import AgentParametres from './pages/agent/Parametres.jsx'
import Dashboard from './pages/espace/Dashboard.jsx'
import EspaceDevis from './pages/espace/Devis.jsx'
import EspaceDevisDetail from './pages/espace/DevisDetail.jsx'
import EspaceMissions from './pages/espace/Missions.jsx'
import EspaceMissionDetail from './pages/espace/MissionDetail.jsx'
import EspaceDemandes from './pages/espace/Demandes.jsx'
import EspaceDemandeNew from './pages/espace/DemandeNew.jsx'
import EspaceReclamations from './pages/espace/Reclamations.jsx'
import EspaceReclamationNew from './pages/espace/ReclamationNew.jsx'
import EspaceReclamationDetail from './pages/espace/ReclamationDetail.jsx'
import EspaceFactures from './pages/espace/Factures.jsx'
import EspaceFactureDetail from './pages/espace/FactureDetail.jsx'
import FacturePrint from './pages/FacturePrint.jsx'
import EspaceProfil from './pages/espace/Profil.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import GuestRoute from './components/auth/GuestRoute.jsx'
import CartDrawer from './components/shop/CartDrawer.jsx'
import ScrollUtilities from './components/layout/ScrollUtilities.jsx'
import WhatsAppFloat from './components/layout/WhatsAppFloat.jsx'

export default function App() {
  return (
    <AuthProvider>
    <CartProvider>
      <ScrollUtilities />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route path="/a-propos" element={<About />} />
        <Route path="/devis" element={<Devis />} />
        <Route path="/boutique" element={<Shop />} />
        <Route path="/boutique/checkout" element={<Checkout />} />
        <Route path="/boutique/:slug" element={<ProductDetail />} />
        <Route path="/avis" element={<Reviews />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <Signup />
            </GuestRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <GuestRoute>
              <VerifyEmail />
            </GuestRoute>
          }
        />
        <Route
          path="/mot-de-passe-oublie"
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />
        <Route path="/mentions-legales" element={<Mentions />} />
        <Route path="/confidentialite" element={<Privacy />} />
        <Route path="/cgv" element={<CGV />} />
        <Route path="/cookies" element={<Cookies />} />

        {/* Standalone print routes for invoices (admin + client share the same
            view; the FacturePrint component picks the right fetcher based on
            the connected user's role). No layout chrome so the print stays
            clean. */}
        <Route
          path="/admin/factures/:id/imprimer"
          element={
            <ProtectedRoute role="admin">
              <FacturePrint />
            </ProtectedRoute>
          }
        />
        <Route
          path="/espace-client/factures/:id/imprimer"
          element={
            <ProtectedRoute role="client">
              <FacturePrint />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="clients/:id" element={<AdminClientDetail />} />
          <Route path="devis" element={<AdminDevis />} />
          <Route path="devis/:id" element={<AdminDevisDetail />} />
          <Route path="missions" element={<AdminMissions />} />
          <Route path="missions/:id" element={<AdminMissionDetail />} />
          <Route path="planning" element={<AdminPlanning />} />
          <Route path="carte" element={<AdminCarte />} />
          <Route path="sos" element={<AdminSos />} />
          {/* Same component with a pre-selected alert via URL — used by push
              notifications and the realtime alarm banner. */}
          <Route path="sos/:id" element={<AdminSos />} />
          <Route path="factures" element={<AdminFactures />} />
          <Route path="factures/nouvelle" element={<AdminFactureForm />} />
          <Route path="factures/:id/modifier" element={<AdminFactureForm />} />
          <Route path="demandes" element={<AdminDemandes />} />
          <Route path="demandes/:id" element={<AdminDemandeDetail />} />
          <Route path="reclamations" element={<AdminReclamations />} />
          <Route path="equipe" element={<AdminEquipe />} />
          <Route path="avis" element={<AdminAvis />} />
          <Route path="stats" element={<AdminStats />} />
          <Route path="stats/:id" element={<AdminAgentStat />} />
          <Route path="archives" element={<AdminArchives />} />
          <Route path="parametres" element={<AdminParametres />} />
        </Route>

        <Route
          path="/espace-agent"
          element={
            <ProtectedRoute role="agent">
              <AgentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AgentDashboard />} />
          <Route path="missions" element={<AgentMissions />} />
          <Route path="missions/:id" element={<AgentMissionDetail />} />
          <Route path="calendrier" element={<AgentCalendrier />} />
          <Route path="demandes" element={<AgentDemandes />} />
          <Route path="demandes/nouvelle" element={<AgentDemandeNew />} />
          <Route path="demandes/:id" element={<AgentDemandeDetail />} />
          <Route path="parametres" element={<AgentParametres />} />
        </Route>

        <Route
          path="/espace-client"
          element={
            <ProtectedRoute role="client">
              <EspaceLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="devis" element={<EspaceDevis />} />
          <Route path="devis/:id" element={<EspaceDevisDetail />} />
          <Route path="missions" element={<EspaceMissions />} />
          <Route path="missions/:id" element={<EspaceMissionDetail />} />
          <Route path="demandes" element={<EspaceDemandes />} />
          <Route path="demandes/nouvelle" element={<EspaceDemandeNew />} />
          <Route path="reclamations" element={<EspaceReclamations />} />
          <Route path="reclamations/nouvelle" element={<EspaceReclamationNew />} />
          <Route path="reclamations/:id" element={<EspaceReclamationDetail />} />
          <Route path="factures" element={<EspaceFactures />} />
          <Route path="factures/:id" element={<EspaceFactureDetail />} />
          <Route path="profil" element={<EspaceProfil />} />
        </Route>
      </Routes>
      <CartDrawer />
      <WhatsAppFloat />
    </CartProvider>
    </AuthProvider>
  )
}
