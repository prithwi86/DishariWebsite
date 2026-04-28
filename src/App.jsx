import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ScrollToTopButton from './components/ScrollToTopButton'
import Home from './pages/Home'
import About from './pages/About'
import Events from './pages/Events'
import Contact from './pages/Contact'
import Donate from './pages/Donate'
import EventGallery from './pages/EventGallery'
import FutureEvent from './pages/FutureEvent'
import PressReleasePage from './pages/PressReleasePage'
import { AuthProvider } from './context/AuthContext'

const Admin = lazy(() => import('./pages/Admin'))
const Reports = lazy(() => import('./pages/Reports'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/event-gallery" element={<EventGallery />} />
        <Route path="/event/:id" element={<FutureEvent />} />
        <Route path="/press/:id" element={<PressReleasePage />} />
        <Route path="/admin" element={<Suspense fallback={<div>Loading…</div>}><Admin /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<div>Loading…</div>}><Reports /></Suspense>} />
        <Route path="/dashboard" element={<Suspense fallback={<div>Loading…</div>}><Dashboard /></Suspense>} />
      </Routes>
      <Footer />
      <ScrollToTopButton />
    </AuthProvider>
  )
}

export default App
