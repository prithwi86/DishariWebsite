import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

function Footer() {
  const socialRef = useRef(null)

  // Auto-cycle the border animation on mobile
  useEffect(() => {
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
  }, [])
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
            <ul className="social-3d" ref={socialRef}>
              <li>
                <a className="facebook" href="https://www.facebook.com/share/1NFtd3CcXq/" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                  <span></span><span></span><span></span><span></span>
                  <span className="fab fa-facebook"></span>
                </a>
              </li>
              <li>
                <a className="instagram" href="https://www.instagram.com/disharinp?igsh=cHgyY3gxeGRvcTl1" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <span></span><span></span><span></span><span></span>
                  <span className="fab fa-instagram"></span>
                </a>
              </li>
              <li>
                <a className="youtube" href="https://youtube.com/@dishariboston?si=ae7FiTA-iAJQK4VM" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                  <span></span><span></span><span></span><span></span>
                  <span className="fab fa-youtube"></span>
                </a>
              </li>
            </ul>
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
