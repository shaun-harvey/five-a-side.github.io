import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'
import type { Player } from '../types/player'

const mockPlayers: Player[] = [
  { id: '1', name: 'Erling Haaland', hint: 'Norwegian striker at Man City', league: 'premier-league', category: 'modern', isActive: true },
  { id: '2', name: 'Kevin De Bruyne', hint: 'Belgian midfielder at Man City', league: 'premier-league', category: 'modern', isActive: true },
  { id: '3', name: 'Mohamed Salah', hint: 'Egyptian winger at Liverpool', league: 'premier-league', category: 'modern', isActive: true },
]

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGameStore.setState({
      phase: 'idle',
      currentRound: 1,
      selectedLeague: null,
      chosenLetters: [],
      availableLetters: ['A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'],
      vowelCount: 0,
      currentPlayer: null,
      displayedName: '',
      currentPlayerLetters: [],
      revealedLettersForCurrentPlayer: new Set(),
      score: 0,
      passesLeft: 3,
      substitutionsLeft: 2,
      varHintsLeft: 3,
      wrongGuesses: 0,
      roundScores: { 1: 0, 2: 0, 3: 0 },
      scoreAtRoundStart: 0,
      timeLeft: 60,
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
      players: {
        modern: mockPlayers,
        legend: [],
        obscure: [],
      },
    })
  })

  describe('setPlayers', () => {
    it('sets players for a category', () => {
      const store = useGameStore.getState()
      const newPlayers: Player[] = [
        { id: '100', name: 'Legend Player', hint: 'A legend', league: 'premier-league', category: 'legend', isActive: true },
      ]
      store.setPlayers('legend', newPlayers)

      expect(useGameStore.getState().players.legend).toEqual(newPlayers)
    })
  })

  describe('setSelectedLeague', () => {
    it('sets the selected league', () => {
      const store = useGameStore.getState()
      store.setSelectedLeague('premier-league')

      expect(useGameStore.getState().selectedLeague).toBe('premier-league')
    })
  })

  describe('resetGame', () => {
    it('resets game state while preserving league and players', () => {
      const store = useGameStore.getState()
      store.setSelectedLeague('premier-league')
      useGameStore.setState({ score: 100, wrongGuesses: 2 })

      store.resetGame()

      const state = useGameStore.getState()
      expect(state.score).toBe(0)
      expect(state.wrongGuesses).toBe(0)
      expect(state.selectedLeague).toBe('premier-league')
      expect(state.players.modern).toEqual(mockPlayers)
    })
  })

  describe('selectLetter', () => {
    it('adds letter to chosen letters', () => {
      const store = useGameStore.getState()
      store.selectLetter('A')

      const state = useGameStore.getState()
      expect(state.chosenLetters).toContain('A')
      expect(state.vowelCount).toBe(1)
    })

    it('removes letter from available letters', () => {
      const store = useGameStore.getState()
      store.selectLetter('A')

      expect(useGameStore.getState().availableLetters).not.toContain('A')
    })

    it('enforces vowel limit', () => {
      // Game only allows 1 vowel (REQUIRED_VOWELS = 1)
      useGameStore.getState().selectLetter('A')
      useGameStore.getState().selectLetter('E') // Should be ignored (max 1 vowel)

      expect(useGameStore.getState().vowelCount).toBe(1)
      expect(useGameStore.getState().chosenLetters).toContain('A')
      expect(useGameStore.getState().chosenLetters).not.toContain('E')
    })

    it('enforces consonant limit', () => {
      // Game allows 1 vowel and 4 consonants (REQUIRED_VOWELS = 1, REQUIRED_CONSONANTS = 4)
      // Select 1 vowel first
      useGameStore.getState().selectLetter('A')
      // Then 4 consonants
      useGameStore.getState().selectLetter('B')
      useGameStore.getState().selectLetter('C')
      useGameStore.getState().selectLetter('D')
      useGameStore.getState().selectLetter('F')
      // This should be ignored (max 4 consonants)
      useGameStore.getState().selectLetter('G')

      const state = useGameStore.getState()
      expect(state.chosenLetters.length).toBe(5) // 1 vowel + 4 consonants
      expect(state.chosenLetters).not.toContain('G')
    })
  })

  describe('deselectLetter', () => {
    it('removes letter from chosen letters', () => {
      const store = useGameStore.getState()
      store.selectLetter('A')
      store.deselectLetter('A')

      const state = useGameStore.getState()
      expect(state.chosenLetters).not.toContain('A')
      expect(state.vowelCount).toBe(0)
    })

    it('adds letter back to available letters', () => {
      const store = useGameStore.getState()
      store.selectLetter('A')
      store.deselectLetter('A')

      expect(useGameStore.getState().availableLetters).toContain('A')
    })
  })

  describe('canSelectLetter', () => {
    it('returns true when under limits', () => {
      const store = useGameStore.getState()
      expect(store.canSelectLetter('A')).toBe(true)
      expect(store.canSelectLetter('B')).toBe(true)
    })

    it('returns false when at vowel limit', () => {
      // Game only allows 1 vowel (REQUIRED_VOWELS = 1)
      useGameStore.getState().selectLetter('A')

      expect(useGameStore.getState().canSelectLetter('E')).toBe(false)
    })

    it('returns false when at consonant limit', () => {
      // Game allows 1 vowel and 4 consonants
      useGameStore.getState().selectLetter('A')
      useGameStore.getState().selectLetter('B')
      useGameStore.getState().selectLetter('C')
      useGameStore.getState().selectLetter('D')
      useGameStore.getState().selectLetter('F')

      expect(useGameStore.getState().canSelectLetter('G')).toBe(false)
    })
  })

  describe('addPoints', () => {
    it('adds points to score', () => {
      const store = useGameStore.getState()
      store.addPoints(100)

      expect(useGameStore.getState().score).toBe(100)
    })

    it('accumulates points', () => {
      const store = useGameStore.getState()
      store.addPoints(100)
      store.addPoints(50)

      expect(useGameStore.getState().score).toBe(150)
    })
  })

  describe('incrementStreak and resetStreak', () => {
    it('increments the correct streak', () => {
      const store = useGameStore.getState()
      store.incrementStreak()
      store.incrementStreak()

      expect(useGameStore.getState().correctStreak).toBe(2)
    })

    it('resets the streak to zero', () => {
      const store = useGameStore.getState()
      store.incrementStreak()
      store.incrementStreak()
      store.resetStreak()

      expect(useGameStore.getState().correctStreak).toBe(0)
    })
  })

  describe('usePass', () => {
    it('decrements passes left', () => {
      const store = useGameStore.getState()
      store.usePass()

      expect(useGameStore.getState().passesLeft).toBe(2)
    })

    it('returns false when no passes left', () => {
      useGameStore.setState({ passesLeft: 0 })
      const store = useGameStore.getState()

      expect(store.usePass()).toBe(false)
    })

    it('resets the streak', () => {
      useGameStore.setState({ correctStreak: 5 })
      const store = useGameStore.getState()
      store.usePass()

      expect(useGameStore.getState().correctStreak).toBe(0)
    })
  })

  describe('handleSubstitutionTimeout', () => {
    it('increments timeout count', () => {
      const store = useGameStore.getState()
      const result = store.handleSubstitutionTimeout()

      expect(result.timeoutCount).toBe(1)
      expect(result.allSubstitutionsLost).toBe(false)
    })

    it('loses all substitutions after 2 timeouts', () => {
      const store = useGameStore.getState()
      store.handleSubstitutionTimeout()
      const result = store.handleSubstitutionTimeout()

      expect(result.timeoutCount).toBe(2)
      expect(result.allSubstitutionsLost).toBe(true)
      expect(useGameStore.getState().substitutionsLeft).toBe(0)
    })
  })

  describe('incrementGuessAttempt', () => {
    it('increments guess attempt count', () => {
      const store = useGameStore.getState()
      const result = store.incrementGuessAttempt()

      expect(result).toBe(1)
      expect(useGameStore.getState().guessAttemptsForCurrentPlayer).toBe(1)
    })
  })

  describe('handleTimeWasting', () => {
    it('increments time wasting offenses', () => {
      const store = useGameStore.getState()
      const result = store.handleTimeWasting()

      expect(result.offenseCount).toBe(1)
      expect(result.shouldEndGame).toBe(false)
    })

    it('ends game after 3 offenses', () => {
      const store = useGameStore.getState()
      store.handleTimeWasting()
      store.handleTimeWasting()
      const result = store.handleTimeWasting()

      expect(result.offenseCount).toBe(3)
      expect(result.shouldEndGame).toBe(true)
    })

    it('also increments wrong guesses', () => {
      const store = useGameStore.getState()
      store.handleTimeWasting()

      expect(useGameStore.getState().wrongGuesses).toBe(1)
    })
  })

  describe('decrementTimer', () => {
    it('decrements timer when playing', () => {
      useGameStore.setState({ phase: 'playing', timeLeft: 60 })
      const store = useGameStore.getState()
      store.decrementTimer()

      expect(useGameStore.getState().timeLeft).toBe(59)
    })

    it('does not decrement when not playing', () => {
      useGameStore.setState({ phase: 'idle', timeLeft: 60 })
      const store = useGameStore.getState()
      store.decrementTimer()

      expect(useGameStore.getState().timeLeft).toBe(60)
    })
  })

  describe('endGame', () => {
    it('sets game over state', () => {
      const store = useGameStore.getState()
      store.endGame('completed')

      const state = useGameStore.getState()
      expect(state.phase).toBe('game-over')
      expect(state.isGameOver).toBe(true)
      expect(state.endReason).toBe('completed')
    })

    it('sets score to zero on tab switch', () => {
      useGameStore.setState({ score: 500 })
      const store = useGameStore.getState()
      store.endGame('tab-switch')

      expect(useGameStore.getState().score).toBe(0)
    })

    it('preserves score on normal completion', () => {
      useGameStore.setState({ score: 500 })
      const store = useGameStore.getState()
      store.endGame('completed')

      expect(useGameStore.getState().score).toBe(500)
    })
  })

  describe('useVARHint', () => {
    it('returns null when no player selected', () => {
      const store = useGameStore.getState()
      const result = store.useVARHint()

      expect(result).toBeNull()
    })

    it('returns hint and decrements count', () => {
      const player = mockPlayers[0]
      useGameStore.setState({
        currentPlayer: player,
        varHintsLeft: 3,
      })

      const store = useGameStore.getState()
      const result = store.useVARHint()

      expect(result).toBe(player.hint)
      expect(useGameStore.getState().varHintsLeft).toBe(2)
    })

    it('does not decrement when already hinted for this player', () => {
      const player = mockPlayers[0]
      useGameStore.setState({
        currentPlayer: player,
        varHintsLeft: 3,
        varHintedPlayers: new Set([player.name]),
      })

      const store = useGameStore.getState()
      const result = store.useVARHint()

      expect(result).toBe(player.hint)
      expect(useGameStore.getState().varHintsLeft).toBe(3) // Not decremented
    })

    it('returns null when no hints left', () => {
      const player = mockPlayers[0]
      useGameStore.setState({
        currentPlayer: player,
        varHintsLeft: 0,
      })

      const store = useGameStore.getState()
      const result = store.useVARHint()

      expect(result).toBeNull()
    })
  })

  describe('makeSubstitution', () => {
    it('returns false when no substitutions left', () => {
      useGameStore.setState({ substitutionsLeft: 0 })
      const store = useGameStore.getState()

      expect(store.makeSubstitution('A', 'E')).toBe(false)
    })

    it('returns false when mixing vowels and consonants', () => {
      useGameStore.setState({ substitutionsLeft: 2 })
      const store = useGameStore.getState()

      expect(store.makeSubstitution('A', 'B')).toBe(false) // Vowel for consonant
      expect(store.makeSubstitution('B', 'A')).toBe(false) // Consonant for vowel
    })

    it('successfully substitutes vowel for vowel', () => {
      useGameStore.setState({
        substitutionsLeft: 5,
        chosenLetters: ['A', 'B', 'C', 'D', 'F'],
        currentPlayer: mockPlayers[0],
        revealedLettersForCurrentPlayer: new Set(['A', 'B', 'C', 'D', 'F']),
      })
      const store = useGameStore.getState()
      const result = store.makeSubstitution('A', 'E')

      expect(result).toBe(true)
      const state = useGameStore.getState()
      expect(state.substitutionsLeft).toBe(4)
      expect(state.chosenLetters).toContain('E')
      expect(state.chosenLetters).not.toContain('A')
    })
  })
})
