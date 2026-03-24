import { useState, useEffect } from 'react'

function UpcomingEventBanner() {
  const [bannerUrl, setBannerUrl] = useState(null)

  useEffect(() => {
    fetch('/data/upcoming-events.json')
      .then((res) => res.json())
      .then((data) => {
        if (data.banner) {
          setBannerUrl(data.banner)
        }
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
