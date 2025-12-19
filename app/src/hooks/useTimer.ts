import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { useUIStore } from '../store/uiStore'

interface UseTimerOptions {
  onComplete?: () => void
  enabled?: boolean
}

/**
 * Hook to manage the game timer with pause/resume support
 * Timer pauses when modals are open (like the original game)
 */
export function useTimer({ onComplete: _onComplete, enabled = true }: UseTimerOptions = {}) {
  const timeLeft = useGameStore((state) => state.timeLeft)
  const phase = useGameStore((state) => state.phase)
  const decrementTimer = useGameStore((state) => state.decrementTimer)
  const isTimerPaused = useUIStore((state) => state.isTimerPaused)

  const intervalRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    // Only run timer during playing phase, when enabled, and NOT paused
    if (phase !== 'playing' || !enabled || isTimerPaused) {
      clearTimer()
      return
    }

    // Start/resume the timer
    intervalRef.current = window.setInterval(() => {
      decrementTimer()
    }, 1000)

    return clearTimer
  }, [phase, enabled, isTimerPaused, clearTimer, decrementTimer])

  return {
    timeLeft,
    isRunning: phase === 'playing' && enabled && !isTimerPaused,
    isPaused: isTimerPaused,
    clearTimer,
  }
}
