import { useEffect, useState } from 'react'
import { proxyImageUrl } from '../utils/proxyImage'

function Lightbox({ items, currentIndex, isOpen, onClose, onNext, onPrev }) {
  if (!isOpen || !items || items.length === 0 || currentIndex < 0 || currentIndex >= items.length) {
    return null
  }

  const currentItem = items[currentIndex]
  const imageUrl = currentItem.type === 'image' 
    ? proxyImageUrl(currentItem.url) 
    : currentItem.url

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onNext, onPrev])

  return (
    <div 
      className="lightbox-overlay"
      onClick={onClose}
    >
      <div
        className="lightbox-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="lightbox-close"
          onClick={onClose}
          aria-label="Close lightbox"
          title="Close (Esc)"
        >
          ✕
        </button>

        {/* Image counter */}
        <div className="lightbox-counter">
          {currentIndex + 1} / {items.length}
        </div>

        {/* Main content */}
        <div className="lightbox-content">
          {currentItem.type === 'image' ? (
            <img
              src={imageUrl}
              alt="Lightbox view"
              className="lightbox-image"
            />
          ) : (
            <video
              src={imageUrl}
              className="lightbox-video"
              controls
              autoPlay
            />
          )}
        </div>

        {/* Navigation */}
        <button
          className="lightbox-nav lightbox-prev"
          onClick={onPrev}
          aria-label="Previous image"
          title="Previous (←)"
        >
          ❮
        </button>

        <button
          className="lightbox-nav lightbox-next"
          onClick={onNext}
          aria-label="Next image"
          title="Next (→)"
        >
          ❯
        </button>

        {/* Hints */}
        <div className="lightbox-hints">
          <div className="lightbox-hint">
            Click to close • Arrow keys to navigate
          </div>
        </div>
      </div>
    </div>
  )
}

export default Lightbox

