import { useState, useEffect } from 'react'
import { stripCommentedFields } from '../utils/jsonHelper'
import AnimateOnScroll from '../components/AnimateOnScroll'
import MagazineCard from '../components/MagazineCard'

function Magazine() {
  const [magazines, setMagazines] = useState({})
  const [selectedYear, setSelectedYear] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    async function loadMagazines() {
      try {
        const res = await fetch('/data/magazine.json', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Magazine data fetch failed (${res.status})`)
        }

        const data = stripCommentedFields(await res.json())
        const magazineData = data || {}

        if (!cancelled) {
          // Extract all year keys (exclude metadata)
          const years = Object.keys(magazineData)
            .filter((key) => key !== 'metadata')
            .sort()
            .reverse() // Most recent first

          setMagazines(magazineData)
          setSelectedYear(years[0] || null)
          setStatus(years.length > 0 ? 'ready' : 'empty')
        }
      } catch (err) {
        console.error('Error loading magazines:', err)
        if (!cancelled) {
          setStatus('error')
        }
      }
    }

    loadMagazines()
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'loading') return <div className="container" style={{ padding: '2rem' }}>Loading magazines...</div>
  if (status === 'error') return <div className="container" style={{ padding: '2rem', color: 'red' }}>Failed to load magazines</div>
  if (status === 'empty') return <div className="container" style={{ padding: '2rem' }}>No magazines available</div>

  const years = Object.keys(magazines)
    .filter((key) => key !== 'metadata')
    .sort()
    .reverse()

  const currentMagazines = magazines[selectedYear] || []
  const metadata = magazines.metadata || {}

  return (
    <>
      {/* Header Section */}
      <section className="donate-header-section">
        <div className="donate-header">
          <div className="container">
            <AnimateOnScroll>
              <h1 className="donate-title">{metadata.menu_tab_name || 'Dishari E-Magazine'}</h1>
              {metadata.description && <p className="donate-description">{metadata.description}</p>}
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Magazine Archive */}
      <section className="magazine-section">
        <div className="container">
          <AnimateOnScroll>
            <div className="magazine-content">
              {/* Year Tabs */}
              {years.length > 0 && (
                <div className="magazine-year-tabs">
                  {years.map((year) => (
                    <button
                      key={year}
                      className={`year-tab${selectedYear === year ? ' active' : ''}`}
                      onClick={() => setSelectedYear(year)}
                      type="button"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}

              {/* Magazine Grid */}
              {currentMagazines.length > 0 ? (
                <div className="magazine-grid">
                  {currentMagazines.map((magazine, idx) => (
                    <MagazineCard key={idx} magazine={magazine} />
                  ))}
                </div>
              ) : (
                <p className="no-magazines">No magazines available for {selectedYear}</p>
              )}
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  )
}

export default Magazine
