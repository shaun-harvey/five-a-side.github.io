import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'

const VAR_TIMEOUT = 20 // 20 seconds like original

export function VARModal() {
  const [hint, setHint] = useState<string | null>(null)

  const activeModal = useUIStore((state) => state.activeModal)
  const closeModal = useUIStore((state) => state.closeModal)
  const openModal = useUIStore((state) => state.openModal)
  const useVARHint = useGameStore((state) => state.useVARHint)

  const isOpen = activeModal === 'var'

  // Get hint when modal opens
  useEffect(() => {
    if (isOpen) {
      const playerHint = useVARHint()
      setHint(playerHint)
    } else {
      setHint(null)
    }
  }, [isOpen, useVARHint])

  // Auto-close after timeout (like original)
  useEffect(() => {
    if (!isOpen) return

    const timeout = setTimeout(() => {
      closeModal()
    }, VAR_TIMEOUT * 1000)

    return () => clearTimeout(timeout)
  }, [isOpen, closeModal])

  const handleGuess = () => {
    closeModal()
    openModal('guess')
  }

  const handleClose = () => {
    closeModal()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
      <div className="bg-gradient-to-b from-[#1a3409] to-[#2d5016] rounded-xl p-5 sm:p-6 max-w-sm w-full border-4 border-purple-500/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 text-purple-300">
          VAR Check
        </h2>

        {/* Hint Text */}
        <div className="text-lg sm:text-xl text-center mb-5 text-white bg-black/30 rounded-lg p-4">
          {hint || 'No hint available'}
        </div>

        {/* Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleGuess}
            className="w-full bg-red-600 hover:bg-red-700 font-bold py-4 px-6 rounded-xl transition duration-300 text-white text-lg border border-white/20 min-h-[52px]"
          >
            Guess
          </button>
          <button
            onClick={handleClose}
            className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-4 px-6 rounded-xl transition duration-300 text-white text-lg min-h-[52px]"
          >
            Check complete
          </button>
        </div>
      </div>
    </div>
  )
}
