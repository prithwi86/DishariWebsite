import { useState, useEffect, useRef, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { stripCommentedFields } from '../utils/jsonHelper'

// Generate repeatable pseudo-random angles for cards
const ANGLES = [4, -8, -7, 11, 13, -17, 20, -5, 9, -12]
const AUTO_INTERVAL = 5000

function PressRelease() {
  const [releases, setReleases] = useState([])
  const [active, setActive] = useState(0)
  const [headerText, setHeaderText] = useState('Press Room')
  const paused = useRef(false)

  useEffect(() => {
    fetch('/data/home-page.json')
      .then((res) => res.json())
      .then((raw) => stripCommentedFields(raw))
      .then((homeData) => {
        const prConfig = homeData.body?.press_releases || {}
        if (prConfig.header_text) setHeaderText(prConfig.header_text)
        return fetch('/data/press_release.json')
      })
      .then((res) => res.json())
      .then((raw) => stripCommentedFields(raw))
      .then((data) => {
        const items = (data.press_releases || []).filter(
          (pr) => pr.description && pr.summary && pr.images?.length > 0
        )
        setReleases(items)
      })
      .catch((err) => console.error('Error loading press releases:', err))
  }, [])

  // Auto-rotate
  useEffect(() => {
    if (releases.length < 2) return
    const id = setInterval(() => {
      if (!paused.current) {
        setActive((prev) => (prev + 1) % releases.length)
      }
    }, AUTO_INTERVAL)
    return () => clearInterval(id)
  }, [releases.length])

  if (releases.length === 0) return null

  const count = releases.length

  return (
    <section
      className="press-release-section"
      id="press-room"
      onMouseEnter={() => { paused.current = true }}
      onMouseLeave={() => { paused.current = false }}
      onTouchStart={() => { paused.current = true }}
      onTouchEnd={() => { paused.current = false }}
    >
      <div className="container">
        <h2>{headerText}</h2>
        <div className="pr-cards">
          {releases.map((pr, idx) => {
            const prevIdx = idx === 0 ? count - 1 : idx - 1
            const nextIdx = idx === count - 1 ? 0 : idx + 1
            const angle = ANGLES[idx % ANGLES.length]

            return (
              <Fragment key={pr.id}>
                <input
                  type="radio"
                  id={`pr-radio-${idx + 1}`}
                  name="pr-radio-card"
                  checked={active === idx}
                  onChange={() => setActive(idx)}
                />
                <article className="pr-card" style={{ '--angle': `${angle}deg` }}>
                  <img className="pr-card-img" src={pr.images[0]} alt={pr.description} />
                  <div className="pr-card-data">
                    <span className="pr-card-num">{idx + 1}/{count}</span>
                    <h3><Link to={`/press/${pr.id}`}>{pr.description}</Link></h3>
                    <p>{pr.summary}</p>
                    <footer>
                      <label
                        aria-label="Previous"
                        onClick={() => setActive(prevIdx)}
                      >&#10094;</label>
                      <label
                        aria-label="Next"
                        onClick={() => setActive(nextIdx)}
                      >&#10095;</label>
                    </footer>
                  </div>
                </article>
              </Fragment>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default PressRelease
