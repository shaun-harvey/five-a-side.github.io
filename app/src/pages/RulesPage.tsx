import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function RulesPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-10">
        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-bold text-center text-white">
          How to Play
        </h1>

        {/* Game Overview */}
        <section>
          <p className="text-base sm:text-xl text-gray-200 text-center max-w-2xl mx-auto">
            Pick your letters, then guess footballers whose names contain those letters.
            Simple as that.
          </p>
        </section>

        {/* Step by Step */}
        <section className="space-y-4 sm:space-y-6">
          {/* Step 1 */}
          <div className="bg-stadium rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-white/30 grass-texture">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl font-bold text-white">1</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Pick Your Letters</h2>
            </div>
            <p className="text-base sm:text-lg text-gray-300">
              Choose <span className="font-bold text-yellow-400">1 vowel</span> and <span className="font-bold text-yellow-400">4 consonants</span>.
              You'll see each player's name with only your chosen letters shown — the rest are hidden. Use the letters to work out who the player is!
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-stadium rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-white/30 grass-texture">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl font-bold text-white">2</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Guess the Players</h2>
            </div>
            <p className="text-base sm:text-lg text-gray-300 mb-4">
              Type the player's name. Don't worry about perfect spelling - close guesses count!
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center flex flex-col border border-white/10">
                <p className="text-base sm:text-lg font-bold text-white">Round 1</p>
                <p className="text-xs sm:text-sm text-gray-400 flex-1 flex items-center justify-center">Modern Stars</p>
                <p className="text-green-400 font-bold text-sm sm:text-base">3 pts</p>
              </div>
              <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center flex flex-col border border-white/10">
                <p className="text-base sm:text-lg font-bold text-white">Round 2</p>
                <p className="text-xs sm:text-sm text-gray-400 flex-1 flex items-center justify-center">Legends</p>
                <p className="text-green-400 font-bold text-sm sm:text-base">3 pts</p>
              </div>
              <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center flex flex-col border border-white/10">
                <p className="text-base sm:text-lg font-bold text-white">Round 3</p>
                <p className="text-xs sm:text-sm text-gray-400 flex-1 flex items-center justify-center">Forgotten Heroes</p>
                <p className="text-yellow-400 font-bold text-sm sm:text-base">6 pts</p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-stadium rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-white/30 grass-texture">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl font-bold text-white">3</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Use Your Tactics</h2>
            </div>
            <div className="space-y-3 text-base sm:text-lg text-gray-300">
              <p><span className="font-bold text-white">Pass</span> — Skip to the next player (5 per game)</p>
              <p><span className="font-bold text-white">Substitute</span> — Swap out one of your letters (5 per game)</p>
              <p><span className="font-bold text-purple-400">VAR</span> — Get a hint about the player (3 per game)</p>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="bg-stadium rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-white/30 grass-texture">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Yellow & Red Cards</h2>
          <p className="text-base sm:text-lg text-gray-300 mb-3 sm:mb-4">
            You get 3 chances. Wrong guesses earn cards:
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-base sm:text-lg">
            <span className="text-white font-bold">1st: Warning</span>
            <span className="text-xl sm:text-2xl text-white">→</span>
            <span className="text-yellow-400 font-bold">2nd: Yellow</span>
            <span className="text-xl sm:text-2xl text-white">→</span>
            <span className="text-red-500 font-bold">3rd: Red!</span>
          </div>
        </section>

        {/* Streaks */}
        <section className="bg-stadium rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-white/30 grass-texture">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Streaks</h2>
          <p className="text-base sm:text-lg text-gray-300 mb-3 sm:mb-4">
            At any point in the game, get <span className="font-bold text-yellow-300">5 correct guesses in a row</span> and you'll earn <span className="font-bold text-purple-400">5 bonus VAR hints</span>!
          </p>
          <p className="text-base sm:text-lg text-gray-300">
            Be careful though — a wrong guess or using a pass resets your streak back to zero. You can only earn this bonus once per game.
          </p>
        </section>

        {/* Warning */}
        <section className="bg-red-600/20 border-2 border-red-500 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-3 sm:mb-4">Fair Play</h2>
          <div className="space-y-3 sm:space-y-4 text-base sm:text-lg text-gray-300">
            <p>
              <span className="font-bold text-white">No cheating:</span> Don't switch tabs to look up answers — that's an instant red card and zero points!
            </p>
            <p>
              <span className="font-bold text-white">No time wasting:</span> You can only open and close the guess modal twice per player. On the 3rd attempt, you'll be penalized for time wasting and moved to the next player. Three time wasting offenses = red card!
            </p>
          </div>
        </section>

        {/* Play Button */}
        <Link
          to={isAuthenticated ? '/play' : '/login'}
          className="block w-full bg-green-600 hover:bg-green-700 font-bold py-4 sm:py-5 px-6 rounded-xl transition duration-300 text-lg sm:text-xl text-white text-center"
        >
          {isAuthenticated ? 'Play Now' : 'Sign In to Play'}
        </Link>
      </div>
    </div>
  )
}
