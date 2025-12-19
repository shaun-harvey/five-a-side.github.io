import { useEffect, useCallback, useMemo } from 'react'
import { useGameStore } from '../store/gameStore'

interface UseAntiCheatOptions {
  enabled?: boolean
  onCheatDetected?: () => void
}

/**
 * Hook to detect cheating (tab switching)
 * DISABLED ON MOBILE - false positives from notifications, keyboard, etc.
 * would zero out scores unfairly. Only active on desktop browsers.
 */
export function useAntiCheat({
  enabled = true,
  onCheatDetected,
}: UseAntiCheatOptions = {}) {
  const phase = useGameStore((state) => state.phase)
  const endGame = useGameStore((state) => state.endGame)

  // Detect if on mobile - anti-cheat is completely disabled on mobile
  const isMobile = useMemo(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }, [])

  const handleCheatDetected = useCallback(() => {
    if (phase !== 'playing') return

    onCheatDetected?.()
    endGame('tab-switch')
  }, [phase, endGame, onCheatDetected])

  useEffect(() => {
    // COMPLETELY DISABLE ANTI-CHEAT ON MOBILE
    // Mobile triggers false positives too easily (notifications, keyboard, etc.)
    if (!enabled || phase !== 'playing' || isMobile) return

    // Handle visibility change (tab switch) - desktop only
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheatDetected()
      }
    }

    // Handle window blur (switching to another window) - desktop only
    const handleBlur = () => {
      handleCheatDetected()
    }

    // Handle before unload (closing tab/window)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase === 'playing') {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, phase, handleCheatDetected, isMobile])

  return {
    isMonitoring: enabled && phase === 'playing' && !isMobile,
  }
}
