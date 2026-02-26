import { useState, useEffect } from 'react'
import { proxyImageUrl } from '../utils/proxyImage'

function UpcomingEventBanner() {
  const [imageUrl, setImageUrl] = useState(null)
  const [alt, setAlt] = useState('Upcoming event banner')

  useEffect(() => {
    fetch('/data/upcoming-event.json')
      .then((res) => res.json())
      .then((data) => {
        const url = (data.images || [])[0]
        if (url) {
          setImageUrl(url)
          if (data.alt) setAlt(data.alt)
        }
      })
      .catch((err) => console.error('Error loading upcoming event:', err))
  }, [])

  if (!imageUrl) return null

  return (
    <section className="upcoming-event-section">
      <div className="container">
        <h2>Upcoming Event</h2>
        <div className="upcoming-event-banner">
          <img
            src={proxyImageUrl(imageUrl)}
            alt={alt}
            onError={(e) => {
              e.target.src = imageUrl
            }}
          />
        </div>
      </div>
    </section>
  )
}

export default UpcomingEventBanner
