import TopBar from '../components/layout/TopBar.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import Hero from '../components/sections/Hero.jsx'
import FeaturesBar from '../components/sections/FeaturesBar.jsx'
import Services from '../components/sections/Services.jsx'
import Process from '../components/sections/Process.jsx'
import BeforeAfter from '../components/sections/BeforeAfter.jsx'
import Coverage from '../components/sections/Coverage.jsx'
import EspaceClient from '../components/sections/EspaceClient.jsx'
import FinalCTA from '../components/sections/FinalCTA.jsx'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />
      <main>
        <Hero />
        <FeaturesBar />
        <Services />
        <Process />
        <BeforeAfter />
        <Coverage />
        <EspaceClient />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
