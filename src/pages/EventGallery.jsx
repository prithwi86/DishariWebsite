import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Lightbox from '../components/Lightbox'
import { stripCommentedFields } from '../utils/jsonHelper'

function EventGallery() {
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('event')

  const [event, setEvent] = useState(null)
  const [items, setItems] = useState([])
  const [renderedCount, setRenderedCount] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    if (!eventId) return

    fetch('/data/past-events.json')
      .then((res) => res.json())
      .then((raw) => stripCommentedFields(raw))
      .then((data) => {
        const found = (data.events || []).find((e) => e.id === eventId)
        if (!found) return

        setEvent(found)

        const allItems = []
        const images = Array.isArray(found.images) ? found.images : []

        images
          .filter((url) => url && url !== found.banner)
          .forEach((url) => allItems.push({ type: 'image', url }))

        setItems(allItems)
        // Show initial batch
        setRenderedCount(Math.min(12, allItems.length))
      })
      .catch((err) => console.error('Error loading event gallery:', err))
  }, [eventId])

  const loadMore = useCallback(() => {
    setRenderedCount((prev) => Math.min(prev + 12, items.length))
  }, [items.length])

  if (!event) {
    return (
      <section className="event-gallery-section">
        <div className="container">
          <p style={{ textAlign: 'center', padding: '2rem' }}>
            Loading event gallery...
          </p>
        </div>
      </section>
    )
  }

  const visibleItems = items.slice(0, renderedCount)

  const openLightbox = (index) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const goNext = () => setLightboxIndex((prev) => (prev + 1) % items.length)
  const goPrev = () => setLightboxIndex((prev) => (prev - 1 + items.length) % items.length)

  return (
    <section className="event-gallery-section">
      <div className="container">
        {event.banner && (
          <div className="event-gallery-banner">
            <img
              src={event.banner}
              alt={event.title || 'Event banner'}
            />
          </div>
        )}

        <div className="hex-grid">
          {visibleItems.map((item, index) => (
            <div
              key={index}
              className="hex-cell"
              onClick={() => openLightbox(index)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={item.url}
                alt={event.title || 'Event image'}
                className="hex-img"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {renderedCount < items.length && (
          <div className="event-gallery-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={loadMore}
            >
              Load More
            </button>
          </div>
        )}
      </div>

      <Lightbox
        items={items}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNext={goNext}
        onPrev={goPrev}
      />
    </section>
  )
}

export default EventGallery
