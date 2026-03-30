import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { stripCommentedFields } from '../utils/jsonHelper'

function PastEventCard({ event }) {
  const [currentSrc, setCurrentSrc] = useState(event.banner || '')
  const timerRef = useRef(null)
  const indexRef = useRef(0)

  const images = event.images || []

  const startSlideshow = () => {
    if (images.length === 0 || timerRef.current) return
    timerRef.current = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % images.length
      setCurrentSrc(images[indexRef.current])
    }, 1200)
  }

  const stopSlideshow = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    indexRef.current = 0
    if (event.banner) {
      setCurrentSrc(event.banner)
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
        />
      </div>
      <div className="past-event-title">{event.title}</div>
    </Link>
  )
}

function PastEvents() {
  const [events, setEvents] = useState([])
  const [headerText, setHeaderText] = useState('Past Events')

  useEffect(() => {
    fetch('/data/home-page.json')
      .then((res) => res.json())
      .then((raw) => stripCommentedFields(raw))
      .then((homeData) => {
        const pastConfig = homeData.body?.past_events || {}
        if (pastConfig.header_text) setHeaderText(pastConfig.header_text)
        const jsonFile = pastConfig.json_file || 'past-events.json'
        return fetch(`/data/${jsonFile}`)
      })
      .then((res) => res.json())
      .then((raw) => stripCommentedFields(raw))
      .then((data) => setEvents(data.events || []))
      .catch((err) => console.error('Error loading past events:', err))
  }, [])

  if (events.length === 0) return null

  return (
    <section className="past-events-section">
      <div className="container">
        <h2>{headerText}</h2>
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
