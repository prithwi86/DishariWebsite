import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CLOUD_NAME } from '../utils/cloudinary'

function MagazineCard({ magazine }) {
  const navigate = useNavigate()
  const [showCredits, setShowCredits] = useState(false)

  const handleViewMagazine = () => {
    if (magazine.url) {
      navigate(`/magazine/${encodeURIComponent(magazine.filename)}`)
    } else {
      alert('Magazine URL not available')
    }
  }

  const handleDownload = () => {
    if (magazine.public_id) {
      window.open(
        `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/fl_attachment/${magazine.public_id}.pdf`,
        '_blank',
        'noopener,noreferrer'
      )
    }
  }

  return (
    <>
      <div className="magazine-card" onClick={handleViewMagazine} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleViewMagazine()}>
        <div className="magazine-card-header">
          <h3 className="magazine-title">{magazine.title}</h3>
          <p className="magazine-date">{magazine.publication_date}</p>
        </div>

        <div className="magazine-card-body">
          {magazine.public_id && (
            <img
              src={`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/pg_1,q_auto,f_auto,w_1400/${magazine.public_id}.jpg`}
              alt={`${magazine.title} first page`}
              className="magazine-cover-image"
            />
          )}

          {magazine.credits && magazine.credits.length > 0 && (
            <div className="magazine-credits-section">
              <div className="credits-header">
                <button
                  className="credits-toggle"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCredits(!showCredits)
                  }}
                  type="button"
                >
                  Credits {showCredits ? '−' : '+'}
                </button>
                {magazine.public_id && (
                  <button
                    className="download-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload()
                    }}
                    title="Download Magazine"
                    type="button"
                  >
                    <i className="fas fa-download"></i>
                  </button>
                )}
              </div>
              {showCredits && (
                <div className="magazine-credits">
                  {magazine.credits.map((credit, idx) => (
                    <div key={idx} className="credit-group">
                      <p className="credit-role">{credit.role}</p>
                      <ul className="credit-names">
                        {credit.names.map((name, nameIdx) => (
                          <li key={nameIdx}>{name}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PDF Modal removed - now uses dedicated page */}
    </>
  )
}

export default MagazineCard
