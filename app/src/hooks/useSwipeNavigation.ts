import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Define the order of pages for swipe navigation
const PAGE_ORDER = ['/play', '/leaderboard', '/stats', '/rules', '/settings']

export function useSwipeNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return

      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY

      const deltaX = touchEndX - touchStartX.current
      const deltaY = touchEndY - touchStartY.current

      // Minimum swipe distance (in pixels)
      const minSwipeDistance = 80

      // Make sure horizontal swipe is dominant (not a scroll)
      if (Math.abs(deltaX) < minSwipeDistance || Math.abs(deltaY) > Math.abs(deltaX) * 0.7) {
        touchStartX.current = null
        touchStartY.current = null
        return
      }

      const currentIndex = PAGE_ORDER.indexOf(location.pathname)

      // Only handle swipe if we're on a swipeable page
      if (currentIndex === -1) {
        touchStartX.current = null
        touchStartY.current = null
        return
      }

      if (deltaX < 0) {
        // Swipe left - go to next page
        const nextIndex = currentIndex + 1
        if (nextIndex < PAGE_ORDER.length) {
          navigate(PAGE_ORDER[nextIndex])
        }
      } else {
        // Swipe right - go to previous page
        const prevIndex = currentIndex - 1
        if (prevIndex >= 0) {
          navigate(PAGE_ORDER[prevIndex])
        }
      }

      touchStartX.current = null
      touchStartY.current = null
    }

    // Only add listeners on mobile
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      document.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [location.pathname, navigate])
}
