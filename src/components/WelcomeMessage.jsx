import { useState, useEffect } from 'react'
import { stripCommentedFields } from '../utils/jsonHelper'
import AnimateOnScroll from './AnimateOnScroll'

function WelcomeMessage() {
  const [welcome, setWelcome] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    async function loadWelcomeMessage() {
      try {
        const res = await fetch('/data/home-page.json', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Home page data fetch failed (${res.status})`)
        }

        const data = stripCommentedFields(await res.json())
        const welcomeData = data?.body?.welcome_message || {}

        // Check if both header_text and body_text exist and are non-empty
        const hasHeaderText = Array.isArray(welcomeData.header_text) && welcomeData.header_text.length > 0
        const hasBodyText = Array.isArray(welcomeData.body_text) && welcomeData.body_text.length > 0

        if (!cancelled) {
          if (hasHeaderText && hasBodyText) {
            setWelcome(welcomeData)
            setStatus('ready')
          } else {
            setStatus('empty')
          }
        }
      } catch (err) {
        console.error('Error loading welcome message:', err)
        if (!cancelled) {
          setStatus('error')
        }
      }
    }

    loadWelcomeMessage()
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'empty' || !welcome) return null
  if (status === 'error') return <div className="welcome-message error">Failed to load welcome message</div>

  return (
    <AnimateOnScroll>
      <section className="welcome-message-section">
        <div className="container">
          <div className="welcome-message">
            {welcome.header_text && Array.isArray(welcome.header_text) && (
              <h2 className="welcome-title">{welcome.header_text[0]}</h2>
            )}
            {welcome.body_text && Array.isArray(welcome.body_text) && (
              <div className="welcome-content">
                {welcome.body_text.map((paragraph, idx) => (
                  <p key={idx} className="welcome-text">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </AnimateOnScroll>
  )
}

export default WelcomeMessage
