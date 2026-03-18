import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchImagesByTag, cloudinaryUrl } from '../utils/cloudinary'

const CAROUSEL_TAG = 'carousel'

function Carousel() {
  const [images, setImages] = useState([])   // array of { public_id, format }
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    fetchImagesByTag(CAROUSEL_TAG)
      .then((resources) => {
        if (resources.length > 0) {
          setImages(resources)
        } else {
          console.warn('No images found with tag:', CAROUSEL_TAG)
        }
      })
      .catch((err) => console.error('Error loading carousel images:', err))
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
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

  if (images.length === 0) {
    return (
      <section className="carousel-section">
        <div className="container">
          <h2>Moments from Our Events</h2>
          <div className="carousel-container">
            <div className="carousel-wrapper">
              <div className="carousel">
                <div className="carousel-item fade active">
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background:
                        'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                      color: '#666',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <i
                        className="fas fa-image"
                        style={{
                          fontSize: '3rem',
                          marginBottom: '1rem',
                          display: 'block',
                        }}
                      ></i>
                      <p style={{ fontSize: '1.2rem' }}>Loading images...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="carousel-section">
      <div className="container">
        <h2>Moments from Our Events</h2>
        <div className="carousel-container">
          <div className="carousel-wrapper">
            <div className="carousel">
              {images.map((resource, index) => (
                <div
                  key={resource.public_id}
                  className={`carousel-item fade${index === currentIndex ? ' active' : ''}`}
                >
                  <img
                    src={cloudinaryUrl(resource.public_id, { width: 1200 })}
                    alt={`Event image ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              className="carousel-control prev"
              onClick={() => changeSlide(-1)}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button
              className="carousel-control next"
              onClick={() => changeSlide(1)}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
          <div className="carousel-indicators">
            {images.map((_, index) => (
              <span
                key={index}
                className={`indicator${index === currentIndex ? ' active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Carousel
