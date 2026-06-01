import { useState, useEffect } from 'react'
import UpcomingEventCard from '../components/UpcomingEventCard'
import AnimateOnScroll from '../components/AnimateOnScroll'
import { stripCommentedFields } from '../utils/jsonHelper'

function UpcomingEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/data/upcoming-events.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load events')
        return res.json()
      })
      .then((raw) => stripCommentedFields(raw))
      .then((data) => {
        const sortedEvents = (data.events || [])
          .filter((ev) => ev.id && ev.id.trim() !== '')
          .sort((a, b) => {
            const orderA = typeof a.order === 'number' ? a.order : Infinity
            const orderB = typeof b.order === 'number' ? b.order : Infinity
            if (orderA !== orderB) return orderA - orderB
            return (a.id || '').localeCompare(b.id || '')
          })
        setEvents(sortedEvents)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading events:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <>
      {/* Page Header */}
      <section className="donate-header-section">
        <div className="donate-header">
          <div className="container">
            <AnimateOnScroll>
              <h1 className="donate-title">Upcoming Events</h1>
              <p className="donate-description">Join Us for Community Celebrations</p>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="upcoming-events-section">
        <div className="container">
          {loading && <p>Loading events...</p>}
          {error && <p className="error-message">Error loading events: {error}</p>}
          {!loading && !error && events.length === 0 && (
            <p>No upcoming events at this time.</p>
          )}
          {!loading && !error && events.length > 0 && (
            <div className="upcoming-events-grid">
              {events.map((event) => (
                <UpcomingEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default UpcomingEvents
