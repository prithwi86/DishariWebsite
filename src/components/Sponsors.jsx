import { useState, useEffect } from 'react'

function Sponsors() {
  const [images, setImages] = useState([])

  useEffect(() => {
    fetch('/data/sponsors.json')
      .then((res) => res.json())
      .then((data) => {
        if (!data.images?.length) return
        Promise.all(
          data.images.map(
            (url) =>
              new Promise((resolve) => {
                const img = new Image()
                img.onload = () => resolve(url)
                img.onerror = () => resolve(null)
                img.src = url
              })
          )
        ).then((results) => {
          const valid = results.filter(Boolean)
          setImages(valid)
        })
      })
      .catch((err) => console.error('Error loading sponsors:', err))
  }, [])

  if (images.length === 0) return null

  const count = images.length
  const angle = 360 / count
  const cardWidth = 220
  const gap = 20
  const radius = Math.round((cardWidth + gap) / (2 * Math.tan(Math.PI / count)))

  return (
    <section className="sponsors-section">
      <div className="container">
        <h2>Our Sponsors</h2>
        <div className="sponsors-carousel-container">
          <div className="sponsors-carousel">
            {images.map((url, i) => (
              <div
                key={i}
                className="sponsors-carousel__face"
                style={{
                  backgroundImage: `url(${url})`,
                  transform: `rotateY(${angle * i}deg) translateZ(${radius}px)`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Sponsors
