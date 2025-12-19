import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'

export function GameControls() {
  const passesLeft = useGameStore((state) => state.passesLeft)
  const substitutionsLeft = useGameStore((state) => state.substitutionsLeft)
  const varHintsLeft = useGameStore((state) => state.varHintsLeft)
  const phase = useGameStore((state) => state.phase)
  const currentPlayer = useGameStore((state) => state.currentPlayer)
  const varHintedPlayers = useGameStore((state) => state.varHintedPlayers)
  const incrementGuessAttempt = useGameStore((state) => state.incrementGuessAttempt)
  const handleTimeWasting = useGameStore((state) => state.handleTimeWasting)
  const endGame = useGameStore((state) => state.endGame)
  const moveToNextPlayer = useGameStore((state) => state.moveToNextPlayer)

  const openModal = useUIStore((state) => state.openModal)
  const showFeedback = useUIStore((state) => state.showFeedback)

  const isPlaying = phase === 'playing'

  const handlePass = () => {
    const usePass = useGameStore.getState().usePass
    const success = usePass()
    if (success) {
      // Show pass feedback message like original
      showFeedback({
        type: 'warning',
        message: "That's a sideways pass! Next player...",
        duration: 2000,
      })
    } else {
      showFeedback({
        type: 'error',
        message: 'No passes left!',
      })
    }
  }

  const handleVAR = () => {
    if (!currentPlayer) return

    // Check if VAR has already been used on this player (like original)
    if (varHintedPlayers.has(currentPlayer.name)) {
      showFeedback({
        type: 'error',
        message: "You've already used VAR on this player!",
      })
      return
    }

    if (varHintsLeft <= 0) {
      showFeedback({
        type: 'error',
        message: "You can't go to VAR!",
      })
      return
    }

    openModal('var')
  }

  const handleGuess = () => {
    // Increment guess attempts for current player
    const newAttempts = incrementGuessAttempt()

    // Check for time wasting (3 or more attempts on the same player)
    if (newAttempts > 2) {
      const { shouldEndGame, offenseCount } = handleTimeWasting()

      // Show time wasting message with appropriate colors (matching original)
      let message: string
      let type: 'success' | 'warning' | 'error'

      switch (offenseCount) {
        case 1:
          message = "That's a warning for time wasting! Get on with the game!"
          type = 'success' // Green
          break
        case 2:
          message = "That's a booking for time wasting! Get on with the game!"
          type = 'warning' // Yellow
          break
        case 3:
        default:
          message = "I can't believe you have got yourself sent off for time wasting!"
          type = 'error' // Red
          break
      }

      showFeedback({ type, message, duration: 2000 })

      // Check for game over
      if (shouldEndGame) {
        endGame('three-strikes')
        return
      }

      // Move to next player without opening modal
      moveToNextPlayer()
      return
    }

    // Open guess modal normally
    openModal('guess')
  }

  return (
    <div id="game-controls" className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 px-1">
      {/* Guess Button */}
      <button
        id="guess"
        onClick={handleGuess}
        disabled={!isPlaying}
        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-4 sm:py-3 px-4 rounded-lg transition duration-300 text-base sm:text-base text-white border border-white/20 min-h-[48px]"
      >
        Guess
      </button>

      {/* Pass Button */}
      <button
        id="pass"
        onClick={handlePass}
        disabled={!isPlaying || passesLeft === 0}
        className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-4 sm:py-3 px-4 rounded-lg transition duration-300 text-base sm:text-base text-white min-h-[48px]"
      >
        Pass
      </button>

      {/* Substitute Button */}
      <button
        id="substitute"
        onClick={() => openModal('substitute')}
        disabled={!isPlaying || substitutionsLeft === 0}
        className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-4 sm:py-3 px-4 rounded-lg transition duration-300 text-base sm:text-base text-gray-900 min-h-[48px]"
      >
        Sub
      </button>

      {/* VAR Button */}
      <button
        id="var"
        onClick={handleVAR}
        disabled={!isPlaying || varHintsLeft === 0}
        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-4 sm:py-3 px-4 rounded-lg transition duration-300 text-base sm:text-base text-white min-h-[48px]"
      >
        VAR
      </button>
    </div>
  )
}
