import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// Map social_media keys to Font Awesome icon classes and display labels
const SOCIAL_META = {
  facebook:  { icon: 'fab fa-facebook',  label: 'Facebook' },
  instagram: { icon: 'fab fa-instagram', label: 'Instagram' },
  youtube:   { icon: 'fab fa-youtube',   label: 'YouTube' },
  twitter:   { icon: 'fab fa-twitter',   label: 'Twitter' },
  linkedin:  { icon: 'fab fa-linkedin',  label: 'LinkedIn' },
  tiktok:    { icon: 'fab fa-tiktok',    label: 'TikTok' },
  whatsapp:  { icon: 'fab fa-whatsapp',  label: 'WhatsApp' },
}

function Footer() {
  const socialRef = useRef(null)
  const [socialLinks, setSocialLinks] = useState([])

  // Load contact data
  useEffect(() => {
    fetch('/data/contact.json')
      .then((res) => res.json())
      .then((data) => {
        const sm = data.contact?.social_media
        if (!sm || typeof sm !== 'object') return
        const links = Object.entries(sm)
          .filter(([, url]) => url)
          .map(([key, url]) => ({
            key,
            url,
            className: key,
            icon: SOCIAL_META[key]?.icon || 'fas fa-link',
            label: SOCIAL_META[key]?.label || key.charAt(0).toUpperCase() + key.slice(1),
          }))
        setSocialLinks(links)
      })
      .catch((err) => console.error('Error loading contact:', err))
  }, [])

  // Auto-cycle the border animation on mobile
  useEffect(() => {
    if (socialLinks.length === 0) return
    const mq = window.matchMedia('(max-width: 600px)')
    let timer

    function start() {
      if (!mq.matches) return
      const items = socialRef.current?.querySelectorAll('li')
      if (!items?.length) return
      let idx = 0

      timer = setInterval(() => {
        items.forEach((li) => li.classList.remove('active'))
        items[idx].classList.add('active')
        idx = (idx + 1) % items.length
      }, 2000)
    }

    function stop() {
      clearInterval(timer)
      socialRef.current?.querySelectorAll('li').forEach((li) => li.classList.remove('active'))
    }

    function handleChange() {
      stop()
      start()
    }

    mq.addEventListener('change', handleChange)
    start()
    return () => { stop(); mq.removeEventListener('change', handleChange) }
  }, [socialLinks])

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About Dishari</h3>
            <p>
              Founded on January 15th, 2025, Dishari Boston Inc. is dedicated to
              preserving and promoting cultural heritage in the greater Boston
              area.
            </p>
          </div>
          <div className="footer-section footer-quick-links">
            <h3>Quick Links</h3>
            <ul>
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/events">Events</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>
          <div className="footer-section footer-follow">
            <h3>Follow Us</h3>
            {socialLinks.length > 0 && (
              <ul className="social-3d" ref={socialRef}>
                {socialLinks.map((link) => (
                  <li key={link.key}>
                    <a className={link.className} href={link.url} aria-label={link.label} target="_blank" rel="noopener noreferrer">
                      <span></span><span></span><span></span><span></span>
                      <span className={link.icon}></span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Dishari Boston Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
