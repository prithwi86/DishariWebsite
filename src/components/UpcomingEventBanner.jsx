import { useState, useEffect } from 'react'

function UpcomingEventBanner() {
  const [bannerUrl, setBannerUrl] = useState(null)

  useEffect(() => {
    fetch('/data/upcoming-events.json')
      .then((res) => res.json())
      .then((data) => {
        const events = (data.events || [])
          .filter((ev) => ev.id && ev.id.trim() !== '')
          .sort((a, b) => {
            const orderA = typeof a.order === 'number' ? a.order : Infinity
            const orderB = typeof b.order === 'number' ? b.order : Infinity
            if (orderA !== orderB) return orderA - orderB
            return (a.id || '').localeCompare(b.id || '')
          })
        if (events.length === 0) return

        const first = events[0]
        const banner = first.banner
          || (first.details?.img_urls?.length > 0 ? first.details.img_urls[0] : null)
        if (banner) setBannerUrl(banner)
      })
      .catch((err) => console.error('Error loading upcoming events:', err))
  }, [])

  if (!bannerUrl) return null

  return (
    <section className="upcoming-event-section">
      <div className="container">
        <h2>Upcoming Event</h2>
        <div className="upcoming-event-banner">
          <img
            src={bannerUrl}
            alt="Upcoming event banner"
          />
        </div>
      </div>
    </section>
  )
}

export default UpcomingEventBanner
