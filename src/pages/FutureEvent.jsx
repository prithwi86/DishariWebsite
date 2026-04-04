import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import Lightbox from '../components/Lightbox'
import { stripCommentedFields } from '../utils/jsonHelper'

function FutureEvent() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [embedOpen, setEmbedOpen] = useState(false)
  const [embedHeight, setEmbedHeight] = useState(900)
  const [modalUrl, setModalUrl] = useState(null) // external URL for modal iframe
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [videoModal, setVideoModal] = useState(null) // embed URL string or null
  const embedRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    fetch('/data/upcoming-events.json')
      .then((res) => res.json())
      .then((raw) => stripCommentedFields(raw))
      .then((data) => {
        const found = (data.events || []).find((ev) => ev.id === id)
        setEvent(found || null)
      })
      .catch((err) => console.error('Error loading event:', err))
      .finally(() => setLoading(false))
  }, [id])

  // Scroll embed into view when opened
  // useEffect(() => {
  //   if (embedOpen && embedRef.current) {
  //     embedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  //   }
  // }, [embedOpen])

  // Lock body scroll when embed modal or external modal is open
  useEffect(() => {
    if (embedOpen || modalUrl) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [embedOpen, modalUrl])

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

  // Collect sub-event banner URLs to exclude from main gallery
  const subEventBanners = new Set(
    (event.sub_events || []).map((s) => s.banner).filter(Boolean)
  )
  const galleryImgs = imgUrls.filter((url) => !subEventBanners.has(url))
  const lightboxItems = galleryImgs.map((url) => ({ url, type: 'image' }))

  // Build Google Maps search URL from venue + address
  const getMapsUrl = () => {
    const parts = [details.venue, details.address].filter(Boolean).join(', ')
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`
  }

  // Build Google Calendar "Add Event" URL from date, time, title, venue
  const getCalendarUrl = () => {
    const [m, d, y] = (details.date || '').split('/')
    if (!m || !d || !y) return null
    const dateStr = `${y}${m}${d}`
    const location = [details.venue, details.address].filter(Boolean).join(', ')
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title || event.id,
      dates: `${dateStr}/${dateStr}`,
      location,
    })
    return `https://calendar.google.com/calendar/render?${params}`
  }

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
        <button
          key={index}
          className="btn btn-large future-event-reg-btn"
          onClick={() => setModalUrl(reg.external_url)}
        >
          <i className="fas fa-external-link-alt"></i> {btnText}
        </button>
      )
    }

    return null
  }

  return (
    <>
      {/* Page Header */}
      <section className="future-event-header">
        <div className="container">
          <h1>{event.title || event.id}</h1>
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
                <a
                  href={getCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="future-event-detail future-event-detail-link"
                >
                  <i className="fas fa-calendar-alt"></i>
                  <div>
                    <strong>Date</strong>
                    <span>{details.date}</span>
                    <span className="future-event-link-hint">Add to Calendar</span>
                  </div>
                </a>
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
                <a
                  href={getMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="future-event-detail future-event-detail-link"
                >
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <strong>Venue</strong>
                    <span>{details.venue}</span>
                    {details.address && (
                      <span className="future-event-address">{details.address}</span>
                    )}
                    <span className="future-event-link-hint">View on Maps</span>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Registration Buttons */}
          {registrations.length > 0 && (
            <div className="future-event-cta">
              {registrations.map((reg, i) => renderRegistrationButton(reg, i))}
            </div>
          )}

          {/* Embedded Form — OLD inline collapsible (commented out)
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
          */}

          {/* Embedded Form — Modal overlay */}
          {hasEmbed && embedOpen && (
            <div className="embed-modal-overlay" onClick={() => setEmbedOpen(false)}>
              <div className="embed-modal" onClick={(e) => e.stopPropagation()}>
                <button
                  className="embed-modal-close"
                  onClick={() => setEmbedOpen(false)}
                  type="button"
                  aria-label="Close registration form"
                >
                  <i className="fas fa-times"></i>
                </button>
                <div className="embed-modal-body">
                  <iframe
                    src={embedFormUrl}
                    title="Event Registration"
                    style={{ height: embedHeight + 'px' }}
                    allow="payment"
                    allowFullScreen
                    allowpaymentrequest=""
                  />
                </div>
              </div>
            </div>
          )}

          {/* External URL — Modal overlay */}
          {modalUrl && (
            <div className="embed-modal-overlay" onClick={() => setModalUrl(null)}>
              <div className="embed-modal" onClick={(e) => e.stopPropagation()}>
                <button
                  className="embed-modal-close"
                  onClick={() => setModalUrl(null)}
                  type="button"
                  aria-label="Close"
                >
                  <i className="fas fa-times"></i>
                </button>
                <div className="embed-modal-body">
                  <iframe
                    src={modalUrl}
                    title="Registration"
                    allow="payment"
                    allowFullScreen
                    allowpaymentrequest=""
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sub Events */}
          {(event.sub_events || []).length > 0 && (
            <div className="future-event-sub-events">
              {[...event.sub_events]
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((sub) => {
                  const subDetails = sub.details || {}
                  const subDesc = subDetails.description || []
                  const subImgs = subDetails.img_urls || []
                  const subVideos = subDetails.video_urls || []
                  const subRegs = subDetails.registrations || []

                  return (
                    <div key={sub.id} className="future-event-sub-card">
                      {sub.banner && (
                        <div className="future-event-sub-banner">
                          <img src={sub.banner} alt={sub.title || sub.id} />
                        </div>
                      )}
                      <h3 className="future-event-sub-title">{sub.title || sub.id}</h3>

                      {subDesc.length > 0 && (
                        <div className="future-event-sub-desc">
                          {subDesc.map((para, i) => (
                            <p key={i}>{para}</p>
                          ))}
                        </div>
                      )}

                      {(subDetails.date || subDetails.time || subDetails.venue) && (
                        <div className="future-event-sub-details">
                          {subDetails.date && (
                            <span><i className="fas fa-calendar-alt"></i> {subDetails.date}</span>
                          )}
                          {subDetails.time && (
                            <span><i className="fas fa-clock"></i> {subDetails.time}</span>
                          )}
                          {subDetails.venue && (
                            <span><i className="fas fa-map-marker-alt"></i> {subDetails.venue}</span>
                          )}
                        </div>
                      )}

                      {subImgs.length > 0 && (
                        <div className="future-event-sub-images">
                          {subImgs.map((url, i) => (
                            <img key={i} src={url} alt={`${sub.title} ${i + 1}`} loading="lazy" />
                          ))}
                        </div>
                      )}

                      {subVideos.length > 0 && (
                        <div className="future-event-sub-videos">
                          {subVideos.map((url, i) => {
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
                      )}

                      {subRegs.length > 0 && (
                        <div className="future-event-sub-regs">
                          {subRegs.map((reg, i) => {
                            if (reg.external_url) {
                              return (
                                <button
                                  key={i}
                                  className="btn future-event-reg-btn"
                                  onClick={() => setModalUrl(reg.external_url)}
                                >
                                  <i className="fas fa-external-link-alt"></i> {reg.button_text || 'Register'}
                                </button>
                              )
                            }
                            if (reg.internal_url) {
                              return (
                                <a key={i} href={reg.internal_url} className="btn future-event-reg-btn">
                                  <i className="fas fa-clipboard-list"></i> {reg.button_text || 'Register'}
                                </a>
                              )
                            }
                            return null
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}

          {/* Image Gallery */}
          {galleryImgs.length > 0 && (
            <div className="future-event-gallery">
              <h2>Event Attractions</h2>
              <div className="future-event-gallery-grid">
                {galleryImgs.map((url, i) => (
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
