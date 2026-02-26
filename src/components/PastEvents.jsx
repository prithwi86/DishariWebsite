import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { proxyImageUrl } from '../utils/proxyImage'

function PastEventCard({ event }) {
  const [currentSrc, setCurrentSrc] = useState(
    event.banner ? proxyImageUrl(event.banner) : ''
  )
  const timerRef = useRef(null)
  const indexRef = useRef(0)

  const images = event.images || []

  const startSlideshow = () => {
    if (images.length === 0 || timerRef.current) return
    timerRef.current = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % images.length
      setCurrentSrc(proxyImageUrl(images[indexRef.current]))
    }, 1200)
  }

  const stopSlideshow = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    indexRef.current = 0
    if (event.banner) {
      setCurrentSrc(proxyImageUrl(event.banner))
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (!event.banner) return null

  return (
    <Link
      to={`/event-gallery?event=${event.id}`}
      className="past-event-row"
      onMouseEnter={startSlideshow}
      onMouseLeave={stopSlideshow}
    >
      <div className="past-event-media">
        <img
          src={currentSrc}
          alt={event.title || 'Past event'}
          onError={(e) => {
            e.target.src = event.banner
          }}
        />
      </div>
    </Link>
  )
}

function PastEvents() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetch('/data/past-events.json')
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch((err) => console.error('Error loading past events:', err))
  }, [])

  if (events.length === 0) return null

  return (
    <section className="past-events-section">
      <div className="container">
        <h2>Past Events</h2>
        <div className="past-events-list">
          {events.map((event) => (
            <PastEventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default PastEvents
