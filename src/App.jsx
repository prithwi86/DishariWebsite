import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ScrollToTopButton from './components/ScrollToTopButton'
import Home from './pages/Home'
import About from './pages/About'
import Events from './pages/Events'
import Contact from './pages/Contact'
import EventGallery from './pages/EventGallery'
import FutureEvent from './pages/FutureEvent'
import PressReleasePage from './pages/PressReleasePage'

function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/event-gallery" element={<EventGallery />} />
        <Route path="/future-event" element={<FutureEvent />} />
        <Route path="/press/:id" element={<PressReleasePage />} />
      </Routes>
      <Footer />
      <ScrollToTopButton />
    </>
  )
}

export default App
