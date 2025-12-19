import { useEffect, useRef } from 'react'

// This component checks for new versions and auto-reloads when detected
// Only checks when tab becomes visible (not constantly polling)
export function VersionChecker() {
  const currentVersion = useRef<string | null>(null)

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Fetch the index.html with cache-busting
        const response = await fetch(`/?_=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        const html = await response.text()

        // Extract the JS bundle filename (it changes on each build)
        const match = html.match(/assets\/index-([A-Za-z0-9]+)\.js/)
        const newVersion = match ? match[1] : null

        if (newVersion) {
          if (currentVersion.current === null) {
            // First check - just store the version
            currentVersion.current = newVersion
          } else if (currentVersion.current !== newVersion) {
            // Version changed - reload the page
            console.log('New version detected, reloading...')
            window.location.reload()
          }
        }
      } catch (error) {
        console.warn('Version check failed:', error)
      }
    }

    // Check once on load to get current version
    checkVersion()

    // Check when tab becomes visible (user returns to app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}
