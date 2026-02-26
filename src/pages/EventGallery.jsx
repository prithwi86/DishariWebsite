import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { proxyImageUrl } from '../utils/proxyImage'

function EventGallery() {
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('event')

  const [event, setEvent] = useState(null)
  const [items, setItems] = useState([])
  const [renderedCount, setRenderedCount] = useState(0)

  useEffect(() => {
    if (!eventId) return

    fetch('/data/past-events.json')
      .then((res) => res.json())
      .then((data) => {
        const found = (data.events || []).find((e) => e.id === eventId)
        if (!found) return

        setEvent(found)

        const allItems = []
        const images = Array.isArray(found.images) ? found.images : []
        const videos = Array.isArray(found.videos) ? found.videos : []

        images
          .filter((url) => url && url !== found.banner)
          .forEach((url) => allItems.push({ type: 'image', url }))

        videos.forEach((url) => allItems.push({ type: 'video', url }))

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

  return (
    <section className="event-gallery-section">
      <div className="container">
        {event.banner && (
          <div className="event-gallery-banner">
            <img
              src={proxyImageUrl(event.banner)}
              alt={event.title || 'Event banner'}
              onError={(e) => {
                e.target.src = event.banner
              }}
            />
          </div>
        )}

        <div className="event-gallery-grid">
          {visibleItems.map((item, index) =>
            item.type === 'image' ? (
              <img
                key={index}
                src={proxyImageUrl(item.url)}
                alt={event.title || 'Event image'}
                loading="lazy"
                onError={(e) => {
                  e.target.src = item.url
                }}
              />
            ) : (
              <video key={index} src={item.url} controls preload="none" />
            )
          )}
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
    </section>
  )
}

export default EventGallery
