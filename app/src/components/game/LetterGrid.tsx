import { useGameStore } from '../../store/gameStore'
import { useAuthStore } from '../../store/authStore'
import { VOWELS, CONSONANTS, REQUIRED_VOWELS, REQUIRED_CONSONANTS } from '../../lib/game/constants'

export function LetterGrid() {
  const chosenLetters = useGameStore((state) => state.chosenLetters)
  const vowelCount = useGameStore((state) => state.vowelCount)
  const selectLetter = useGameStore((state) => state.selectLetter)
  const deselectLetter = useGameStore((state) => state.deselectLetter)
  const startGame = useGameStore((state) => state.startGame)
  const setSelectedLeague = useGameStore((state) => state.setSelectedLeague)
  const profile = useAuthStore((state) => state.profile)

  const consonantCount = chosenLetters.length - vowelCount
  const canStartGame = chosenLetters.length === REQUIRED_VOWELS + REQUIRED_CONSONANTS

  const isLetterChosen = (letter: string) => chosenLetters.includes(letter)
  const canChooseVowel = vowelCount < REQUIRED_VOWELS
  const canChooseConsonant = consonantCount < REQUIRED_CONSONANTS

  const handleLetterClick = (letter: string, isVowel: boolean) => {
    if (isLetterChosen(letter)) {
      deselectLetter(letter)
    } else {
      if (isVowel && canChooseVowel) {
        selectLetter(letter)
      } else if (!isVowel && canChooseConsonant) {
        selectLetter(letter)
      }
    }
  }

  const vowelsNeeded = REQUIRED_VOWELS - vowelCount
  const consonantsNeeded = REQUIRED_CONSONANTS - consonantCount

  return (
    <div className="space-y-3 sm:space-y-5 py-1 sm:py-2">
      {/* Vowels Section */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="h-px bg-white/20 flex-1 max-w-[40px] sm:max-w-[60px]" />
          <h3 className="text-white font-semibold text-xs sm:text-sm tracking-wide uppercase">
            Vowels
            <span className={`ml-1.5 sm:ml-2 text-xs font-normal ${vowelsNeeded > 0 ? 'text-trophy-gold' : 'text-green-400'}`}>
              {vowelsNeeded > 0 ? `(${vowelsNeeded})` : '✓'}
            </span>
          </h3>
          <div className="h-px bg-white/20 flex-1 max-w-[40px] sm:max-w-[60px]" />
        </div>

        <div className="flex justify-center gap-2 sm:gap-2.5">
          {VOWELS.map((letter) => {
            const isSelected = isLetterChosen(letter)
            const isDisabled = !isSelected && !canChooseVowel

            return (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter, true)}
                disabled={isDisabled}
                className={`
                  relative w-12 h-12 sm:w-14 sm:h-14
                  text-xl sm:text-2xl font-bold
                  rounded-lg
                  transition-all duration-150
                  ${isSelected
                    ? 'bg-gray-900 text-trophy-gold border-2 border-trophy-gold'
                    : 'bg-gray-800 text-white border-2 border-gray-600 hover:border-white/50 hover:bg-gray-700'
                  }
                  ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {letter}
              </button>
            )
          })}
        </div>
      </div>

      {/* Consonants Section */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="h-px bg-white/20 flex-1 max-w-[40px] sm:max-w-[60px]" />
          <h3 className="text-white font-semibold text-xs sm:text-sm tracking-wide uppercase">
            Consonants
            <span className={`ml-1.5 sm:ml-2 text-xs font-normal ${consonantsNeeded > 0 ? 'text-trophy-gold' : 'text-green-400'}`}>
              {consonantsNeeded > 0 ? `(${consonantsNeeded})` : '✓'}
            </span>
          </h3>
          <div className="h-px bg-white/20 flex-1 max-w-[40px] sm:max-w-[60px]" />
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-2.5 max-w-[340px] sm:max-w-md mx-auto">
          {CONSONANTS.map((letter) => {
            const isSelected = isLetterChosen(letter)
            const isDisabled = !isSelected && !canChooseConsonant

            return (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter, false)}
                disabled={isDisabled}
                className={`
                  relative w-11 h-11 sm:w-12 sm:h-12
                  text-lg sm:text-xl font-bold
                  rounded-lg
                  transition-all duration-150
                  ${isSelected
                    ? 'bg-trophy-gold text-gray-900 border-2 border-yellow-600'
                    : 'bg-white text-gray-800 border-2 border-gray-300 hover:bg-gray-100'
                  }
                  ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {letter}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Letters Display */}
      <div className="text-center py-2 sm:py-3">
        <div className="inline-flex items-center gap-2 sm:gap-3 bg-black/30 rounded-xl px-4 py-3 sm:px-5 sm:py-4 border border-white/10">
          <span className="text-white/70 text-sm sm:text-base font-medium">Squad:</span>
          <div className="flex gap-1.5 sm:gap-2">
            {[...Array(5)].map((_, i) => {
              const letter = chosenLetters[i]
              const isVowel = letter && VOWELS.includes(letter)
              return (
                <div
                  key={i}
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center
                    text-lg sm:text-xl font-bold
                    ${letter
                      ? isVowel
                        ? 'bg-gray-900 text-trophy-gold border-2 border-trophy-gold'
                        : 'bg-trophy-gold text-gray-900 border-2 border-yellow-600'
                      : 'bg-gray-800/50 border-2 border-dashed border-gray-600 text-gray-600'
                    }
                  `}
                >
                  {letter || '?'}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Start Game Button */}
      <div>
        <button
          id="start-game"
          onClick={() => {
            // Sync selected league from user profile to game store
            if (profile?.selectedLeague) {
              setSelectedLeague(profile.selectedLeague)
            }
            startGame()
          }}
          disabled={!canStartGame}
          className={`
            w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg
            text-base sm:text-xl font-bold
            transition-all duration-300
            ${canStartGame
              ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }
            border-2 border-white/20
          `}
        >
          {canStartGame ? 'Kick Off!' : `Select ${vowelsNeeded + consonantsNeeded} more`}
        </button>
      </div>
    </div>
  )
}
