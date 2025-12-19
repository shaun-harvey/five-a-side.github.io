import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useUIStore } from '../store/uiStore'
import { useAuth } from '../hooks/useAuth'
import { useTimer } from '../hooks/useTimer'
import { useAntiCheat } from '../hooks/useAntiCheat'
import { usePlayers } from '../hooks/usePlayers'
import { submitScore, updateUserStats, saveGameRecord } from '../lib/firebase/firestore'
import { LetterGrid } from '../components/game/LetterGrid'
import { PlayerCard } from '../components/game/PlayerCard'
import { Scoreboard } from '../components/game/Scoreboard'
import { GameControls } from '../components/game/GameControls'
import { GuessModal } from '../components/modals/GuessModal'
import { SubstituteModal } from '../components/modals/SubstituteModal'
import { VARModal } from '../components/modals/VARModal'
import { Leaderboard } from '../components/game/Leaderboard'
import { LeagueSelector } from '../components/game/LeagueSelector'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function GamePage() {
  const navigate = useNavigate()
  const { user, profile, isAuthenticated, isLoading: authLoading, isInitialized } = useAuth()

  // Load players on mount
  const { isLoaded: playersLoaded } = usePlayers()

  const phase = useGameStore((state) => state.phase)
  const currentRound = useGameStore((state) => state.currentRound)
  const score = useGameStore((state) => state.score)
  const endReason = useGameStore((state) => state.endReason)
  const resetGame = useGameStore((state) => state.resetGame)
  const startRound = useGameStore((state) => state.startRound)
  const chosenLetters = useGameStore((state) => state.chosenLetters)
  const varHintMessage = useGameStore((state) => state.varHintMessage)

  const feedback = useUIStore((state) => state.feedback)
  const clearFeedback = useUIStore((state) => state.clearFeedback)
  const showFeedback = useUIStore((state) => state.showFeedback)

  // Start timer during gameplay
  useTimer()

  // Anti-cheat: detect tab switching
  useAntiCheat({
    enabled: phase === 'playing',
    onCheatDetected: () => {
      console.log('Anti-cheat: tab switch detected')
    },
  })


  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/login')
    }
  }, [isInitialized, isAuthenticated, navigate])

  // Handle round transitions
  useEffect(() => {
    if (phase === 'round-transition') {
      const nextRound = (currentRound + 1) as 1 | 2 | 3
      const timer = setTimeout(() => {
        startRound(nextRound)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [phase, currentRound, startRound])

  // Show VAR hint message when rounds 2 or 3 start (like the original)
  useEffect(() => {
    if (varHintMessage && (currentRound === 2 || currentRound === 3)) {
      showFeedback({
        type: varHintMessage.includes('No VAR hints') ? 'warning' : 'info',
        message: varHintMessage,
        duration: 3000,
      })
    }
  }, [varHintMessage, currentRound, showFeedback])

  // Track if we've submitted the score to prevent duplicate submissions
  const hasSubmittedScore = useRef(false)
  // Track when to refresh leaderboard
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0)
  // Track whether to show the leaderboard (after a brief delay for score celebration)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Submit score when game ends
  useEffect(() => {
    const submitGameScore = async () => {
      if (phase === 'game-over' && user && !hasSubmittedScore.current) {
        hasSubmittedScore.current = true

        try {
          const displayName = profile?.displayName || user.email || 'Anonymous'

          // Submit to leaderboard
          await submitScore(user.uid, displayName, score, profile?.photoURL)

          // Update user stats
          const gameState = useGameStore.getState()
          const correctGuesses = Math.floor(score / 3)
          // Calculate used values from initial minus remaining
          const passesUsed = 5 - gameState.passesLeft
          const substitutionsUsed = 5 - gameState.substitutionsLeft
          const varHintsUsed = 3 - Math.min(gameState.varHintsLeft, 3) // Account for bonuses
          // Map endReason to the expected types
          const mappedEndReason = gameState.endReason === 'tab-switch' || gameState.endReason === 'timeout'
            ? 'cheating' as const
            : (gameState.endReason || 'completed') as 'completed' | 'three-strikes' | 'cheating'

          await updateUserStats(user.uid, {
            score,
            correctGuesses,
            wrongGuesses: gameState.wrongGuesses,
            passesUsed: Math.max(0, passesUsed),
            substitutionsUsed: Math.max(0, substitutionsUsed),
            varHintsUsed: Math.max(0, varHintsUsed),
            endReason: mappedEndReason,
            roundReached: gameState.currentRound as 1 | 2 | 3,
            durationSeconds: gameState.gameDurationSeconds,
            longestStreakInGame: gameState.correctStreak || 0,
            round1Score: gameState.roundScores[1],
            round2Score: gameState.roundScores[2],
            round3Score: gameState.roundScores[3],
          })

          // Save game record to user's game history
          await saveGameRecord(user.uid, {
            score,
            correctGuesses,
            wrongGuesses: gameState.wrongGuesses,
            passesUsed: Math.max(0, passesUsed),
            substitutionsUsed: Math.max(0, substitutionsUsed),
            varHintsUsed: Math.max(0, varHintsUsed),
            endReason: mappedEndReason,
            roundReached: gameState.currentRound as 1 | 2 | 3,
            totalDurationSeconds: gameState.gameDurationSeconds,
            chosenLetters: gameState.chosenLetters,
            longestStreakInGame: gameState.correctStreak || 0,
            rounds: {},
            round1Score: gameState.roundScores[1],
            round2Score: gameState.roundScores[2],
            round3Score: gameState.roundScores[3],
          })

          console.log('Score submitted successfully:', score)

          // Trigger leaderboard refresh after score is submitted
          setLeaderboardRefreshKey(prev => prev + 1)

          // Show leaderboard after brief delay for data to sync
          setTimeout(() => {
            setShowLeaderboard(true)
          }, 1500)
        } catch (error) {
          console.error('Failed to submit score:', error)
          showFeedback({
            type: 'error',
            message: 'Failed to save your score. Please check your connection.',
            duration: 5000,
          })
        }
      }
    }

    submitGameScore()
  }, [phase, user, profile, score])

  // Reset score submission flag and leaderboard visibility when game resets
  useEffect(() => {
    if (phase === 'idle') {
      hasSubmittedScore.current = false
      setShowLeaderboard(false)
    }
  }, [phase])

  const handlePlayAgain = () => {
    resetGame()
  }

  const getRoundInfo = () => {
    if (phase === 'game-over') {
      if (endReason === 'tab-switch') {
        return 'GAME OVER - You should get 115 charges for that type of cheating!'
      }
      if (endReason === 'three-strikes') {
        return "That's a shocking tackle! Get off the pitch!"
      }
      return `The ref has blown the final whistle. You picked up: ${score} points`
    }
    switch (currentRound) {
      case 1:
        return 'Round 1: Guess the current Premier League player!'
      case 2:
        return 'Round 2: Guess the Premier League legend!'
      case 3:
        return 'Round 3: Guess the forgotten Premier League star!'
      default:
        return ''
    }
  }

  // Show loading while checking auth
  if (!isInitialized || authLoading) {
    return <LoadingSpinner />
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-3 py-4 sm:p-4 text-gray-100 text-base sm:text-lg">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-lg shadow-lg transition-all ${
            feedback.type === 'success'
              ? 'bg-green-500 text-white'
              : feedback.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-yellow-500 text-black'
          }`}
          onClick={clearFeedback}
        >
          {feedback.message}
        </div>
      )}

      {/* Main Game Container */}
      <div className="bg-stadium rounded-2xl shadow-2xl p-3 sm:p-6 w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl space-y-3 sm:space-y-4 relative grass-texture border-2 border-white/30 overflow-visible">
        {/* League Selector - Top Right (only during letter selection) */}
        {(phase === 'idle' || phase === 'letter-selection') && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50">
            <LeagueSelector />
          </div>
        )}

        {/* Logo */}
        <div className="flex justify-center pt-1 sm:pt-2 -mb-1 sm:-mb-2">
          <img src="/images/logo.png" alt="five-a-side" className="h-16 sm:h-24 md:h-28 w-auto" />
        </div>

        {/* Round Info */}
        {(phase === 'playing' || phase === 'game-over') && (
          <div id="round-info" className="text-trophy-gold text-lg sm:text-xl font-semibold text-center mt-2 mb-4 drop-shadow-md">
            {getRoundInfo()}
          </div>
        )}

        {/* Loading Players */}
        {!playersLoaded && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-12 h-12 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-white/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-trophy-gold animate-spin" />
            </div>
            <p className="text-gray-300">Loading players...</p>
          </div>
        )}

        {/* Letter Selection Phase */}
        {playersLoaded && (phase === 'idle' || phase === 'letter-selection') && (
          <LetterGrid />
        )}

        {/* Playing Phase */}
        {phase === 'playing' && (
          <div>
            {/* Scoreboard */}
            <Scoreboard />

            {/* Player Card */}
            <PlayerCard />

            {/* Current Team */}
            <div id="current-team" className="text-center text-sm sm:text-base font-semibold mb-2 text-white">
              Your current team: {chosenLetters.join(' ')}
            </div>

            {/* Game Controls */}
            <GameControls />
          </div>
        )}

        {/* Round Transition */}
        {phase === 'round-transition' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Round {currentRound} Complete!
              </h2>
              <p className="text-xl text-gray-300 mb-2">
                Current Score: {score}
              </p>
              <p className="text-gray-400">
                {currentRound < 3
                  ? `Round ${currentRound + 1} starting...`
                  : 'Final results coming up...'}
              </p>
              <div className="mt-8">
                <div className="animate-pulse h-2 w-32 bg-green-500 rounded-full mx-auto" />
              </div>
            </div>
          </div>
        )}

        {/* Game Over - Score Celebration */}
        {phase === 'game-over' && !showLeaderboard && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-trophy-gold mb-4">
                {endReason === 'tab-switch' ? '🚨 Game Over!' : '🏆 Final Whistle!'}
              </h2>
              <p className="text-2xl md:text-3xl text-white mb-2">
                {endReason === 'tab-switch'
                  ? 'You should get 115 charges for that type of cheating!'
                  : endReason === 'three-strikes'
                  ? "That's a shocking tackle! Get off the pitch!"
                  : `You scored ${score} points!`}
              </p>
              <p className="text-gray-400 mt-4">
                Loading leaderboard...
              </p>
              <div className="mt-6">
                <div className="animate-pulse h-2 w-32 bg-trophy-gold rounded-full mx-auto" />
              </div>
            </div>
          </div>
        )}

        {/* Game Over - Show Leaderboard */}
        {phase === 'game-over' && showLeaderboard && (
          <div className="space-y-6">
            {/* Leaderboard */}
            <Leaderboard showTitle={true} limit={10} refreshKey={leaderboardRefreshKey} />

            {/* New Game Button */}
            <button
              id="new-game"
              onClick={handlePlayAgain}
              className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 font-bold py-3 px-4 rounded-lg transition duration-300 text-lg sm:text-xl text-white border-2 border-white/30 shadow-lg"
            >
              New Game
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <GuessModal />
      <SubstituteModal />
      <VARModal />
    </div>
  )
}
