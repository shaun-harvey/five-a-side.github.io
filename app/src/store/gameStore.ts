import { create } from 'zustand'
import type { Player, League } from '../types/player'
import type { GameState, RoundNumber, GuessResult } from '../types/game'
import { validateGuess, getWrongGuessMessage } from '../lib/game/guessValidator'
import { createDisplayName, isVowel } from '../lib/game/letterUtils'
import {
  VOWELS,
  CONSONANTS,
  MAX_WRONG_GUESSES,
  MAX_PASSES,
  MAX_SUBSTITUTIONS,
  INITIAL_VAR_HINTS,
  VAR_HINTS_ROUND_2_BONUS,
  VAR_HINTS_ROUND_3_BONUS,
  STREAK_FOR_VAR_BONUS,
  VAR_BONUS_HINTS,
  REQUIRED_VOWELS,
  REQUIRED_CONSONANTS,
  ROUND_CONFIGS,
} from '../lib/game/constants'

interface GameStore extends GameState {
  // Player pool (loaded from JSON)
  players: {
    modern: Player[]
    legend: Player[]
    obscure: Player[]
  }

  // Actions - Setup
  setPlayers: (category: 'modern' | 'legend' | 'obscure', players: Player[]) => void
  setSelectedLeague: (league: League) => void
  resetGame: () => void

  // Actions - Letter Selection
  selectLetter: (letter: string) => void
  deselectLetter: (letter: string) => void
  canSelectLetter: (letter: string) => boolean

  // Actions - Game Flow
  startGame: () => void
  startRound: (round: RoundNumber) => void
  selectRandomPlayer: () => void
  moveToNextPlayer: () => void
  endRound: () => void
  endGame: (reason: GameState['endReason']) => void

  // Actions - Player Actions
  processGuess: (guess: string) => GuessResult
  usePass: () => boolean
  makeSubstitution: (oldLetter: string, newLetter: string) => boolean
  useVARHint: () => string | null
  handleSubstitutionTimeout: () => { timeoutCount: number; allSubstitutionsLost: boolean }
  incrementGuessAttempt: () => number
  handleTimeWasting: () => { shouldEndGame: boolean; offenseCount: number }

  // Actions - Timer
  decrementTimer: () => void
  setTimeLeft: (time: number) => void

  // Actions - Scoring
  addPoints: (points: number) => void
  incrementStreak: () => void
  resetStreak: () => void
}

