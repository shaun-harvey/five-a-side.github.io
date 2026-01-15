import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useUIStore } from '../store/uiStore'
import { useAuth } from '../hooks/useAuth'
import { useTimer } from '../hooks/useTimer'
import { useAntiCheat } from '../hooks/useAntiCheat'
import { usePlayers } from '../hooks/usePlayers'
import { submitScore, updateUserStats, saveGameRecord } from '../lib/firebase/firestore'
import { getChallengeById, submitChallengeScore } from '../lib/firebase/challenges'
import { getTournamentById, getTournamentMatchById, submitTournamentMatchScore } from '../lib/firebase/tournaments'
import type { Challenge, Tournament, TournamentMatch } from '../types/multiplayer'
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
  const [searchParams] = useSearchParams()
  const { user, profile, isAuthenticated, isLoading: authLoading, isInitialized } = useAuth()

  // Challenge mode
  const challengeId = searchParams.get('challenge')
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [isChallengeMode, setIsChallengeMode] = useState(false)
  const [challengeSubmitted, setChallengeSubmitted] = useState(false)

  // Tournament mode
  const tournamentId = searchParams.get('tournament')
  const matchId = searchParams.get('match')
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [tournamentMatch, setTournamentMatch] = useState<TournamentMatch | null>(null)
  const [isTournamentMode, setIsTournamentMode] = useState(false)
  const [tournamentSubmitted, setTournamentSubmitted] = useState(false)

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

  // Load challenge data if in challenge mode
  useEffect(() => {
    const loadChallenge = async () => {
      if (challengeId && user) {
        try {
          const challengeData = await getChallengeById(challengeId)
          if (challengeData) {
            // Verify user is a participant
            if (challengeData.challengerId === user.uid || challengeData.opponentId === user.uid) {
              setChallenge(challengeData)
              setIsChallengeMode(true)
            } else {
              showFeedback({ type: 'error', message: 'You are not part of this challenge' })
              navigate('/challenges')
            }
          } else {
            showFeedback({ type: 'error', message: 'Challenge not found' })
            navigate('/challenges')
          }
        } catch (error) {
          console.error('Failed to load challenge:', error)
          showFeedback({ type: 'error', message: 'Failed to load challenge' })
        }
      }
    }

    loadChallenge()
  }, [challengeId, user, navigate, showFeedback])

  // Load tournament data if in tournament mode
  useEffect(() => {
    const loadTournament = async () => {
      if (tournamentId && matchId && user) {
        try {
          const [tournamentData, matchData] = await Promise.all([
            getTournamentById(tournamentId),
            getTournamentMatchById(tournamentId, matchId),
          ])

          if (tournamentData && matchData) {
            // Verify user is a participant in this match
            if (matchData.player1Id === user.uid || matchData.player2Id === user.uid) {
              setTournament(tournamentData)
              setTournamentMatch(matchData)
              setIsTournamentMode(true)
            } else {
              showFeedback({ type: 'error', message: 'You are not part of this match' })
              navigate(`/tournaments/${tournamentId}`)
            }
          } else {
            showFeedback({ type: 'error', message: 'Tournament or match not found' })
            navigate('/tournaments')
          }
        } catch (error) {
          console.error('Failed to load tournament:', error)
          showFeedback({ type: 'error', message: 'Failed to load tournament' })
        }
      }
    }

    loadTournament()
  }, [tournamentId, matchId, user, navigate, showFeedback])

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

          // Update user stats
          const gameState = useGameStore.getState()
          // Calculate correct guesses from round scores (rounds 1&2: 3 pts each, round 3: 6 pts each)
          const correctGuesses = Math.floor((gameState.roundScores[1] || 0) / 3)
            + Math.floor((gameState.roundScores[2] || 0) / 3)
            + Math.floor((gameState.roundScores[3] || 0) / 6)
          // Calculate used values from initial minus remaining
          const passesUsed = 5 - gameState.passesLeft
          const substitutionsUsed = 5 - gameState.substitutionsLeft
          const varHintsUsed = 3 - Math.min(gameState.varHintsLeft, 3) // Account for bonuses
          // Map endReason to the expected types
          const mappedEndReason = gameState.endReason === 'tab-switch' || gameState.endReason === 'timeout'
            ? 'cheating' as const
            : (gameState.endReason || 'completed') as 'completed' | 'three-strikes' | 'cheating'

          // Only submit to leaderboard if player didn't cheat AND has a score > 0
          if (mappedEndReason !== 'cheating' && score > 0) {
            await submitScore(user.uid, displayName, score, profile?.photoURL)
          }

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

          // If this is a challenge game, submit the score to the challenge
          if (isChallengeMode && challengeId && !challengeSubmitted) {
            try {
              await submitChallengeScore(challengeId, user.uid, score, `game-${user.uid}-${Date.now()}`)
              setChallengeSubmitted(true)
              showFeedback({ type: 'success', message: 'Challenge score submitted!', duration: 3000 })
            } catch (error) {
              console.error('Failed to submit challenge score:', error)
              showFeedback({ type: 'error', message: 'Failed to submit challenge score' })
            }
          }

          // If this is a tournament match, submit the score
          if (isTournamentMode && tournamentId && matchId && !tournamentSubmitted) {
            try {
              await submitTournamentMatchScore(tournamentId, matchId, user.uid, score, `game-${user.uid}-${Date.now()}`)
              setTournamentSubmitted(true)
              showFeedback({ type: 'success', message: 'Tournament score submitted!', duration: 3000 })
            } catch (error) {
              console.error('Failed to submit tournament score:', error)
              showFeedback({ type: 'error', message: 'Failed to submit tournament score' })
            }
          }

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
  }, [phase, user, profile, score, isChallengeMode, challengeId, challengeSubmitted, isTournamentMode, tournamentId, matchId, tournamentSubmitted, showFeedback])

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
        {/* Challenge Mode Banner */}
        {isChallengeMode && challenge && (
          <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-3 mb-2">
            <div className="flex items-center justify-center gap-2 text-red-400 font-medium">
              <span>Challenge vs</span>
              <span className="text-white">
                {challenge.challengerId === user?.uid ? challenge.opponentName : challenge.challengerName}
              </span>
            </div>
          </div>
        )}

        {/* Tournament Mode Banner */}
        {isTournamentMode && tournament && tournamentMatch && (
          <div className="bg-orange-600/20 border border-orange-500/50 rounded-lg p-3 mb-2">
            <div className="flex flex-col items-center gap-1">
              <span className="text-orange-400 font-medium text-sm">{tournament.name}</span>
              <div className="flex items-center gap-2 text-white font-medium">
                <span>Match vs</span>
                <span>
                  {tournamentMatch.player1Id === user?.uid ? tournamentMatch.player2Name : tournamentMatch.player1Name}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* League Selector - Top Right (only during letter selection and not multiplayer mode) */}
        {(phase === 'idle' || phase === 'letter-selection') && !isChallengeMode && !isTournamentMode && (
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

        {/* Game Over - Show Leaderboard (solo mode only) */}
        {phase === 'game-over' && showLeaderboard && !isChallengeMode && !isTournamentMode && (
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

        {/* Game Over - Challenge Mode Result */}
        {phase === 'game-over' && showLeaderboard && isChallengeMode && challenge && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-trophy-gold mb-4">
                Challenge Score Submitted!
              </h2>
              <div className="bg-black/30 rounded-lg p-6 border border-white/10">
                <p className="text-4xl font-bold text-white mb-2">{score}</p>
                <p className="text-gray-400">Your score</p>

                {/* Show opponent's score if available */}
                {challenge.challengerId === user?.uid ? (
                  challenge.opponentScore !== null && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-2xl font-bold text-gray-300">{challenge.opponentScore}</p>
                      <p className="text-gray-500">{challenge.opponentName}'s score</p>
                    </div>
                  )
                ) : (
                  challenge.challengerScore !== null && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-2xl font-bold text-gray-300">{challenge.challengerScore}</p>
                      <p className="text-gray-500">{challenge.challengerName}'s score</p>
                    </div>
                  )
                )}

                {/* Waiting message if opponent hasn't played */}
                {(challenge.challengerId === user?.uid
                  ? challenge.opponentScore === null
                  : challenge.challengerScore === null) && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-gray-400">
                      Waiting for {challenge.challengerId === user?.uid ? challenge.opponentName : challenge.challengerName} to play...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Back to Challenges Button */}
            <button
              onClick={() => navigate('/challenges')}
              className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 font-bold py-3 px-4 rounded-lg transition duration-300 text-lg sm:text-xl text-white border-2 border-white/30 shadow-lg"
            >
              Back to Challenges
            </button>

            {/* Play Regular Game Button */}
            <button
              onClick={() => {
                navigate('/play')
                resetGame()
              }}
              className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 font-bold py-3 px-4 rounded-lg transition duration-300 text-lg sm:text-xl text-white border-2 border-white/30 shadow-lg"
            >
              Play Regular Game
            </button>
          </div>
        )}

        {/* Game Over - Tournament Mode Result */}
        {phase === 'game-over' && showLeaderboard && isTournamentMode && tournament && tournamentMatch && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-orange-400 mb-2">
                {tournament.name}
              </h2>
              <p className="text-gray-400 text-sm mb-4">Match Score Submitted!</p>
              <div className="bg-black/30 rounded-lg p-6 border border-white/10">
                <p className="text-4xl font-bold text-white mb-2">{score}</p>
                <p className="text-gray-400">Your score</p>

                {/* Show opponent's score if available */}
                {tournamentMatch.player1Id === user?.uid ? (
                  tournamentMatch.player2Score !== null && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-2xl font-bold text-gray-300">{tournamentMatch.player2Score}</p>
                      <p className="text-gray-500">{tournamentMatch.player2Name}'s score</p>
                    </div>
                  )
                ) : (
                  tournamentMatch.player1Score !== null && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-2xl font-bold text-gray-300">{tournamentMatch.player1Score}</p>
                      <p className="text-gray-500">{tournamentMatch.player1Name}'s score</p>
                    </div>
                  )
                )}

                {/* Waiting message if opponent hasn't played */}
                {(tournamentMatch.player1Id === user?.uid
                  ? tournamentMatch.player2Score === null
                  : tournamentMatch.player1Score === null) && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-gray-400">
                      Waiting for {tournamentMatch.player1Id === user?.uid ? tournamentMatch.player2Name : tournamentMatch.player1Name} to play...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Back to Tournament Button */}
            <button
              onClick={() => navigate(`/tournaments/${tournamentId}`)}
              className="w-full bg-gradient-to-r from-orange-700 to-orange-600 hover:from-orange-600 hover:to-orange-500 font-bold py-3 px-4 rounded-lg transition duration-300 text-lg sm:text-xl text-white border-2 border-white/30 shadow-lg"
            >
              Back to Tournament
            </button>

            {/* Play Regular Game Button */}
            <button
              onClick={() => {
                navigate('/play')
                resetGame()
              }}
              className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 font-bold py-3 px-4 rounded-lg transition duration-300 text-lg sm:text-xl text-white border-2 border-white/30 shadow-lg"
            >
              Play Regular Game
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
