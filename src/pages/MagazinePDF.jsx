import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { stripCommentedFields } from '../utils/jsonHelper'
import { CLOUD_NAME } from '../utils/cloudinary'

function getPageUrl(publicId, page) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/pg_${page},q_auto,f_auto,w_1400/${publicId}.jpg`
}

function getDownloadUrl(publicId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/fl_attachment/${publicId}.pdf`
}

function MagazinePDF() {
  const { filename } = useParams()
  const navigate = useNavigate()
  const [magazine, setMagazine] = useState(null)
  const [status, setStatus] = useState('loading')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadMagazine() {
      try {
        const res = await fetch('/data/magazine.json', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Magazine data fetch failed (${res.status})`)
        const data = stripCommentedFields(await res.json())

        let found = null
        for (const year of Object.keys(data)) {
          if (year === 'metadata') continue
          const mag = data[year].find((m) => m.filename === decodeURIComponent(filename))
          if (mag) { found = mag; break }
        }

        if (!cancelled) {
          if (found) { setMagazine(found); setStatus('ready') }
          else setStatus('notfound')
        }
      } catch (err) {
        console.error('Error loading magazine:', err)
        if (!cancelled) setStatus('error')
      }
    }

    loadMagazine()
    return () => { cancelled = true }
  }, [filename])

  const totalPages = magazine?.pages || null

  const goTo = useCallback((page) => {
    const p = Math.max(1, totalPages ? Math.min(page, totalPages) : page)
    setCurrentPage(p)
    setPageInput(String(p))
    setImgLoaded(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [totalPages])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(currentPage + 1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(currentPage - 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentPage, goTo])

  if (status === 'loading') return (
    <div className="pdf-viewer-page">
      <div className="pdf-glass-section">
        <div className="pdf-header-bar"><div className="pdf-content-inner"><div className="pdf-nav-left"><button className="pdf-icon-btn" onClick={() => navigate('/magazine')} title="Back to Magazine"><i className="fas fa-arrow-left"></i></button></div></div></div>
        <div className="pdf-loading">Loading magazine...</div>
      </div>
    </div>
  )

  if (status === 'notfound') return (
    <div className="pdf-viewer-page">
      <div className="pdf-glass-section">
        <div className="pdf-header-bar"><div className="pdf-content-inner"><div className="pdf-nav-left"><button className="pdf-icon-btn" onClick={() => navigate('/magazine')} title="Back to Magazine"><i className="fas fa-arrow-left"></i></button></div></div></div>
        <div className="pdf-error">Magazine not found.</div>
      </div>
    </div>
  )

  if (status === 'error') return (
    <div className="pdf-viewer-page">
      <div className="pdf-glass-section">
        <div className="pdf-header-bar"><div className="pdf-content-inner"><div className="pdf-nav-left"><button className="pdf-icon-btn" onClick={() => navigate('/magazine')} title="Back to Magazine"><i className="fas fa-arrow-left"></i></button></div></div></div>
        <div className="pdf-error">Failed to load magazine.</div>
      </div>
    </div>
  )

  if (!magazine) return null

  const handleDownload = () => {
    if (magazine.public_id) {
      window.open(getDownloadUrl(magazine.public_id), '_blank', 'noopener,noreferrer')
    }
  }

  const pageUrl = getPageUrl(magazine.public_id, currentPage)

  return (
    <div className="pdf-viewer-page">
      <div className="pdf-glass-section">

        {/* Sticky header bar */}
        <div className="pdf-header-bar">
          <div className="pdf-content-inner">
            <div className="pdf-nav-left">
              <button className="pdf-icon-btn" onClick={() => navigate('/magazine')} title="Back to Magazine">
                <i className="fas fa-arrow-left"></i>
              </button>
            </div>
            <div className="pdf-title">
              <h1>{magazine.title}</h1>
              <p>{magazine.publication_date}</p>
            </div>
            <div className="pdf-nav-right">
              <button className="pdf-icon-btn" onClick={handleDownload} title="Download PDF">
                <i className="fas fa-download"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Page Image with carousel-style side arrows */}
        <div className="pdf-viewer-body">
          <div className="pdf-content-inner">
            <div className="pdf-viewer-inner">
              <button
                className="pdf-arrow pdf-arrow-left"
                onClick={() => goTo(currentPage - 1)}
                disabled={currentPage <= 1}
                title="Previous page"
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              <div className="pdf-page-wrapper">
                {!imgLoaded && <div className="pdf-page-loading">Loading page {currentPage}...</div>}
                <img
                  key={pageUrl}
                  src={pageUrl}
                  alt={`${magazine.title} — page ${currentPage}`}
                  className="pdf-page-img"
                  style={{ display: imgLoaded ? 'block' : 'none' }}
                  onLoad={() => setImgLoaded(true)}
                />
                {imgLoaded && totalPages && (
                  <div className="pdf-page-counter">
                    Page{' '}
                    <input
                      type="number"
                      className="pdf-page-input"
                      value={pageInput}
                      min="1"
                      max={totalPages}
                      onChange={(e) => setPageInput(e.target.value)}
                      onBlur={() => goTo(parseInt(pageInput, 10) || 1)}
                      onKeyDown={(e) => e.key === 'Enter' && goTo(parseInt(pageInput, 10) || 1)}
                    />
                    of {totalPages}
                  </div>
                )}
              </div>

              <button
                className="pdf-arrow pdf-arrow-right"
                onClick={() => goTo(currentPage + 1)}
                disabled={totalPages !== null && currentPage >= totalPages}
                title="Next page"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Credits */}
        {magazine.credits && magazine.credits.length > 0 && (
          <div className="pdf-credits-body">
            <div className="pdf-content-inner">
              <h3 className="pdf-credits-heading">Credits</h3>
              <div className="pdf-credits-grid">
                {magazine.credits.map((credit, idx) => (
                  <div key={idx} className="pdf-credit-item">
                    <span className="pdf-credit-role">{credit.role}</span>
                    <span className="pdf-credit-names">{credit.names.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default MagazinePDF
