import { useGameStore } from '../../store/gameStore'
import { ROUND_CONFIGS, MAX_WRONG_GUESSES } from '../../lib/game/constants'

export function Scoreboard() {
  const timeLeft = useGameStore((state) => state.timeLeft)
  const currentRound = useGameStore((state) => state.currentRound)
  const score = useGameStore((state) => state.score)
  const wrongGuesses = useGameStore((state) => state.wrongGuesses)
  const passesLeft = useGameStore((state) => state.passesLeft)
  const substitutionsLeft = useGameStore((state) => state.substitutionsLeft)
  const varHintsLeft = useGameStore((state) => state.varHintsLeft)

  const roundConfig = ROUND_CONFIGS[currentRound]
  const guessesLeft = MAX_WRONG_GUESSES - wrongGuesses

  // Calculate timer bar width percentage
  const timerPercentage = (timeLeft / roundConfig.duration) * 100

  return (
    <div id="game-info-section">
      {/* Timer Bar */}
      <div className="w-full bg-deep-green rounded-full h-2 sm:h-3 mb-2 sm:mb-4 border border-white/10">
        <div
          className="bg-red-700 h-2 sm:h-3 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${timerPercentage}%` }}
        />
      </div>

      {/* Scoreboard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4 p-3 scoreboard rounded-lg">
        {/* Timer */}
        <div className="bg-red-700 rounded-lg p-2 font-bold text-sm sm:text-base text-white border border-white/20 score-item whitespace-nowrap">
          <span>Time: {timeLeft}s</span>
        </div>

        {/* Guesses */}
        <div className="bg-green-700 rounded-lg p-2 font-bold text-sm sm:text-base text-white score-item whitespace-nowrap">
          <span>Guesses: {guessesLeft}</span>
        </div>

        {/* Passes */}
        <div className="bg-blue-700 rounded-lg p-2 font-bold text-sm sm:text-base text-white score-item whitespace-nowrap">
          <span>Passes: {passesLeft}</span>
        </div>

        {/* Substitutions */}
        <div className="bg-yellow-500 rounded-lg p-2 font-bold text-sm sm:text-base text-gray-900 score-item whitespace-nowrap">
          <span>Subs: {substitutionsLeft}</span>
        </div>

        {/* VAR Hints */}
        <div className="bg-purple-600 rounded-lg p-2 font-bold text-sm sm:text-base text-white score-item whitespace-nowrap">
          <span>VAR: {varHintsLeft}</span>
        </div>

        {/* Score/Points */}
        <div className="bg-trophy-gold rounded-lg p-2 font-bold text-sm sm:text-base text-gray-900 border-2 border-yellow-600 score-item whitespace-nowrap">
          <span>Points: {score}</span>
        </div>
      </div>
    </div>
  )
}
