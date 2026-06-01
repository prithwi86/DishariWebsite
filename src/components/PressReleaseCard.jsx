import { useNavigate } from 'react-router-dom'

function PressReleaseCard({ pr }) {
  const navigate = useNavigate()

  const handleViewPress = () => {
    navigate(`/press/${pr.id}`)
  }

  const formattedDate = new Date(pr.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Get first image if available
  const firstImage = pr.images && pr.images.length > 0 ? pr.images[0] : null

  return (
    <div className="press-release-card" onClick={handleViewPress} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleViewPress()}>
      <div className="press-release-card-header">
        <h3 className="press-release-title">{pr.description}</h3>
        <p className="press-release-date">{formattedDate}</p>
      </div>

      <div className="press-release-card-body">
        {firstImage && (
          <img
            src={firstImage}
            alt={pr.description}
            className="press-release-cover-image"
          />
        )}
        <p className="press-release-summary">{pr.summary}</p>
      </div>
    </div>
  )
}

export default PressReleaseCard
