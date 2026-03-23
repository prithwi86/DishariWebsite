import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/Dishari_logo_tranparent_final.png'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const location = useLocation()
  const dropdownRef = useRef(null)

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
    setDropdownOpen(false)
  }, [location])

  // Load upcoming events for the dropdown
  useEffect(() => {
    fetch('/data/upcoming-events.json')
      .then((res) => res.json())
      .then((data) => {
        const sorted = (data.events || []).sort((a, b) => a.order - b.order)
        setUpcomingEvents(sorted)
      })
      .catch((err) => console.error('Error loading upcoming events:', err))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Past Events' },
    { to: '/contact', label: 'Contact' },
    { to: '/about', label: 'About Us' },
  ]

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
        <ul className={`nav-menu${menuOpen ? ' active' : ''}`}>
          {/* Home */}
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Home
            </Link>
          </li>

          {/* Upcoming Events dropdown */}
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
                        <a
                          href={ev.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {ev.title}
                        </a>
                      ) : (
                        <Link
                          to={ev.link}
                          className={location.pathname === ev.link ? 'active' : ''}
                        >
                          {ev.title}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </li>

          {/* Past Events, Contact, About Us */}
          {navLinks.slice(1).map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={location.pathname === to ? 'active' : ''}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div
          className={`hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span style={menuOpen ? { transform: 'rotate(-45deg) translate(-5px, 6px)' } : {}} />
          <span style={menuOpen ? { opacity: 0 } : {}} />
          <span style={menuOpen ? { transform: 'rotate(45deg) translate(-5px, -6px)' } : {}} />
        </div>
      </div>
    </nav>
  )
}

export default Navbar
