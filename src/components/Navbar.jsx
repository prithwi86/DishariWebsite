import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/Dishari_logo_tranparent_final.png'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [submenuOpen, setSubmenuOpen] = useState(null) // key of open submenu
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const location = useLocation()
  const dropdownRef = useRef(null)

  // Close everything on route change
  useEffect(() => {
    setMenuOpen(false)
    setSubmenuOpen(null)
    setDropdownOpen(false)
  }, [location])

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Load upcoming events
  useEffect(() => {
    fetch('/data/upcoming-events.json')
      .then((res) => res.json())
      .then((data) => {
        const sorted = (data.events || []).sort((a, b) => a.order - b.order)
        setUpcomingEvents(sorted)
      })
      .catch((err) => console.error('Error loading upcoming events:', err))
  }, [])

  // Close desktop dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isUpcomingActive = upcomingEvents.some(
    (ev) => location.pathname === ev.link
  )

  return (
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
          <li className="nav-dropdown" ref={dropdownRef}>
            <button
              className={`nav-dropdown-toggle${isUpcomingActive ? ' active' : ''}`}
              onClick={() => setDropdownOpen((prev) => !prev)}
              type="button"
            >
              Upcoming Events <i className={`fas fa-chevron-down nav-dropdown-arrow${dropdownOpen ? ' open' : ''}`}></i>
            </button>
            {dropdownOpen && upcomingEvents.length > 0 && (
              <ul className="nav-dropdown-menu">
                {upcomingEvents.map((ev) => {
                  const isExternal = ev.link.startsWith('http')
                  return (
                    <li key={ev.order}>
                      {isExternal ? (
                        <a href={ev.link} target="_blank" rel="noopener noreferrer">{ev.title}</a>
                      ) : (
                        <Link to={ev.link} className={location.pathname === ev.link ? 'active' : ''}>{ev.title}</Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
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

      {/* ─── Mobile fullscreen drawer ─── */}
      <div className={`mobile-drawer${menuOpen ? ' open' : ''}`}>
        {/* Main menu panel */}
        <div className={`drawer-panel${submenuOpen ? ' hidden' : ''}`}>
          <Link to="/" className="drawer-row">Home</Link>

          <button
            className="drawer-row drawer-row-sub"
            onClick={() => setSubmenuOpen('upcoming')}
            type="button"
          >
            <span>Upcoming Events</span>
            <i className="fas fa-chevron-right"></i>
          </button>

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
          {upcomingEvents.map((ev) => {
            const isExternal = ev.link.startsWith('http')
            return isExternal ? (
              <a
                key={ev.order}
                href={ev.link}
                className="drawer-row"
                target="_blank"
                rel="noopener noreferrer"
              >
                {ev.title}
              </a>
            ) : (
              <Link key={ev.order} to={ev.link} className="drawer-row">
                {ev.title}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
