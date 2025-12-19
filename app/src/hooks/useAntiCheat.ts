import { useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'

interface UseAntiCheatOptions {
  enabled?: boolean
  onCheatDetected?: () => void
}

/**
 * Hook to detect cheating (tab switching, window blur)
 */
export function useAntiCheat({
  enabled = true,
  onCheatDetected,
}: UseAntiCheatOptions = {}) {
  const phase = useGameStore((state) => state.phase)
  const endGame = useGameStore((state) => state.endGame)

  const handleCheatDetected = useCallback(() => {
    if (phase !== 'playing') return

    onCheatDetected?.()
    endGame('tab-switch')
  }, [phase, endGame, onCheatDetected])

  useEffect(() => {
    if (!enabled || phase !== 'playing') return

    // Handle visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheatDetected()
      }
    }

    // Handle window blur (switching to another window)
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
  }, [enabled, phase, handleCheatDetected])

  return {
    isMonitoring: enabled && phase === 'playing',
  }
}
