import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AnimateOnScroll from '../components/AnimateOnScroll'

/*
const featuredEvents = [
  {
    icon: 'fas fa-lightbulb',
    badge: 'Festival',
    title: 'Diwali Celebration',
    description:
      'Join us for the Festival of Lights! Experience the joy of Diwali with traditional performances, authentic cuisine, and cultural activities for the entire family.',
    when: 'November',
  },
  {
    icon: 'fas fa-music',
    badge: 'Music',
    title: 'Holi - Festival of Colors',
    description:
      'Celebrate the arrival of spring with vibrant colors, traditional music, and joyful gatherings. Experience the essence of Holi through art, dance, and community spirit.',
    when: 'March',
  },
  {
    icon: 'fas fa-theater-masks',
    badge: 'Cultural',
    title: 'Classical Dance Performances',
    description:
      'Witness traditional Indian classical dance forms including Bharatanatyam, Kathak, and Odissi performed by talented artists from our community.',
    when: 'Throughout the Year',
  },
  {
    icon: 'fas fa-utensils',
    badge: 'Food',
    title: 'Cultural Potluck & Food Festival',
    description:
      'Enjoy authentic South Asian cuisine and share your favorite dishes. A wonderful opportunity to taste traditional recipes and learn about diverse culinary traditions.',
    when: 'Quarterly',
  },
  {
    icon: 'fas fa-graduation-cap',
    badge: 'Educational',
    title: 'Heritage & Craft Workshops',
    description:
      'Learn traditional arts and crafts including mehndi application, traditional embroidery, and other cultural techniques passed down through generations.',
    when: 'Monthly',
  },
  {
    icon: 'fas fa-children',
    badge: 'Youth',
    title: 'Youth Cultural Programs',
    description:
      'Special programs designed for young community members to learn about their heritage, connect with peers, and develop cultural pride and identity.',
    when: 'Regular Basis',
  },
]
*/

const eventFeatures = [
  {
    icon: 'fas fa-music',
    title: 'Live Music & Dance',
    text: 'Traditional performances featuring classical and contemporary Indian music and dance.',
  },
  {
    icon: 'fas fa-utensils',
    title: 'Authentic Cuisine',
    text: 'Delicious South Asian food prepared with traditional recipes and fresh ingredients.',
  },
  {
    icon: 'fas fa-people-group',
    title: 'Community Connection',
    text: 'Meet families and friends while celebrating our shared cultural heritage.',
  },
  {
    icon: 'fas fa-heart',
    title: 'Cultural Exchange',
    text: 'Learn and share about diverse South Asian traditions and contemporary expressions.',
  },
]

function Events() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetch('/data/past-events.json')
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch((err) => console.error('Error loading events:', err))
  }, [])

  return (
    <>
      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h1>Our Events</h1>
          <p>Celebrate Indian Cultural Festivals with Us</p>
        </div>
      </section>

      {/* Events Introduction */}
      <section className="events-intro">
        <div className="container">
          <h2>Vibrant Celebrations of Culture</h2>
          <p>
            Our annual events are vibrant celebrations of Indian cultural
            festivals that bring together families, friends, and the community at
            large. These are not just social gatherings but opportunities to
            experience the rich heritage and cultural traditions through music,
            drama, dance, ethnic attires, and food.
          </p>
        </div>
      </section>

      {/* Per-event sections: banner + honeycomb gallery */}
      {events.map((ev) => {
        const MAX_HEX = 20
        const allImages = ev.images || []
        const displayImages = allImages.slice(0, MAX_HEX)
        const hasMore = allImages.length > MAX_HEX

        return (
          <section key={ev.id} className="hex-gallery-section">
            <div className="container">
              <h2>{ev.title}</h2>

              {ev.banner && (
                <div className="hex-event-banner">
                  <img src={ev.banner} alt={ev.title} />
                </div>
              )}

              {displayImages.length > 0 && (
                <div className="hex-grid">
                  {displayImages.map((url, i) => (
                    <Link
                      key={i}
                      to={`/event-gallery?event=${ev.id}`}
                      className="hex-cell"
                    >
                      <img
                        src={url}
                        alt={ev.title}
                        className="hex-img"
                        loading="lazy"
                      />
                    </Link>
                  ))}
                </div>
              )}

              {hasMore && (
                <Link
                  to={`/event-gallery?event=${ev.id}`}
                  className="hex-view-all"
                >
                  View all {allImages.length} photos &rarr;
                </Link>
              )}
            </div>
          </section>
        )
      })}

      {/* Featured Events - commented out in favour of hex gallery */}
      {/*
      <section className="events-section">
        <div className="container">
          <h2>Featured Events</h2>
          <div className="events-grid">
            {featuredEvents.map((event) => (
              <AnimateOnScroll key={event.title} className="event-card">
                <div className="event-header">
                  <i className={event.icon}></i>
                  <span className="event-badge">{event.badge}</span>
                </div>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <div className="event-details">
                  <span>
                    <i className="fas fa-calendar"></i> {event.when}
                  </span>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* Event Features */}
      <section className="event-features">
        <div className="container">
          <h2>What to Expect</h2>
          <div className="features-grid">
            {eventFeatures.map((feature) => (
              <AnimateOnScroll key={feature.title} className="feature-item">
                <i className={feature.icon}></i>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <div className="container">
          <h2>Stay Updated</h2>
          <p>
            Don&apos;t miss our upcoming events! Subscribe to our newsletter for
            event announcements and updates.
          </p>
          <Link to="/contact" className="btn btn-large">
            Get Event Updates
          </Link>
        </div>
      </section>
    </>
  )
}

export default Events
