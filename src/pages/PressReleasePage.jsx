import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { stripCommentedFields } from '../utils/jsonHelper'

function PressReleasePage() {
  const { id } = useParams()
  const [pr, setPr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/press_release.json')
      .then((res) => res.json())
      .then((raw) => stripCommentedFields(raw))
      .then((data) => {
        const found = (data.press_releases || []).find((item) => item.id === id)
        setPr(found || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <section className="pr-page">
        <div className="container">
          <p>Loading...</p>
        </div>
      </section>
    )
  }

  if (!pr) {
    return (
      <section className="pr-page">
        <div className="container">
          <h1>Press Release Not Found</h1>
          <p>The press release you're looking for doesn't exist.</p>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </section>
    )
  }

  const formattedDate = new Date(pr.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <section className="pr-page">
      <div className="container">
        <Link to="/#press-room" className="pr-page-back">&larr; Back to Press Room</Link>

        <header className="pr-page-header">
          <time dateTime={pr.date}>{formattedDate}</time>
          <h1>{pr.header}</h1>
        </header>

        {pr.images && pr.images.length > 0 && (
          <div className="pr-page-images">
            {pr.images.map((src, i) => (
              <img key={i} src={src} alt={`${pr.description} - image ${i + 1}`} />
            ))}
          </div>
        )}

        <div className="pr-page-body">
          {(pr.text || []).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {pr.links && pr.links.length > 0 && (
          <div className="pr-page-links">
            <h3>Related Links</h3>
            <ul>
              {pr.links.map((link, i) => (
                <li key={i}>
                  {link.preceding_text}
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

export default PressReleasePage
