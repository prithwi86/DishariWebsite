import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/Dishari_logo_tranparent_final.png'
import { stripCommentedFields } from '../utils/jsonHelper'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [submenuOpen, setSubmenuOpen] = useState(null) // key of open submenu
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [pressDropdownOpen, setPressDropdownOpen] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [pressReleases, setPressReleases] = useState([])
  const location = useLocation()
  const dropdownRef = useRef(null)
  const pressDropdownRef = useRef(null)

  // Close everything on route change
  useEffect(() => {
    setMenuOpen(false)
    setSubmenuOpen(null)
    setDropdownOpen(false)
    setPressDropdownOpen(false)
  }, [location])

  // Prevent page scrolling when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    document.documentElement.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [menuOpen])



  // Load upcoming events
  useEffect(() => {
    fetch('/data/upcoming-events.json')
      .then((res) => res.json())
      .then((raw) => stripCommentedFields(raw))
      .then((data) => {
        const events = (data.events || [])
          .filter((ev) => ev.id && ev.id.trim() !== '')
          .sort((a, b) => {
            const orderA = typeof a.order === 'number' ? a.order : Infinity
            const orderB = typeof b.order === 'number' ? b.order : Infinity
            if (orderA !== orderB) return orderA - orderB
            return (a.id || '').localeCompare(b.id || '')
          })
        setUpcomingEvents(events)
      })
      .catch((err) => console.error('Error loading upcoming events:', err))
  }, [])

  // Load press releases
  useEffect(() => {
    fetch('/data/press_release.json')
      .then((res) => res.json())
      .then((raw) => stripCommentedFields(raw))
      .then((data) => setPressReleases(data.press_releases || []))
      .catch((err) => console.error('Error loading press releases:', err))
  }, [])

  // Close desktop dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
      if (pressDropdownRef.current && !pressDropdownRef.current.contains(e.target)) {
        setPressDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isUpcomingActive = upcomingEvents.some(
    (ev) => location.pathname === `/event/${ev.id}`
  )

  return (
    <>
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          <img src={logo} alt="Dishari Boston Inc. Logo" className="logo-img" />
          <h1>Dishari Boston</h1>
        </Link>

        {/* ─── Desktop nav ─── */}
        <ul className="nav-menu nav-desktop">
          <li>
            <Link to="/">Home</Link>
          </li>
          {upcomingEvents.length > 0 && (
          <li className="nav-dropdown" ref={dropdownRef}>
            <button
              className={`nav-dropdown-toggle${isUpcomingActive ? ' active' : ''}`}
              onClick={() => setDropdownOpen((prev) => !prev)}
              type="button"
            >
              Upcoming Events <i className={`fas fa-chevron-down nav-dropdown-arrow${dropdownOpen ? ' open' : ''}`}></i>
            </button>
            {dropdownOpen && (
              <ul className="nav-dropdown-menu">
                {upcomingEvents.map((ev) => (
                  <li key={ev.id}>
                    <Link to={`/event/${ev.id}`} className={location.pathname === `/event/${ev.id}` ? 'active' : ''}>
                      {ev.title || ev.id}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
          )}
          {pressReleases.length > 0 && (
            <li className="nav-dropdown" ref={pressDropdownRef}>
              <button
                className="nav-dropdown-toggle"
                onClick={() => setPressDropdownOpen((prev) => !prev)}
                type="button"
              >
                Press Room <i className={`fas fa-chevron-down nav-dropdown-arrow${pressDropdownOpen ? ' open' : ''}`}></i>
              </button>
              {pressDropdownOpen && (
                <ul className="nav-dropdown-menu">
                  {pressReleases.map((pr) => (
                    <li key={pr.id}>
                      <Link to={`/press/${pr.id}`}>{pr.description}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )}
          <li><Link to="/events" className={location.pathname === '/events' ? 'active' : ''}>Past Events</Link></li>
          <li><Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Contact</Link></li>
          <li><Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About Us</Link></li>
        </ul>

        {/* ─── Hamburger ─── */}
        <div
          className={`hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => { setMenuOpen(!menuOpen); setSubmenuOpen(null) }}
        >
          <span style={menuOpen ? { transform: 'rotate(-45deg) translate(-5px, 6px)' } : {}} />
          <span style={menuOpen ? { opacity: 0 } : {}} />
          <span style={menuOpen ? { transform: 'rotate(45deg) translate(-5px, -6px)' } : {}} />
        </div>
      </div>
    </nav>

      {/* ─── Mobile drawer (floating overlay) ─── */}
      <div
        className={`mobile-drawer${menuOpen ? ' open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) { setMenuOpen(false); setSubmenuOpen(null) } }}
      >
        {/* Main menu panel */}
        <div className={`drawer-panel${submenuOpen ? ' hidden' : ''}`}>
          <Link to="/" className="drawer-row">Home</Link>

          {upcomingEvents.length > 0 && (
          <button
            className="drawer-row drawer-row-sub"
            onClick={() => setSubmenuOpen('upcoming')}
            type="button"
          >
            <span>Upcoming Events</span>
            <i className="fas fa-chevron-right"></i>
          </button>
          )}

          {pressReleases.length > 0 && (
            <button
              className="drawer-row drawer-row-sub"
              onClick={() => setSubmenuOpen('press')}
              type="button"
            >
              <span>Press Room</span>
              <i className="fas fa-chevron-right"></i>
            </button>
          )}

          <Link to="/events" className="drawer-row">Past Events</Link>
          <Link to="/contact" className="drawer-row">Contact</Link>
          <Link to="/about" className="drawer-row">About Us</Link>
        </div>

        {/* Upcoming Events submenu panel */}
        <div className={`drawer-panel drawer-sub${submenuOpen === 'upcoming' ? ' visible' : ''}`}>
          <button
            className="drawer-back"
            onClick={() => setSubmenuOpen(null)}
            type="button"
          >
            <i className="fas fa-chevron-left"></i> Back
          </button>
          <div className="drawer-sub-title">Upcoming Events</div>
          {upcomingEvents.map((ev) => (
            <Link key={ev.id} to={`/event/${ev.id}`} className="drawer-row">
              {ev.title || ev.id}
            </Link>
          ))}
        </div>

        {/* Press Room submenu panel */}
        <div className={`drawer-panel drawer-sub${submenuOpen === 'press' ? ' visible' : ''}`}>
          <button
            className="drawer-back"
            onClick={() => setSubmenuOpen(null)}
            type="button"
          >
            <i className="fas fa-chevron-left"></i> Back
          </button>
          <div className="drawer-sub-title">Press Room</div>
          {pressReleases.map((pr) => (
            <Link key={pr.id} to={`/press/${pr.id}`} className="drawer-row">
              {pr.description}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

export default Navbar
