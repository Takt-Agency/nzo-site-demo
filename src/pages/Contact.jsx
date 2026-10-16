import TopBar from '../components/layout/TopBar.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import ContactSection from '../components/sections/ContactSection.jsx'
import ContactMap from '../components/sections/ContactMap.jsx'

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />
      <main>
        <ContactSection />
        <ContactMap />
      </main>
      <Footer />
    </div>
  )
}
