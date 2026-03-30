import { useState, useEffect, useCallback, useRef } from 'react'
import { stripCommentedFields } from '../utils/jsonHelper'

function UpcomingEventBanner() {
  const [images, setImages] = useState([])
  const [headerText, setHeaderText] = useState('Upcoming Events')
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetch('/data/home-page.json')
      .then((res) => res.json())
      .then((raw) => stripCommentedFields(raw))
      .then((data) => {
        if (cancelled) return
        const section = data?.body?.upcoming_events || {}
        if (section.header_text) setHeaderText(section.header_text)
        const urls = (section.img_urls?.urls || [])
          .filter((url) => typeof url === 'string' && url.trim().length > 0)
          .map((url, i) => ({ id: `upcoming-${i}`, src: url }))
        setImages(urls)
      })
      .catch((err) => console.error('Error loading upcoming events:', err))
    return () => { cancelled = true }
  }, [])

  const startAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (images.length <= 1) return
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)
  }, [images.length])

  useEffect(() => {
    startAutoplay()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [startAutoplay])

  const changeSlide = (delta) => {
    setCurrentIndex((prev) => {
      let next = prev + delta
      if (next >= images.length) next = 0
      if (next < 0) next = images.length - 1
      return next
    })
    startAutoplay()
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
    startAutoplay()
  }

  if (images.length === 0) return null

  return (
    <section className="upcoming-event-section">
      <div className="container">
        <h2>{headerText}</h2>
        <div className="carousel-container">
          <div className="carousel-wrapper">
            <div className="carousel">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={`carousel-item fade${index === currentIndex ? ' active' : ''}`}
                >
                  <img
                    src={image.src}
                    alt={`${headerText} ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <>
                <button className="carousel-control prev" onClick={() => changeSlide(-1)}>
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button className="carousel-control next" onClick={() => changeSlide(1)}>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="carousel-indicators">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`indicator${index === currentIndex ? ' active' : ''}`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default UpcomingEventBanner
