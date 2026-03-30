import { useState, useEffect, useRef, useCallback } from 'react'
import { stripCommentedFields } from '../utils/jsonHelper'

function Testimonials() {
  const [testimonials, setTestimonials] = useState([])
  const carouselRef = useRef(null)
  const pausedRef = useRef(false)

  useEffect(() => {
    fetch('/data/home-page.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((raw) => stripCommentedFields(raw))
      .then((data) => {
        const items = data.body?.testimonials
        if (!Array.isArray(items)) return
        const valid = items.filter(
          (t) => t && typeof t.text === 'string' && t.text.trim()
        )
        setTestimonials(valid)
      })
      .catch((err) => console.error('Error loading testimonials:', err))
  }, [])

  // Auto-scroll every 4 seconds, pause on hover
  useEffect(() => {
    if (testimonials.length < 2) return
    const el = carouselRef.current
    if (!el) return

    let currentIndex = Math.floor(testimonials.length / 2)

    const interval = setInterval(() => {
      if (pausedRef.current) return
      const blockquotes = el.querySelectorAll('blockquote')
      if (!blockquotes.length) return
      currentIndex = (currentIndex + 1) % blockquotes.length
      const target = blockquotes[currentIndex]
      el.scrollTo({
        left: target.offsetLeft - el.offsetLeft - (el.clientWidth - target.offsetWidth) / 2,
        behavior: 'smooth',
      })
    }, 4000)

    const pause = () => { pausedRef.current = true }
    const resume = () => { pausedRef.current = false }
    el.addEventListener('mouseenter', pause)
    el.addEventListener('mouseleave', resume)
    el.addEventListener('touchstart', pause, { passive: true })
    el.addEventListener('touchend', resume)

    return () => {
      clearInterval(interval)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
      el.removeEventListener('touchstart', pause)
      el.removeEventListener('touchend', resume)
    }
  }, [testimonials])

  if (testimonials.length === 0) return null

  const startIndex = Math.floor(testimonials.length / 2)

  return (
    <section className="testimonials-section">
      <div className="container">
        <h2>What others are saying about us.....</h2>
        <p className="msg-supports">
          Sorry, your browser doesn&rsquo;t support <code>::scroll-*</code>
        </p>
        <section className="testimonials-carousel" ref={carouselRef}>
          {testimonials.map((item, index) => (
            <blockquote
              key={index}
              className={index === startIndex ? 'scroll-start' : undefined}
            >
              <div>
                <p>&ldquo;{item.text}&rdquo;</p>
                <cite>— {item.name || 'Anonymous'}</cite>
              </div>
            </blockquote>
          ))}
        </section>
      </div>
    </section>
  )
}

export default Testimonials