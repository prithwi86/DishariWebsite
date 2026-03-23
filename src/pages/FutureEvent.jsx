import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

function EmbedBlock({ html }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !html) return
    containerRef.current.innerHTML = html

    // Execute any <script> tags in the embed
    const scripts = containerRef.current.querySelectorAll('script')
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script')
      ;[...oldScript.attributes].forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value)
      )
      newScript.textContent = oldScript.textContent
      oldScript.parentNode.replaceChild(newScript, oldScript)
    })
  }, [html])

  return (
    <div className="future-event-embed">
      <h2>Register for this Event</h2>
      <div className="future-event-embed-frame" ref={containerRef} />
    </div>
  )
}

function FutureEvent() {
  const [event, setEvent] = useState(null)

  useEffect(() => {
    fetch('/data/future-event.json')
      .then((res) => res.json())
      .then((data) => setEvent(data.event || null))
      .catch((err) => console.error('Error loading future event:', err))
  }, [])

  if (!event) return null

  return (
    <>
      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h1>{event.title}</h1>
          {event.date && <p>{event.date}</p>}
        </div>
      </section>

      {/* Banner */}
      {event.banner && (
        <section className="future-event-banner-section">
          <div className="container">
            <div className="future-event-banner">
              <img src={event.banner} alt={event.title} />
            </div>
          </div>
        </section>
      )}

      {/* Event Info */}
      <section className="future-event-info">
        <div className="container">
          {event.description && (
            <div className="future-event-description">
              <p>{event.description}</p>
            </div>
          )}

          {(event.date || event.time || event.venue) && (
            <div className="future-event-details">
              {event.date && (
                <div className="future-event-detail">
                  <i className="fas fa-calendar-alt"></i>
                  <div>
                    <strong>Date</strong>
                    <span>{event.date}</span>
                  </div>
                </div>
              )}
              {event.time && (
                <div className="future-event-detail">
                  <i className="fas fa-clock"></i>
                  <div>
                    <strong>Time</strong>
                    <span>{event.time}</span>
                  </div>
                </div>
              )}
              {event.venue && (
                <div className="future-event-detail">
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <strong>Venue</strong>
                    <span>{event.venue}</span>
                    {event.address && (
                      <span className="future-event-address">
                        {event.address}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {event.highlights && event.highlights.length > 0 && (
            <div className="future-event-highlights">
              <h2>Event Highlights</h2>
              <ul>
                {event.highlights.map((item, i) => (
                  <li key={i}>
                    <i className="fas fa-check-circle"></i>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {event.registrationUrl && (
            <div className="future-event-cta">
              <a
                href={event.registrationUrl}
                className="btn btn-large"
                target="_blank"
                rel="noopener noreferrer"
              >
                Register Now
              </a>
            </div>
          )}

          {event.embedUrl && (
            <div className="future-event-embed">
              <h2>Register for this Event</h2>
              <div className="future-event-embed-frame">
                <iframe
                  src={event.embedUrl}
                  title="Event Registration"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {event.embedHtml && !event.embedUrl && (
            <EmbedBlock html={event.embedHtml} />
          )}

          {!event.banner && !event.date && (
            <div className="future-event-placeholder">
              <i className="fas fa-calendar-plus"></i>
              <p>Details coming soon. Stay tuned!</p>
              <Link to="/contact" className="btn">
                Get Notified
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default FutureEvent
