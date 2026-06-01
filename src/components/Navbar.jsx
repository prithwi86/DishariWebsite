import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/Dishari_logo_tranparent_final.png'
import { stripCommentedFields } from '../utils/jsonHelper'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [submenuOpen, setSubmenuOpen] = useState(null) // key of open submenu
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [pressDropdownOpen, setPressDropdownOpen] = useState(false)
  const [magazineDropdownOpen, setMagazineDropdownOpen] = useState(false)
  const [expandedYear, setExpandedYear] = useState(null)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [pressReleases, setPressReleases] = useState([])
  const [magazines, setMagazines] = useState({})
  const location = useLocation()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const pressDropdownRef = useRef(null)
  const magazineDropdownRef = useRef(null)
  const dropdownTimeoutRef = useRef(null)
  const pressDropdownTimeoutRef = useRef(null)
  const magazineDropdownTimeoutRef = useRef(null)
  const { user, promptSignIn, gsiReady } = useAuth()

  // Close everything on route change
  useEffect(() => {
    setMenuOpen(false)
    setSubmenuOpen(null)
    setDropdownOpen(false)
    setPressDropdownOpen(false)
    setMagazineDropdownOpen(false)
    setExpandedYear(null)
  }, [location])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current)
      if (pressDropdownTimeoutRef.current) clearTimeout(pressDropdownTimeoutRef.current)
      if (magazineDropdownTimeoutRef.current) clearTimeout(magazineDropdownTimeoutRef.current)
    }
  }, [])

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

  // Load magazines
  useEffect(() => {
    fetch('/data/magazine.json', { cache: 'no-store' })
      .then((res) => res.json())
      .then((raw) => stripCommentedFields(raw))
      .then((data) => setMagazines(data || {}))
      .catch((err) => console.error('Error loading magazines:', err))
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
      if (magazineDropdownRef.current && !magazineDropdownRef.current.contains(e.target)) {
        setMagazineDropdownOpen(false)
        setExpandedYear(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isUpcomingActive = upcomingEvents.some(
    (ev) => location.pathname === `/event/${ev.id}`
  )

  const handleUpcomingEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current)
    setDropdownOpen(true)
  }

  const handleUpcomingLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false)
    }, 150)
  }

  const handlePressEnter = () => {
    if (pressDropdownTimeoutRef.current) clearTimeout(pressDropdownTimeoutRef.current)
    setPressDropdownOpen(true)
  }

  const handlePressLeave = () => {
    pressDropdownTimeoutRef.current = setTimeout(() => {
      setPressDropdownOpen(false)
    }, 150)
  }

  const handleMagazineEnter = () => {
    if (magazineDropdownTimeoutRef.current) clearTimeout(magazineDropdownTimeoutRef.current)
    setMagazineDropdownOpen(true)
  }

  const handleMagazineLeave = () => {
    magazineDropdownTimeoutRef.current = setTimeout(() => {
      setMagazineDropdownOpen(false)
      setExpandedYear(null)
    }, 150)
  }

  const handleYearEnter = (year) => {
    setExpandedYear(year)
  }

  const handleYearLeave = () => {
    setExpandedYear(null)
  }

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
            <li className="nav-dropdown" ref={dropdownRef} onMouseEnter={handleUpcomingEnter} onMouseLeave={handleUpcomingLeave}>
              <div className="nav-dropdown-toggle-group">
                <Link to="/upcoming-events" className={`nav-dropdown-toggle-link${location.pathname === '/upcoming-events' ? ' active' : ''}`}>
                  Upcoming Events
                </Link>
                <button
                  className="nav-dropdown-toggle-arrow"
                  type="button"
                >
                  <i className={`fas fa-chevron-down nav-dropdown-arrow${dropdownOpen ? ' open' : ''}`}></i>
                </button>
              </div>
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
            <li className="nav-dropdown" ref={pressDropdownRef} onMouseEnter={handlePressEnter} onMouseLeave={handlePressLeave}>
              <div className="nav-dropdown-toggle-group">
                <Link to="/press-room" className={`nav-dropdown-toggle-link${location.pathname === '/press-room' ? ' active' : ''}`}>
                  Press Room
                </Link>
                <button
                  className="nav-dropdown-toggle-arrow"
                  type="button"
                >
                  <i className={`fas fa-chevron-down nav-dropdown-arrow${pressDropdownOpen ? ' open' : ''}`}></i>
                </button>
              </div>
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
          {Object.keys(magazines).filter(k => k !== 'metadata').length > 0 && (
            <li className="nav-dropdown" ref={magazineDropdownRef} onMouseEnter={handleMagazineEnter} onMouseLeave={handleMagazineLeave}>
              <div className="nav-dropdown-toggle-group">
                <Link to="/magazine" className={`nav-dropdown-toggle-link${location.pathname === '/magazine' ? ' active' : ''}`}>
                  Magazine
                </Link>
                <button
                  className="nav-dropdown-toggle-arrow"
                  type="button"
                >
                  <i className={`fas fa-chevron-down nav-dropdown-arrow${magazineDropdownOpen ? ' open' : ''}`}></i>
                </button>
              </div>
              {magazineDropdownOpen && (
                <ul className="nav-dropdown-menu">
                  {Object.keys(magazines)
                    .filter(k => k !== 'metadata')
                    .sort()
                    .reverse()
                    .map((year) => (
                      <li key={year} className="nav-submenu-item" onMouseEnter={() => handleYearEnter(year)} onMouseLeave={handleYearLeave}>
                        <button className="nav-submenu-toggle" type="button">
                          {year} <i className="fas fa-chevron-right"></i>
                        </button>
                        {expandedYear === year && (
                          <ul className="nav-sub-dropdown-menu">
                            {magazines[year] && magazines[year].map((mag, idx) => (
                              <li key={idx}>
                                <button
                                  className="mag-link"
                                  onClick={() => navigate(`/magazine/${encodeURIComponent(mag.filename)}`)}
                                  type="button"
                                >
                                  {mag.title}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                </ul>
              )}
            </li>
          )}
          <li><Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Contact</Link></li>
          <li><Link to="/donate" className={location.pathname === '/donate' ? 'active' : ''}>Support Us</Link></li>
          <li><Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About Us</Link></li>
          <li>
            {user ? (
              <Link to="/dashboard" className={`nav-login-btn nav-login-authenticated${location.pathname === '/dashboard' ? ' active' : ''}`}>
                <img src={user.picture} alt="" className="nav-login-avatar" referrerPolicy="no-referrer" />
              </Link>
            ) : (
              <button className="nav-login-btn" onClick={() => { if (gsiReady) { navigate('/dashboard'); } }} type="button">
                <i className="fas fa-sign-in-alt"></i> Login
              </button>
            )}
          </li>
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
          {Object.keys(magazines).filter(k => k !== 'metadata').length > 0 && (
            <button
              className="drawer-row drawer-row-sub"
              onClick={() => setSubmenuOpen('magazine')}
              type="button"
            >
              <span>Magazine</span>
              <i className="fas fa-chevron-right"></i>
            </button>
          )}
          <Link to="/contact" className="drawer-row">Contact</Link>
          <Link to="/donate" className="drawer-row">Support Us</Link>
          <Link to="/about" className="drawer-row">About Us</Link>
          {user ? (
            <Link to="/dashboard" className="drawer-row drawer-login">
              <img src={user.picture} alt="" className="nav-login-avatar" referrerPolicy="no-referrer" />
              <span>{user.name}</span>
            </Link>
          ) : (
            <button className="drawer-row drawer-login" onClick={() => { setMenuOpen(false); navigate('/dashboard'); }} type="button">
              <i className="fas fa-sign-in-alt"></i> <span>Login</span>
            </button>
          )}
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
          <Link to="/upcoming-events" className="drawer-row drawer-magazine-parent">
            <span>Upcoming Events</span>
            <i className="fas fa-arrow-right"></i>
          </Link>
          <div className="drawer-sub-title">Select an Event</div>
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
          <Link to="/press-room" className="drawer-row drawer-magazine-parent">
            <span>Press Room</span>
            <i className="fas fa-arrow-right"></i>
          </Link>
          <div className="drawer-sub-title">Select a Release</div>
          {pressReleases.map((pr) => (
            <Link key={pr.id} to={`/press/${pr.id}`} className="drawer-row">
              {pr.description}
            </Link>
          ))}
        </div>

        {/* Magazine submenu panel */}
        <div className={`drawer-panel drawer-sub${submenuOpen === 'magazine' ? ' visible' : ''}`}>
          <button
            className="drawer-back"
            onClick={() => setSubmenuOpen(null)}
            type="button"
          >
            <i className="fas fa-chevron-left"></i> Back
          </button>
          <Link to="/magazine" className="drawer-row drawer-magazine-parent">
            <span>Magazine</span>
            <i className="fas fa-arrow-right"></i>
          </Link>
          <div className="drawer-sub-title">Select a Magazine</div>
          {Object.keys(magazines)
            .filter(k => k !== 'metadata')
            .sort()
            .reverse()
            .map((year) => (
              <div key={year}>
                <div style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  {year}
                </div>
                {magazines[year] && magazines[year].map((mag, idx) => (
                  <Link key={idx} to={`/magazine/${encodeURIComponent(mag.filename)}`} className="drawer-row" style={{ paddingLeft: '2.5rem' }}>
                    {mag.title}
                  </Link>
                ))}
              </div>
            ))}
        </div>


      </div>
    </>
  )
}

export default Navbar
