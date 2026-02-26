import { useState, useEffect } from 'react'

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.pageYOffset > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      id="scrollToTopBtn"
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: 30,
        right: 30,
        backgroundColor: '#d4495c',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: 50,
        height: 50,
        fontSize: 24,
        cursor: 'pointer',
        display: visible ? 'block' : 'none',
        zIndex: 99,
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <i className="fas fa-arrow-up"></i>
    </button>
  )
}

export default ScrollToTopButton
