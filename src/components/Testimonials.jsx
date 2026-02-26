import { useState, useEffect } from 'react'

function Testimonials() {
  const [testimonials, setTestimonials] = useState([])

  useEffect(() => {
    fetch('/data/testimonials.json')
      .then((res) => res.json())
      .then((data) => setTestimonials(data.testimonials || []))
      .catch((err) => console.error('Error loading testimonials:', err))
  }, [])

  if (testimonials.length === 0) return null

  return (
    <section className="testimonials-section">
      <div className="container">
        <h2>Testimonials</h2>
        <div className="testimonials-grid">
          {testimonials.map((item, index) => (
            <div className="testimonial-card" key={index}>
              <p>{item.text}</p>
              <div className="testimonial-name">
                {item.name || 'Anonymous'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
