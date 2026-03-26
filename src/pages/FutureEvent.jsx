import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import Lightbox from '../components/Lightbox'

function FutureEvent() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [embedOpen, setEmbedOpen] = useState(false)
  const [embedHeight, setEmbedHeight] = useState(900)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [videoModal, setVideoModal] = useState(null) // embed URL string or null
  const embedRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    fetch('/data/upcoming-events.json')
      .then((res) => res.json())
      .then((data) => {
        const found = (data.events || []).find((ev) => ev.id === id)
        setEvent(found || null)
      })
      .catch((err) => console.error('Error loading event:', err))
      .finally(() => setLoading(false))
  }, [id])

  // Scroll embed into view when opened
  useEffect(() => {
    if (embedOpen && embedRef.current) {
      embedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [embedOpen])

  // Listen for postMessage from Zeffy iframe to dynamically resize
  useEffect(() => {
    if (!embedOpen) return
    const handleMessage = (e) => {
      let height = null
      if (e.data && typeof e.data === 'object') {
        height = e.data.height || e.data.frameHeight
      } else if (typeof e.data === 'string') {
        try {
          const parsed = JSON.parse(e.data)
          height = parsed.height || parsed.frameHeight
        } catch { /* not JSON */ }
      }
      if (typeof height === 'number' && height > 100 && height < 10000) {
        setEmbedHeight(height)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [embedOpen])

  if (loading) return null

  if (!event) {
    return (
      <section className="page-header">
        <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <i className="fas fa-calendar-times" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
          <h1>Event Not Found</h1>
          <p style={{ margin: '1rem 0', color: 'var(--text-muted, #666)' }}>
            This event doesn&rsquo;t exist or has been removed.
          </p>
          <Link to="/" className="btn">Back to Home</Link>
        </div>
      </section>
    )
  }

  const details = event.details || {}
  const description = details.description || []
  const imgUrls = details.img_urls || []
  const videoUrls = details.video_urls || []
  const registrations = details.registrations || []
  const lightboxItems = imgUrls.map((url) => ({ url, type: 'image' }))

  /**
   * Convert a social media URL into an embeddable iframe src.
   * Supports: Facebook reels/videos, YouTube (watch, shorts, youtu.be), Instagram reels.
   * Returns null if the URL isn't recognized.
   */
  const getEmbedUrl = (url) => {
    try {
      const u = new URL(url)

      // Facebook — always open in new tab (embeds are unreliable)
      if (u.hostname.includes('facebook.com')) {
        return null
      }

      // YouTube watch
      if ((u.hostname.includes('youtube.com')) && u.searchParams.get('v')) {
        return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
      }

      // YouTube shorts
      const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/)
      if (u.hostname.includes('youtube.com') && shortsMatch) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}`
      }

      // youtu.be short links
      if (u.hostname === 'youtu.be') {
        return `https://www.youtube.com/embed${u.pathname}`
      }

      // Instagram reel / post
      if (u.hostname.includes('instagram.com')) {
        const clean = u.pathname.replace(/\/$/, '')
        return `https://www.instagram.com${clean}/embed`
      }
    } catch { /* invalid URL */ }
    return null
  }

  // Determine primary registration
  const primaryReg = registrations[0] || null

  // Extract iframe src URL from an HTML snippet or return as-is if already a URL
  const getEmbedFormUrl = (val) => {
    if (!val) return null
    const trimmed = val.trim()
    if (trimmed.startsWith('http')) return trimmed
    const match = trimmed.match(/src=['"]?(https?:\/\/[^'"\s>]+)/i)
    return match ? match[1] : null
  }

  const embedFormUrl = primaryReg ? getEmbedFormUrl(primaryReg.embeded_form) : null
  const hasEmbed = !!embedFormUrl

  const renderRegistrationButton = (reg, index) => {
    const btnText = reg.button_text || 'Register Here'

    if (reg.embeded_form && getEmbedFormUrl(reg.embeded_form)) {
      return (
        <button
          key={index}
          className="btn btn-large future-event-reg-btn"
          onClick={() => setEmbedOpen((prev) => !prev)}
        >
          <i className="fas fa-clipboard-list"></i> {btnText}
        </button>
      )
    }

    if (reg.internal_url) {
      return (
        <a
          key={index}
          href={reg.internal_url}
          className="btn btn-large future-event-reg-btn"
        >
          <i className="fas fa-clipboard-list"></i> {btnText}
        </a>
      )
    }

    if (reg.external_url) {
      return (
        <a
          key={index}
          href={reg.external_url}
          className="btn btn-large future-event-reg-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fas fa-external-link-alt"></i> {btnText}
        </a>
      )
    }

    return null
  }

  return (
    <>
      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h1>{event.title || event.id}</h1>
          {details.date && <p>{details.date}</p>}
        </div>
      </section>

      {/* Banner */}
      {event.banner && (
        <section className="future-event-banner-section">
          <div className="container">
            <div className="future-event-banner">
              <img src={event.banner} alt={event.title || event.id} />
            </div>
          </div>
        </section>
      )}

      {/* Event Info */}
      <section className="future-event-info">
        <div className="container">

          {/* Description */}
          {description.length > 0 && (
            <div className="future-event-description">
              {description.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {/* Date / Time / Venue */}
          {(details.date || details.time || details.venue) && (
            <div className="future-event-details">
              {details.date && (
                <div className="future-event-detail">
                  <i className="fas fa-calendar-alt"></i>
                  <div>
                    <strong>Date</strong>
                    <span>{details.date}</span>
                  </div>
                </div>
              )}
              {details.time && (
                <div className="future-event-detail">
                  <i className="fas fa-clock"></i>
                  <div>
                    <strong>Time</strong>
                    <span>{details.time}</span>
                  </div>
                </div>
              )}
              {details.venue && (
                <div className="future-event-detail">
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <strong>Venue</strong>
                    <span>{details.venue}</span>
                    {details.address && (
                      <span className="future-event-address">{details.address}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Registration Buttons */}
          {registrations.length > 0 && (
            <div className="future-event-cta">
              {registrations.map((reg, i) => renderRegistrationButton(reg, i))}
            </div>
          )}

          {/* Embedded Form (collapsible) */}
          {hasEmbed && (
            <div
              ref={embedRef}
              className={`future-event-embed-collapse${embedOpen ? ' open' : ''}`}
            >
              <div className="future-event-embed-header">
                <button
                  className="future-event-embed-close"
                  onClick={() => setEmbedOpen(false)}
                  type="button"
                  aria-label="Close registration form"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="future-event-embed-frame">
                {embedOpen && (
                  <iframe
                    src={embedFormUrl}
                    title="Event Registration"
                    style={{ height: embedHeight + 'px' }}
                    allowFullScreen
                    allowpaymentrequest=""
                  />
                )}
              </div>
            </div>
          )}

          {/* Image Gallery */}
          {imgUrls.length > 0 && (
            <div className="future-event-gallery">
              <h2>Event Gallery</h2>
              <div className="future-event-gallery-grid">
                {imgUrls.map((url, i) => (
                  <div
                    key={i}
                    className="future-event-gallery-item"
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img src={url} alt={`${event.title || event.id} photo ${i + 1}`} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Section */}
          {videoUrls.length > 0 && (
            <div className="future-event-videos">
              <h2>Videos</h2>
              <div className="future-event-video-grid">
                {videoUrls.map((url, i) => {
                  const embedSrc = getEmbedUrl(url)
                  return (
                    <button
                      key={i}
                      className="future-event-video-link"
                      onClick={() => embedSrc ? setVideoModal(embedSrc) : window.open(url, '_blank', 'noopener')}
                    >
                      <i className="fas fa-play-circle"></i>
                      <span>Watch Video {i + 1}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Placeholder when minimal info */}
          {!event.banner && !details.date && description.length === 0 && (
            <div className="future-event-placeholder">
              <i className="fas fa-calendar-plus"></i>
              <p>Details coming soon. Stay tuned!</p>
              <Link to="/contact" className="btn">Get Notified</Link>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <Lightbox
        items={lightboxItems}
        currentIndex={lightboxIndex}
        isOpen={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
        onNext={() => setLightboxIndex((prev) => (prev + 1) % lightboxItems.length)}
        onPrev={() => setLightboxIndex((prev) => (prev - 1 + lightboxItems.length) % lightboxItems.length)}
      />

      {/* Video Modal */}
      {videoModal && (
        <div className="video-modal-overlay" onClick={() => setVideoModal(null)}>
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="video-modal-close"
              onClick={() => setVideoModal(null)}
              aria-label="Close video"
            >
              <i className="fas fa-times"></i>
            </button>
            <iframe
              src={videoModal}
              title="Video Player"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
          </div>
        </div>
      )}
    </>
  )
}

export default FutureEvent
