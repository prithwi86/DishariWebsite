import { useState, useEffect } from 'react'
import { stripCommentedFields } from '../utils/jsonHelper'
import AnimateOnScroll from '../components/AnimateOnScroll'
import PressReleaseCard from '../components/PressReleaseCard'

function PressRoom() {
  const [pressReleases, setPressReleases] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    async function loadPressReleases() {
      try {
        const res = await fetch('/data/press_release.json', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Press releases fetch failed (${res.status})`)
        }

        const data = stripCommentedFields(await res.json())
        const releases = (data.press_releases || [])
          .sort((a, b) => new Date(b.date) - new Date(a.date))

        if (!cancelled) {
          setPressReleases(releases)
          setStatus(releases.length > 0 ? 'ready' : 'empty')
        }
      } catch (err) {
        console.error('Error loading press releases:', err)
        if (!cancelled) {
          setStatus('error')
        }
      }
    }

    loadPressReleases()
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'loading') return <div className="container" style={{ padding: '2rem' }}>Loading press releases...</div>
  if (status === 'error') return <div className="container" style={{ padding: '2rem', color: 'red' }}>Failed to load press releases</div>
  if (status === 'empty') return <div className="container" style={{ padding: '2rem' }}>No press releases available</div>

  return (
    <>
      {/* Header Section */}
      <section className="donate-header-section">
        <div className="donate-header">
          <div className="container">
            <AnimateOnScroll>
              <h1 className="donate-title">Press Room</h1>
              <p className="donate-description">Stay updated with the latest news and announcements from Dishari</p>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="press-room-section">
        <div className="container">
          <AnimateOnScroll>
            <div className="press-room-content">
              {/* Press Releases Grid */}
              {pressReleases.length > 0 ? (
                <div className="press-releases-grid">
                  {pressReleases.map((pr) => (
                    <PressReleaseCard key={pr.id} pr={pr} />
                  ))}
                </div>
              ) : (
                <p className="no-releases">No press releases available</p>
              )}
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  )
}

export default PressRoom
