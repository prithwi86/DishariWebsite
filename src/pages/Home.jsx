import { Link } from 'react-router-dom'
import Carousel from '../components/Carousel'
import UpcomingEventBanner from '../components/UpcomingEventBanner'
import PastEvents from '../components/PastEvents'
import Testimonials from '../components/Testimonials'

function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero" id="bio_hero">
        <div className="hero-content">
          <h1>Welcome to Dishari Boston Inc.</h1>
          <p>Celebrating South Asian Heritage &amp; Building Community</p>
          <div className="hero-buttons">
            <Link to="/about" className="btn btn-primary">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Event Banner */}
      <UpcomingEventBanner />

      {/* Carousel */}
      <Carousel />

      {/* Past Events */}
      <PastEvents />

      {/* Testimonials */}
      <Testimonials />

      {/* Call to Action */}
      <section className="cta">
        <div className="container">
          <h2>Join Our Community</h2>
          <p>
            Be part of something special. Celebrate culture, build connections,
            and create memories.
          </p>
          <Link to="/contact" className="btn btn-large">
            Get In Touch
          </Link>
        </div>
      </section>
    </>
  )
}

export default Home
