import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/Dishari_logo_tranparent_final.png'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About Us' },
    { to: '/events', label: 'Events' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          <img src={logo} alt="Dishari Boston Inc. Logo" className="logo-img" />
          <h1>Dishari Boston</h1>
        </Link>
        <ul className={`nav-menu${menuOpen ? ' active' : ''}`}>
          {navLinks.map(({ to, label }) => (
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