const initialState: GameState = {
  phase: 'idle',
  currentRound: 1,
  selectedLeague: null,
  chosenLetters: [],
  availableLetters: [...VOWELS, ...CONSONANTS],
  vowelCount: 0,
  currentPlayer: null,
  displayedName: '',
  currentPlayerLetters: [],
  revealedLettersForCurrentPlayer: new Set(),
  score: 0,
  passesLeft: MAX_PASSES,
  substitutionsLeft: MAX_SUBSTITUTIONS,
  varHintsLeft: INITIAL_VAR_HINTS,
  wrongGuesses: 0,
  roundScores: { 1: 0, 2: 0, 3: 0 },
  scoreAtRoundStart: 0,
  timeLeft: ROUND_CONFIGS[1].duration,
  correctStreak: 0,
  hasEarnedVARBonus: false,
  usedLetters: new Set(),
  usedPlayers: { 1: [], 2: [], 3: [] },
  varHintedPlayers: new Set(),
  guessAttemptsForCurrentPlayer: 0,
  timeWastingOffenses: 0,
  substitutionTimeoutCount: 0,
  isGameOver: false,
  endReason: undefined,
  varHintMessage: undefined,
  gameStartTime: undefined,
  gameDurationSeconds: 0,
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  players: {
    modern: [],
    legend: [],
    obscure: [],
  },

  // Setup Actions
  setPlayers: (category, players) => {
    set((state) => ({
      players: {
        ...state.players,
        [category]: players,
      },
    }))
  },

  setSelectedLeague: (league) => {
    set({ selectedLeague: league })
  },

  resetGame: () => {
    const { selectedLeague } = get()
    set({
      ...initialState,
      selectedLeague, // Keep selected league
      players: get().players, // Keep players loaded
    })
  },

  // Letter Selection
  selectLetter: (letter) => {
    const { chosenLetters, vowelCount } = get()
    const isVowelLetter = isVowel(letter)

    // Check constraints
    if (isVowelLetter && vowelCount >= REQUIRED_VOWELS) return
    if (!isVowelLetter && chosenLetters.length - vowelCount >= REQUIRED_CONSONANTS) return

    set((state) => ({
      chosenLetters: [...state.chosenLetters, letter.toUpperCase()],
      vowelCount: isVowelLetter ? state.vowelCount + 1 : state.vowelCount,
      availableLetters: state.availableLetters.filter(
        (l) => l !== letter.toUpperCase()
      ),
    }))

    // Check if selection complete
    const newState = get()
    if (newState.chosenLetters.length === REQUIRED_VOWELS + REQUIRED_CONSONANTS) {
      set({ phase: 'letter-selection' })
    }
  },

  deselectLetter: (letter) => {
    const isVowelLetter = isVowel(letter)

    set((state) => ({
      chosenLetters: state.chosenLetters.filter((l) => l !== letter.toUpperCase()),
      vowelCount: isVowelLetter ? state.vowelCount - 1 : state.vowelCount,
      availableLetters: [...state.availableLetters, letter.toUpperCase()].sort(),
    }))
  },

  canSelectLetter: (letter) => {
    const { chosenLetters, vowelCount } = get()
    const isVowelLetter = isVowel(letter)

    if (isVowelLetter) {
      return vowelCount < REQUIRED_VOWELS
    }
    return chosenLetters.length - vowelCount < REQUIRED_CONSONANTS
  },

  // Game Flow
  startGame: () => {
    const { chosenLetters } = get()
    if (chosenLetters.length !== REQUIRED_VOWELS + REQUIRED_CONSONANTS) return

    // Mark all chosen letters as used (can't be substituted back to)
    set({
      phase: 'playing',
      usedLetters: new Set(chosenLetters),
      gameStartTime: Date.now(),
    })
    get().startRound(1)
  },

  startRound: (round) => {
    const config = ROUND_CONFIGS[round]
    const { varHintsLeft } = get()

    // Handle VAR hints rollover and new allocations
    // Always give new hints for each round - don't punish players for using their VAR hints
    let newVarHints = varHintsLeft
    let varHintMessage: string | undefined

    if (round === 1) {
      newVarHints = INITIAL_VAR_HINTS // Start with 3 hints in round 1
    } else if (round === 2 || round === 3) {
      const bonusHints = round === 2 ? VAR_HINTS_ROUND_2_BONUS : VAR_HINTS_ROUND_3_BONUS
      // Always give the round bonus, plus carry over any remaining hints
      newVarHints = varHintsLeft + bonusHints
      if (varHintsLeft > 0) {
        varHintMessage = `You have ${newVarHints} VAR hints available (${bonusHints} new hints plus ${varHintsLeft} carried over)`
      } else {
        varHintMessage = `You have ${newVarHints} VAR hints available for this round`
      }
    }

    set({
      currentRound: round,
      timeLeft: config.duration,
      varHintsLeft: newVarHints,
      guessAttemptsForCurrentPlayer: 0,
      varHintMessage,
      phase: 'playing',
      scoreAtRoundStart: get().score,
    })

    get().selectRandomPlayer()
  },

  selectRandomPlayer: () => {
    const { players, currentRound, usedPlayers, chosenLetters, selectedLeague } = get()
    const config = ROUND_CONFIGS[currentRound]
    const pool = players[config.category]

    // Filter out used players and filter by selected league
    const usedSet = new Set(usedPlayers[currentRound])
    const available = pool.filter((p) => {
      // Must not be used
      if (usedSet.has(p.name)) return false
      // Filter by league if one is selected
      if (selectedLeague && p.league !== selectedLeague) return false
      return true
    })

    if (available.length === 0) {
      // No more players available for this round
      // Check if ANY players exist for this league/category (to give helpful message)
      const totalForLeague = pool.filter((p) =>
        !selectedLeague || p.league === selectedLeague
      ).length

      if (totalForLeague === 0) {
        console.warn(`No players available for ${selectedLeague} in ${config.category} category`)
      }

      get().endRound()
      return
    }

    // Select random player
    const player = available[Math.floor(Math.random() * available.length)]

    // Create a new set of revealed letters for this player (starts with current chosen letters)
    const revealedLetters = new Set(chosenLetters.map(l => l.toUpperCase()))
    const displayName = createDisplayName(player.name, [...revealedLetters])

    set((state) => ({
      currentPlayer: player,
      displayedName: displayName,
      currentPlayerLetters: player.name.toUpperCase().replace(/\s/g, '').split(''),
      revealedLettersForCurrentPlayer: revealedLetters,
      guessAttemptsForCurrentPlayer: 0,
      usedPlayers: {
        ...state.usedPlayers,
        [currentRound]: [...state.usedPlayers[currentRound], player.name],
      },
    }))
  },

  moveToNextPlayer: () => {
    set({ guessAttemptsForCurrentPlayer: 0 })
    get().selectRandomPlayer()
  },

  endRound: () => {
    const { currentRound, score, scoreAtRoundStart, roundScores } = get()

    // Calculate and save score for this round
    const roundScore = score - scoreAtRoundStart
    const updatedRoundScores = { ...roundScores, [currentRound]: roundScore }

    set({ roundScores: updatedRoundScores })

    if (currentRound < 3) {
      set({ phase: 'round-transition' })
      // Will start next round after transition
    } else {
      get().endGame('completed')
    }
  },

  endGame: (reason) => {
    // If cheating (tab switch), player gets ZERO points
    const scoreToSet = reason === 'tab-switch' ? 0 : get().score

    // Calculate game duration
    const { gameStartTime } = get()
    const duration = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0

    set({
      phase: 'game-over',
      isGameOver: true,
      endReason: reason,
      score: scoreToSet,
      gameDurationSeconds: duration,
    })
  },

  // Player Actions
  processGuess: (guess) => {
    const { currentPlayer, currentRound, correctStreak, hasEarnedVARBonus } = get()

    if (!currentPlayer) {
      return {
        correct: false,
        exactMatch: false,
        similarityScore: 0,
        message: 'No player selected',
      }
    }

    const result = validateGuess(guess, currentPlayer.name, currentPlayer.name)

    if (result.correct) {
      // Award points
      const config = ROUND_CONFIGS[currentRound]
      get().addPoints(config.pointsPerCorrect)
      get().incrementStreak()

      // Check for streak bonus (5 in a row = 5 bonus VAR hints)
      const newStreak = correctStreak + 1
      let bonusMessage: string | undefined
      if (newStreak >= STREAK_FOR_VAR_BONUS && !hasEarnedVARBonus) {
        set((state) => ({
          varHintsLeft: state.varHintsLeft + VAR_BONUS_HINTS,
          hasEarnedVARBonus: true,
        }))
        bonusMessage = "🏆 5 IN A ROW! You've earned 5 bonus VAR hints!"
      }

      // Move to next player
      get().moveToNextPlayer()

      // Return result with bonus message if earned
      return {
        ...result,
        bonusMessage,
      }
    } else {
      // Wrong guess
      set((state) => ({
        guessAttemptsForCurrentPlayer: state.guessAttemptsForCurrentPlayer + 1,
        wrongGuesses: state.wrongGuesses + 1,
      }))

      get().resetStreak()

      // Get the new wrong guess count and appropriate message
      const { wrongGuesses } = get()
      const wrongGuessInfo = getWrongGuessMessage(wrongGuesses)

      // Check for game over
      if (wrongGuesses >= MAX_WRONG_GUESSES) {
        get().endGame('three-strikes')
      } else {
        // Move to next player after wrong guess
        get().moveToNextPlayer()
      }

      // Return with proper message
      return {
        ...result,
        message: wrongGuessInfo.message,
      }
    }
  },

  usePass: () => {
    const { passesLeft } = get()
    if (passesLeft <= 0) return false

    set((state) => ({ passesLeft: state.passesLeft - 1 }))
    get().resetStreak()
    get().moveToNextPlayer()
    return true
  },

  makeSubstitution: (oldLetter, newLetter) => {
    const { substitutionsLeft, chosenLetters, revealedLettersForCurrentPlayer, currentPlayer } = get()
    if (substitutionsLeft <= 0) return false

    // Validate substitution
    const oldIsVowel = isVowel(oldLetter)
    const newIsVowel = isVowel(newLetter)
    if (oldIsVowel !== newIsVowel) return false

    // Make substitution in chosen letters
    const newChosenLetters = chosenLetters.map((l) =>
      l === oldLetter.toUpperCase() ? newLetter.toUpperCase() : l
    )

    // Add the NEW letter to revealed letters (old letter stays revealed for current player)
    const newRevealedLetters = new Set(revealedLettersForCurrentPlayer)
    newRevealedLetters.add(newLetter.toUpperCase())

    // Update display name using ALL revealed letters (includes old substituted-out letters)
    const newDisplayName = currentPlayer
      ? createDisplayName(currentPlayer.name, [...newRevealedLetters])
      : ''

    // Add the new letter to usedLetters (can't sub back to it later)
    const newUsedLetters = new Set(get().usedLetters)
    newUsedLetters.add(newLetter.toUpperCase())

    set((state) => ({
      substitutionsLeft: state.substitutionsLeft - 1,
      chosenLetters: newChosenLetters,
      revealedLettersForCurrentPlayer: newRevealedLetters,
      displayedName: newDisplayName,
      usedLetters: newUsedLetters,
      availableLetters: [
        ...state.availableLetters.filter((l) => l !== newLetter.toUpperCase()),
        oldLetter.toUpperCase(),
      ].sort(),
    }))

    return true
  },

  useVARHint: () => {
    const { varHintsLeft, currentPlayer, varHintedPlayers } = get()
    if (varHintsLeft <= 0 || !currentPlayer) return null

    // Check if already used VAR on this player
    if (varHintedPlayers.has(currentPlayer.name)) {
      return currentPlayer.hint // Return hint but don't deduct
    }

    set((state) => ({
      varHintsLeft: state.varHintsLeft - 1,
      varHintedPlayers: new Set([...state.varHintedPlayers, currentPlayer.name]),
    }))

    return currentPlayer.hint
  },

  handleSubstitutionTimeout: () => {
    const { substitutionTimeoutCount } = get()
    const newTimeoutCount = substitutionTimeoutCount + 1
    const allSubstitutionsLost = newTimeoutCount >= 2

    set({
      substitutionTimeoutCount: newTimeoutCount,
      ...(allSubstitutionsLost && { substitutionsLeft: 0 }),
    })

    return { timeoutCount: newTimeoutCount, allSubstitutionsLost }
  },

  incrementGuessAttempt: () => {
    const { guessAttemptsForCurrentPlayer } = get()
    const newAttempts = guessAttemptsForCurrentPlayer + 1
    set({ guessAttemptsForCurrentPlayer: newAttempts })
    return newAttempts
  },

  handleTimeWasting: () => {
    const { timeWastingOffenses, wrongGuesses } = get()
    const newOffenseCount = timeWastingOffenses + 1
    const newWrongGuesses = wrongGuesses + 1
    const shouldEndGame = newOffenseCount >= 3 || newWrongGuesses >= MAX_WRONG_GUESSES

    set({
      timeWastingOffenses: newOffenseCount,
      wrongGuesses: newWrongGuesses,
    })

    return { shouldEndGame, offenseCount: newOffenseCount }
  },

  // Timer
  decrementTimer: () => {
    const { timeLeft, phase } = get()
    if (phase !== 'playing') return

    if (timeLeft <= 1) {
      get().endRound()
    } else {
      set((state) => ({ timeLeft: state.timeLeft - 1 }))
    }
  },

  setTimeLeft: (time) => {
    set({ timeLeft: time })
  },

  // Scoring
  addPoints: (points) => {
    set((state) => ({ score: state.score + points }))
  },

  incrementStreak: () => {
    set((state) => ({ correctStreak: state.correctStreak + 1 }))
  },

  resetStreak: () => {
    // Only reset streak, NOT hasEarnedVARBonus (that only resets on new game)
    set({ correctStreak: 0 })
  },
}))
