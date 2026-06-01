import { useNavigate } from 'react-router-dom'

function UpcomingEventCard({ event }) {
  const navigate = useNavigate()

  const handleViewEvent = () => {
    navigate(`/event/${event.id}`)
  }

  // Get banner image
  const bannerImage = event.banner

  return (
    <div className="upcoming-event-card" onClick={handleViewEvent} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleViewEvent()}>
      {bannerImage && (
        <div className="upcoming-event-banner">
          <img src={bannerImage} alt={event.title} />
        </div>
      )}
      <div className="upcoming-event-card-body">
        <h3>{event.title}</h3>
        {event.details?.date && (
          <p className="event-date">
            <i className="fas fa-calendar"></i> {event.details.date}
          </p>
        )}
        {event.details?.venue && (
          <p className="event-venue">
            <i className="fas fa-map-marker-alt"></i> {event.details.venue}
          </p>
        )}
      </div>
    </div>
  )
}

export default UpcomingEventCard
