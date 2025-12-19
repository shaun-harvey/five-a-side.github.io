import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { isVowel } from '../../lib/game/letterUtils'

const SUBSTITUTION_TIMEOUT = 20 // 20 seconds like original
const SUBSTITUTION_COLORS = [
  'bg-red-600',
  'bg-yellow-600',
  'bg-purple-600',
  'bg-blue-600',
  'bg-green-600',
]

type PendingSubstitutions = Record<string, string | null>

export function SubstituteModal() {
  const [pendingSubstitutions, setPendingSubstitutions] = useState<PendingSubstitutions>({})
  const [colorMap, setColorMap] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(SUBSTITUTION_TIMEOUT)

  const activeModal = useUIStore((state) => state.activeModal)
  const closeModal = useUIStore((state) => state.closeModal)
  const showFeedback = useUIStore((state) => state.showFeedback)

  const chosenLetters = useGameStore((state) => state.chosenLetters)
  const usedLetters = useGameStore((state) => state.usedLetters)
  const substitutionsLeft = useGameStore((state) => state.substitutionsLeft)
  const makeSubstitution = useGameStore((state) => state.makeSubstitution)
  const handleSubstitutionTimeout = useGameStore((state) => state.handleSubstitutionTimeout)

  const isOpen = activeModal === 'substitute'

  // Get available letters for substitution (not in chosen AND not in used)
  const availableLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(
    (letter) => !chosenLetters.includes(letter) && !usedLetters.has(letter)
  )

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPendingSubstitutions({})
      setTimeLeft(SUBSTITUTION_TIMEOUT)

      // Assign colors to current letters
      const newColorMap: Record<string, string> = {}
      chosenLetters.forEach((letter, index) => {
        newColorMap[letter] = SUBSTITUTION_COLORS[index % SUBSTITUTION_COLORS.length]
      })
      setColorMap(newColorMap)
    }
  }, [isOpen, chosenLetters])

  const handleTimeout = useCallback(() => {
    const { allSubstitutionsLost } = handleSubstitutionTimeout()

    showFeedback({
      type: 'warning',
      message: "Hey that is enough of that time-wasting! Get on with the game!",
    })

    if (allSubstitutionsLost) {
      setTimeout(() => {
        showFeedback({
          type: 'error',
          message: "All remaining substitutions lost!",
        })
      }, 1500)
    }

    closeModal()
  }, [closeModal, showFeedback, handleSubstitutionTimeout])

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, handleTimeout])

  // Toggle current letter selection
  const toggleCurrentLetter = (letter: string) => {
    setPendingSubstitutions((prev) => {
      if (prev[letter] !== undefined) {
        // Deselect - remove from pending
        const newPending = { ...prev }
        delete newPending[letter]
        return newPending
      } else {
        // Select - add to pending with null value (waiting for available letter)
        return { ...prev, [letter]: null }
      }
    })
  }

  // Toggle available letter selection
  const toggleAvailableLetter = (letter: string) => {
    const letterIsVowel = isVowel(letter)

    // Find a selected current letter of the same type (vowel/consonant) that doesn't have a replacement yet
    const correspondingCurrentLetter = Object.keys(pendingSubstitutions).find(
      (key) =>
        pendingSubstitutions[key] === null &&
        isVowel(key) === letterIsVowel
    )

    if (!correspondingCurrentLetter) return

    // Check if this letter is already assigned
    const isAlreadyAssigned = Object.values(pendingSubstitutions).includes(letter)

    if (isAlreadyAssigned) {
      // Find which current letter has this and clear it
      const currentLetterWithThis = Object.keys(pendingSubstitutions).find(
        (key) => pendingSubstitutions[key] === letter
      )
      if (currentLetterWithThis) {
        setPendingSubstitutions((prev) => ({
          ...prev,
          [currentLetterWithThis]: null,
        }))
      }
    } else {
      // Assign to the first matching current letter
      setPendingSubstitutions((prev) => ({
        ...prev,
        [correspondingCurrentLetter]: letter,
      }))
    }
  }

  // Confirm all substitutions
  const confirmSubstitutions = () => {
    const validSubstitutions = Object.entries(pendingSubstitutions).filter(
      ([_, newLetter]) => newLetter !== null
    ) as [string, string][]

    if (validSubstitutions.length === 0) {
      showFeedback({
        type: 'warning',
        message: 'Please select new letters to substitute!',
      })
      return
    }

    if (validSubstitutions.length > substitutionsLeft) {
      showFeedback({
        type: 'error',
        message: `You only have ${substitutionsLeft} substitution${substitutionsLeft !== 1 ? 's' : ''} left!`,
      })
      return
    }

    // Make all substitutions
    validSubstitutions.forEach(([oldLetter, newLetter]) => {
      makeSubstitution(oldLetter, newLetter)
    })

    const oldLetters = validSubstitutions.map(([old]) => old).join(', ')
    const newLetters = validSubstitutions.map(([_, newL]) => newL).join(', ')
    showFeedback({
      type: 'success',
      message: `Substituted ${oldLetters} for ${newLetters}`,
    })

    closeModal()
  }

  // Check if available letter should be enabled
  const isAvailableLetterEnabled = (letter: string) => {
    const letterIsVowel = isVowel(letter)

    // Check if any selected current letter of same type is waiting for a replacement
    const hasWaitingCurrentLetter = Object.keys(pendingSubstitutions).some(
      (key) =>
        pendingSubstitutions[key] === null &&
        isVowel(key) === letterIsVowel
    )

    return hasWaitingCurrentLetter
  }

  // Get color for available letter if it's assigned
  const getAvailableLetterColor = (letter: string) => {
    const correspondingCurrentLetter = Object.keys(pendingSubstitutions).find(
      (key) => pendingSubstitutions[key] === letter
    )
    if (correspondingCurrentLetter) {
      return colorMap[correspondingCurrentLetter]
    }
    return null
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
      <div className="bg-gradient-to-b from-[#1a3409] to-[#2d5016] rounded-xl p-5 sm:p-6 max-w-md w-full border-2 border-yellow-500/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-3 text-white">
          Make a change
        </h2>

        {/* Timer */}
        <div className="text-center mb-4">
          <span
            className={`text-xl font-bold font-mono ${
              timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-400'
            }`}
          >
            {timeLeft}s
          </span>
        </div>

        {/* Substitute Grid */}
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-bold mb-3 text-white text-center">Select letters to substitute</h3>

          {/* Current Letters Grid */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-4">
            {chosenLetters.map((letter) => {
              const isSelected = pendingSubstitutions[letter] !== undefined
              const hasReplacement = pendingSubstitutions[letter] !== null && pendingSubstitutions[letter] !== undefined
              const color = colorMap[letter]

              return (
                <button
                  key={letter}
                  onClick={() => toggleCurrentLetter(letter)}
                  className={`
                    w-full aspect-square min-h-[48px] flex items-center justify-center
                    font-bold text-xl sm:text-2xl rounded-lg transition duration-300
                    ${isSelected && !hasReplacement
                      ? 'bg-white text-black'
                      : color
                    }
                    ${!isSelected ? 'hover:opacity-80' : ''}
                    text-white
                  `}
                  style={isSelected && !hasReplacement ? { color: 'black' } : {}}
                >
                  {letter}
                </button>
              )
            })}
          </div>

          {/* Available Letters Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {availableLetters.map((letter) => {
              const assignedColor = getAvailableLetterColor(letter)
              const isEnabled = isAvailableLetterEnabled(letter) || assignedColor

              return (
                <button
                  key={letter}
                  onClick={() => isEnabled && toggleAvailableLetter(letter)}
                  className={`
                    w-full aspect-square min-h-[40px] flex items-center justify-center
                    font-bold text-base sm:text-lg rounded-md transition duration-300
                    ${assignedColor
                      ? `${assignedColor} text-white`
                      : isEnabled
                        ? 'bg-gray-600 text-white hover:bg-gray-500'
                        : 'bg-gray-600 text-white opacity-50 cursor-not-allowed'
                    }
                  `}
                  disabled={!isEnabled}
                >
                  {letter}
                </button>
              )
            })}
          </div>
        </div>

        {/* Substitutions Left */}
        <p className="text-center text-gray-300 text-sm mb-4">
          {substitutionsLeft} substitution{substitutionsLeft !== 1 ? 's' : ''} remaining
        </p>

        {/* Confirm Button */}
        <button
          onClick={confirmSubstitutions}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 px-6 rounded-xl transition duration-300 text-lg min-h-[52px]"
        >
          Make substitutions
        </button>
      </div>
    </div>
  )
}
