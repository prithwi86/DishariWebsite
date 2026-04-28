import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AnimateOnScroll from '../components/AnimateOnScroll'
import { stripCommentedFields } from '../utils/jsonHelper'

function Donate() {
  const [donationPage, setDonationPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalUrl, setModalUrl] = useState(null) // external URL for modal iframe

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  const handleExternalUrl = (url) => {
    if (isIOS) {
      window.open(url, '_blank')
    } else {
      setModalUrl(url)
    }
  }

  useEffect(() => {
    fetch('/data/home-page.json')
      .then((res) => res.json())
      .then((raw) => stripCommentedFields(raw))
      .then((data) => {
        const page = data?.body?.donation_page || {}
        setDonationPage(page)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading donation page:', err)
        setLoading(false)
      })
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalUrl) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [modalUrl])

  if (loading) {
    return (
      <section className="donate-page">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>Loading...</div>
        </div>
      </section>
    )
  }

  const headerText = donationPage?.header_text || 'Support Us'
  const description = donationPage?.description || ''
  const donationLinks = donationPage?.donation_link || []

  return (
    <section className="donate-page">
      {/* Header Section */}
      <div className="donate-header">
        <div className="container">
          <AnimateOnScroll>
            <h1 className="donate-title">{headerText}</h1>
            {description && <p className="donate-description">{description}</p>}
          </AnimateOnScroll>
        </div>
      </div>

      {/* Donation Methods */}
      <div className="container donate-container">
        <div className="donate-content">
          <AnimateOnScroll>
            <div className="donate-info">
              <h2>Why Support Dishari Boston?</h2>
              <p>
                Dishari Boston is a nonprofit organization dedicated to preserving and promoting South Asian cultural
                heritage in the greater Boston area. Your contribution directly supports:
              </p>
              <ul className="donate-benefits">
                <li>
                  <i className="fas fa-music"></i>
                  <span>Cultural events and performances celebrating our heritage</span>
                </li>
                <li>
                  <i className="fas fa-book"></i>
                  <span>Educational workshops and community programs</span>
                </li>
                <li>
                  <i className="fas fa-users"></i>
                  <span>Youth mentorship and community building initiatives</span>
                </li>
                <li>
                  <i className="fas fa-heart"></i>
                  <span>Supporting underrepresented voices in our community</span>
                </li>
              </ul>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="donate-forms">
              {donationLinks.length > 0 ? (
                donationLinks.map((link, idx) => (
                  <div key={idx} className="donate-form-wrapper">
                    <button
                      className="btn btn-donate"
                      onClick={() => handleExternalUrl(link.external_url)}
                      type="button"
                    >
                      <i className="fas fa-heart"></i>
                      {link.button_text || 'Donate Now'}
                    </button>
                    <p className="donate-note">
                      Secure donation through our partner. Your information is safe and protected.
                    </p>
                  </div>
                ))
              ) : (
                <p className="donate-placeholder">
                  Donation links coming soon. Please contact us at{' '}
                  <a href="mailto:support@dishariboston.org">support@dishariboston.org</a> to discuss sponsorships or
                  donations.
                </p>
              )}
            </div>
          </AnimateOnScroll>
        </div>
      </div>

      {/* Tax-Exempt Info */}
      <div className="donate-footer">
        <div className="container">
          <AnimateOnScroll>
            <p>
              <strong>Dishari Boston Inc.</strong> is a registered 501(c)(3) nonprofit organization. Your donation is
              tax-deductible to the extent allowed by law. We will provide a donation receipt for your records.
            </p>
          </AnimateOnScroll>
        </div>
      </div>

      {/* Call to Action */}
      <div className="donate-cta">
        <div className="container">
          <AnimateOnScroll>
            <h3>Have Questions?</h3>
            <p>
              If you have any questions about your donation or would like to discuss sponsorship opportunities, please
              contact us.
            </p>
            <Link to="/contact" className="btn btn-secondary">
              Get in Touch
            </Link>
          </AnimateOnScroll>
        </div>
      </div>

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
                title="Donation"
                allow="payment"
                allowFullScreen
                allowpaymentrequest=""
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Donate
