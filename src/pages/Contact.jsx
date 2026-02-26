import { useState } from 'react'
import AnimateOnScroll from '../components/AnimateOnScroll'

const waysToHelp = [
  {
    icon: 'fas fa-handshake',
    title: 'Volunteer',
    text: 'Join our volunteer team and help organize events, mentor youth, and support community activities.',
  },
  {
    icon: 'fas fa-heart',
    title: 'Donate',
    text: 'Your contributions help us organize cultural events and support our community programs.',
  },
  {
    icon: 'fas fa-users',
    title: 'Attend Events',
    text: 'Participate in our events and bring your family and friends to celebrate our culture.',
  },
  {
    icon: 'fas fa-megaphone',
    title: 'Spread the Word',
    text: 'Help us reach more people by sharing our mission with your network.',
  },
]

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const { name, email, subject, message } = formData

    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      alert('Please fill in all required fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.')
      return
    }

    alert('Thank you for your message! We will get back to you soon.')
    console.log(formData)
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
  }

  return (
    <>
      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h1>Contact Us</h1>
          <p>Get in Touch with Dishari Boston</p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Get in Touch</h2>
              <p>
                We&apos;d love to hear from you! Whether you have questions, want
                to volunteer, or are interested in supporting our mission, please
                reach out.
              </p>

              <div className="contact-details">
                <div className="detail-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <h3>Location</h3>
                    <p>
                      Greater Boston Area
                      <br />
                      Massachusetts, USA
                    </p>
                  </div>
                </div>
                <div className="detail-item">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <h3>Email</h3>
                    <p>
                      <a href="mailto:info@disharibostonorg">
                        info@disharibostonorg
                      </a>
                    </p>
                  </div>
                </div>
                <div className="detail-item">
                  <i className="fas fa-phone"></i>
                  <div>
                    <h3>Phone</h3>
                    <p>
                      <a href="tel:+1234567890">(123) 456-7890</a>
                    </p>
                  </div>
                </div>
              </div>

              <h3 style={{ marginTop: '2rem' }}>Follow Us</h3>
              <div className="social-links-large">
                <a href="#" className="social-icon">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="social-icon">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="social-icon">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="social-icon">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>

            <div className="contact-form-section">
              <h2>Send us a Message</h2>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a subject...</option>
                    <option value="event">Event Inquiry</option>
                    <option value="volunteer">Volunteer Opportunity</option>
                    <option value="donation">Support &amp; Donation</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="general">General Question</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Ways to Help */}
      <section className="ways-to-help">
        <div className="container">
          <h2>Ways to Get Involved</h2>
          <div className="help-grid">
            {waysToHelp.map((item) => (
              <AnimateOnScroll key={item.title} className="help-card">
                <i className={item.icon}></i>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Contact
