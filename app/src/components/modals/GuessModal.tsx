import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { GUESS_MODAL_TIMEOUT } from '../../lib/game/constants'

export function GuessModal() {
  const [guess, setGuess] = useState('')
  const [timeLeft, setTimeLeft] = useState(GUESS_MODAL_TIMEOUT)
  const [result, setResult] = useState<{ correct: boolean; message: string; bonusMessage?: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeModal = useUIStore((state) => state.activeModal)
  const closeModal = useUIStore((state) => state.closeModal)
  const showFeedback = useUIStore((state) => state.showFeedback)
  const processGuess = useGameStore((state) => state.processGuess)

  const isOpen = activeModal === 'guess'

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setGuess('')
      setResult(null)
      setTimeLeft(GUESS_MODAL_TIMEOUT)
      // Use setTimeout to ensure DOM is ready before focusing
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Countdown timer
  useEffect(() => {
    if (!isOpen || result) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, result])

  // Handle time up separately to avoid setState during render
  useEffect(() => {
    if (timeLeft === 0 && !result && isOpen) {
      submitGuess(guess)
    }
  }, [timeLeft])

  const submitGuess = (guessText: string) => {
    if (result) return

    const guessResult = processGuess(guessText.trim())
    setResult({
      correct: guessResult.correct,
      message: guessResult.message,
      bonusMessage: guessResult.bonusMessage,
    })

    showFeedback({
      type: guessResult.correct ? 'success' : 'error',
      message: guessResult.message,
    })

    // Show bonus message if earned (5 in a row streak bonus)
    if (guessResult.bonusMessage) {
      setTimeout(() => {
        showFeedback({
          type: 'success',
          message: guessResult.bonusMessage!,
          duration: 2500,
        })
      }, 300)
    }

    // Close modal quickly - feedback toast shows the message
    setTimeout(() => {
      closeModal()
    }, 300)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (result) return
    submitGuess(guess)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!result) {
        submitGuess(guess)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
      <div className="bg-gradient-to-b from-[#1a3409] to-[#2d5016] rounded-xl p-5 sm:p-6 max-w-sm w-full border-2 border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 text-white">
          Guess the player name
        </h2>

        {/* Timer */}
        <div className="text-xl font-bold text-center text-yellow-400 mb-4">
          Time left: {timeLeft}s
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!!result}
          placeholder="Enter player name"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 text-lg placeholder:text-gray-400 mb-4"
        />

        {/* Result Display */}
        {result && (
          <div
            className={`mb-4 p-4 rounded-xl text-center font-bold text-lg ${
              result.correct
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {result.message}
          </div>
        )}

        {/* Submit Button */}
        {!result && (
          <button
            onClick={handleSubmit}
            className="w-full bg-red-600 hover:bg-red-700 font-bold py-4 px-6 rounded-xl transition duration-300 text-white text-lg border border-white/20 min-h-[52px]"
          >
            Submit Guess
          </button>
        )}
      </div>
    </div>
  )
}
