import { Link } from 'react-router-dom'
import AnimateOnScroll from '../components/AnimateOnScroll'

function About() {
  return (
    <>
      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h1>About Dishari Boston Inc.</h1>
          <p>Our Story, Vision, and Commitment to Community</p>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <div className="about-content">
            <h2>Who We Are</h2>
            <p className="about-text">
              Founded on January 15th, 2025, Dishari is a dynamic nonprofit
              organization dedicated to preserving and promoting cultural
              heritage, fostering community well-being, and celebrating diversity
              among South Asian community in greater Boston area. Inspired by the
              values of inclusion, coexistence, resilience, and creativity,
              Dishari serves as a vibrant hub for cultural exchange, lifelong
              friendship, and communal growth.
            </p>
          </div>
        </div>
      </section>

      {/* Vision Statement */}
      <section className="statement-section vision-bg">
        <div className="container">
          <div className="statement-content">
            <i className="fas fa-eye"></i>
            <h2>Our Vision</h2>
            <p>
              To build a community that embodies respect, unity, culture,
              heritage, service and well-being, offering a place where traditions
              are honored, diversity is respected, and future generation is
              inspired in a supportive and respectful environment.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="statement-section mission-bg">
        <div className="container">
          <div className="statement-content">
            <i className="fas fa-heart"></i>
            <h2>Our Mission</h2>
            <p>
              At Dishari, we believe in the power of collective effort and shared
              dreams. Our events are designed to inspire collaboration among
              individuals, organizations, and institutions who share our vision
              of building a more connected and compassionate world. Our events
              are vibrant celebrations of Indian cultural festivals that bring
              together families, friends, and the community at large. These
              events are not only social gatherings but also an opportunity to
              experience the rich heritage and cultural traditions through music,
              drama, dance, ethnic attires and food. Our annual events serve as a
              testament to the enduring strength of our heritage and the unity of
              our community.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="core-values">
        <div className="container">
          <h2>Our Core Values</h2>
          <div className="values-detail-grid">
            {[
              {
                icon: 'fas fa-hands-holding-circle',
                title: 'Inclusion',
                text: 'We are committed to creating welcoming and inclusive spaces where every member of our community feels valued, heard, and respected, regardless of their background or beliefs.',
              },
              {
                icon: 'fas fa-link',
                title: 'Coexistence',
                text: 'We foster harmony and mutual understanding, believing that diverse perspectives strengthen our community and enrich our cultural experiences.',
              },
              {
                icon: 'fas fa-shield-heart',
                title: 'Resilience',
                text: 'We build strength through cultural preservation and community support, ensuring that our traditions endure while adapting to contemporary needs.',
              },
              {
                icon: 'fas fa-lightbulb',
                title: 'Creativity',
                text: 'We celebrate and support the artistic and cultural expressions of our community, from traditional performances to contemporary innovations.',
              },
            ].map((value) => (
              <AnimateOnScroll key={value.title} className="value-detail">
                <div className="value-icon">
                  <i className={value.icon}></i>
                </div>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact">
        <div className="container">
          <h2>Our Impact</h2>
          <div className="impact-grid">
            {[
              {
                title: 'Cultural Preservation',
                text: 'Maintaining and promoting Indian cultural traditions in the Boston area',
              },
              {
                title: 'Community Building',
                text: 'Creating meaningful connections and lifelong friendships among community members',
              },
              {
                title: 'Cultural Exchange',
                text: 'Facilitating dialogue and understanding between diverse communities',
              },
              {
                title: 'Youth Engagement',
                text: 'Inspiring and mentoring the next generation to value their heritage',
              },
            ].map((item) => (
              <AnimateOnScroll key={item.title} className="impact-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <div className="container">
          <h2>Get Involved</h2>
          <p>
            We welcome volunteers, donors, and community members who share our
            vision.
          </p>
          <Link to="/contact" className="btn btn-large">
            Contact Us
          </Link>
        </div>
      </section>
    </>
  )
}

export default About
