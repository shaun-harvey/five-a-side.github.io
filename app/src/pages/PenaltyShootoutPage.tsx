import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getChallengeById, submitPenaltyScore, subscribeToChallenge } from '../lib/firebase/challenges'
import { getRandomPlayer } from '../lib/firebase/firestore'
import type { Challenge } from '../types/multiplayer'
import { Goal, X, Clock, Trophy, Target, Loader2 } from 'lucide-react'

// Scramble a player name for guessing (remove vowels)
function scrambleName(name: string): string {
  const vowels = 'aeiouAEIOU'
  let scrambled = ''
  for (const char of name) {
    if (vowels.includes(char)) {
      scrambled += '_'
    } else if (char === ' ') {
      scrambled += ' '
    } else {
      scrambled += char
    }
  }
  return scrambled
}

interface PenaltyAttempt {
  round: number
  playerName: string
  guess: string
  correct: boolean
}

type GamePhase = 'loading' | 'intro' | 'ready' | 'guessing' | 'result' | 'submitting' | 'waiting' | 'final'

const PENALTY_TIME_LIMIT = 8 // seconds per guess
const TOTAL_ROUNDS = 5

export function PenaltyShootoutPage() {
  const { challengeId } = useParams<{ challengeId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Challenge data
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [phase, setPhase] = useState<GamePhase>('loading')
  const [error, setError] = useState<string | null>(null)

  // Game state
  const [currentRound, setCurrentRound] = useState(1)
  const [attempts, setAttempts] = useState<PenaltyAttempt[]>([])

  // Current penalty state
  const [currentPlayer, setCurrentPlayer] = useState<{ name: string; scrambled: string } | null>(null)
  const [guess, setGuess] = useState('')
  const [timeLeft, setTimeLeft] = useState(PENALTY_TIME_LIMIT)
  const [lastResult, setLastResult] = useState<{ correct: boolean; playerName: string } | null>(null)

  // Final result
  const [finalResult, setFinalResult] = useState<{
    iWon: boolean
    myScore: number
    theirScore: number
    waiting: boolean
  } | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const handleSubmitGuessRef = useRef<(timedOut?: boolean) => void>(() => {})

  // Load challenge and subscribe to updates
  useEffect(() => {
    if (!challengeId || !user) return

    async function loadChallenge() {
      try {
        const c = await getChallengeById(challengeId!)
        if (!c) {
          setError('Challenge not found')
          return
        }
        if (!c.wentToPenalties) {
          navigate('/challenges')
          return
        }

        // Check if user already submitted penalty score
        const isChallenger = c.challengerId === user!.uid
        const myPenaltyScore = isChallenger ? c.challengerPenaltyScore : c.opponentPenaltyScore

        if (myPenaltyScore !== null) {
          // Already submitted - check if complete
          if (c.status === 'completed') {
            setChallenge(c)
            const theirScore = isChallenger ? c.opponentPenaltyScore : c.challengerPenaltyScore
            setFinalResult({
              iWon: c.winnerId === user!.uid,
              myScore: myPenaltyScore,
              theirScore: theirScore ?? 0,
              waiting: false,
            })
            setPhase('final')
          } else {
            // Waiting for opponent
            setChallenge(c)
            setFinalResult({
              iWon: false,
              myScore: myPenaltyScore,
              theirScore: 0,
              waiting: true,
            })
            setPhase('waiting')
          }
        } else {
          setChallenge(c)
          setPhase('intro')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load challenge')
      }
    }

    loadChallenge()

    // Subscribe to challenge updates (for when opponent completes)
    unsubscribeRef.current = subscribeToChallenge(challengeId, (updatedChallenge) => {
      if (!updatedChallenge) return
      setChallenge(updatedChallenge)

      // Check if challenge is now complete
      if (updatedChallenge.status === 'completed' && updatedChallenge.penaltyResult) {
        const isChallenger = updatedChallenge.challengerId === user!.uid
        setFinalResult({
          iWon: updatedChallenge.winnerId === user!.uid,
          myScore: isChallenger
            ? updatedChallenge.penaltyResult.challengerScore
            : updatedChallenge.penaltyResult.opponentScore,
          theirScore: isChallenger
            ? updatedChallenge.penaltyResult.opponentScore
            : updatedChallenge.penaltyResult.challengerScore,
          waiting: false,
        })
        setPhase('final')
      }
    })

    return () => {
      unsubscribeRef.current?.()
    }
  }, [challengeId, user, navigate])

  // Get opponent name
  const getOpponentName = () => {
    if (!challenge || !user) return 'Opponent'
    return challenge.challengerId === user.uid
      ? challenge.opponentName
      : challenge.challengerName
  }

  // Load a new player for the current penalty
  const loadNextPenalty = useCallback(async () => {
    try {
      const player = await getRandomPlayer()
      if (player) {
        setCurrentPlayer({
          name: player.name,
          scrambled: scrambleName(player.name),
        })
        setGuess('')
        setTimeLeft(PENALTY_TIME_LIMIT)
        setPhase('ready')
      }
    } catch (err) {
      setError('Failed to load player')
    }
  }, [])

  // Start the penalty (begin countdown)
  const startPenalty = useCallback(() => {
    setPhase('guessing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  // Handle guess submission
  const handleSubmitGuess = useCallback((timedOut = false) => {
    if (phase !== 'guessing' || !currentPlayer) return
    if (timerRef.current) clearInterval(timerRef.current)

    const userGuess = timedOut ? '' : guess.trim()
    const correct = userGuess.toLowerCase() === currentPlayer.name.toLowerCase()

    const attempt: PenaltyAttempt = {
      round: currentRound,
      playerName: currentPlayer.name,
      guess: userGuess,
      correct,
    }

    setAttempts((prev) => [...prev, attempt])
    setLastResult({ correct, playerName: currentPlayer.name })
    setPhase('result')
  }, [phase, currentPlayer, guess, currentRound])

  // Keep ref in sync with latest handler to avoid stale closures in timer
  useEffect(() => {
    handleSubmitGuessRef.current = handleSubmitGuess
  }, [handleSubmitGuess])

  // Timer countdown
  useEffect(() => {
    if (phase !== 'guessing') return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Use ref to always call the latest handler
          handleSubmitGuessRef.current(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  // Move to next round or finish
  const proceedToNext = useCallback(async () => {
    if (currentRound >= TOTAL_ROUNDS) {
      // Done with all penalties - submit score
      setPhase('submitting')

      const myScore = attempts.filter((a) => a.correct).length

      try {
        const result = await submitPenaltyScore(challengeId!, user!.uid, myScore)

        if (result.completed) {
          // Both players done - show result
          setFinalResult({
            iWon: result.winner?.id === user!.uid,
            myScore,
            theirScore: challenge?.challengerId === user?.uid
              ? (challenge?.opponentPenaltyScore ?? 0)
              : (challenge?.challengerPenaltyScore ?? 0),
            waiting: false,
          })
          setPhase('final')
        } else {
          // Waiting for opponent
          setFinalResult({
            iWon: false,
            myScore,
            theirScore: 0,
            waiting: true,
          })
          setPhase('waiting')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit score')
      }
      return
    }

    setCurrentRound((prev) => prev + 1)
    loadNextPenalty()
  }, [currentRound, attempts, challengeId, user, challenge, loadNextPenalty])

  const myScore = attempts.filter((a) => a.correct).length

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-stadium flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stadium flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/challenges')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg"
          >
            Back to Challenges
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stadium flex items-center justify-center p-4">
      <div className="bg-deep-green/90 rounded-2xl shadow-xl p-6 w-full max-w-lg border-2 border-white/30">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-8 h-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">Penalty Shootout</h1>
          </div>
          <p className="text-gray-400 text-sm">vs {getOpponentName()}</p>
        </div>

        {/* Progress display */}
        {phase !== 'waiting' && phase !== 'final' && (
          <>
            {/* Score */}
            <div className="text-center mb-4 p-3 bg-black/30 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Your Score</p>
              <p className="text-4xl font-bold text-green-400">{myScore}</p>
              <p className="text-xs text-gray-500">out of {Math.min(currentRound - 1, TOTAL_ROUNDS)}</p>
            </div>

            {/* Penalty attempts display */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
                const attempt = attempts[i]
                return (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      attempt
                        ? attempt.correct
                          ? 'bg-green-500/20 border-green-500'
                          : 'bg-red-500/20 border-red-500'
                        : i === currentRound - 1
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-gray-600 bg-gray-800'
                    }`}
                  >
                    {attempt ? (
                      attempt.correct ? (
                        <Goal className="w-5 h-5 text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-400" />
                      )
                    ) : (
                      <span className="text-gray-500 text-sm">{i + 1}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Game phases */}
        {phase === 'intro' && (
          <div className="text-center">
            <p className="text-gray-300 mb-6">
              It's a tie! Time for a penalty shootout.<br />
              Guess {TOTAL_ROUNDS} players - each correct guess scores a goal.
            </p>
            <button
              onClick={loadNextPenalty}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
            >
              Start Shootout
            </button>
          </div>
        )}

        {phase === 'ready' && currentPlayer && (
          <div className="text-center">
            <p className="text-gray-400 mb-2">Penalty {currentRound} of {TOTAL_ROUNDS}</p>
            <div className="bg-black/40 rounded-xl p-6 mb-4">
              <p className="text-3xl font-mono text-white tracking-wider">
                {currentPlayer.scrambled}
              </p>
            </div>
            <button
              onClick={startPenalty}
              className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-xl transition-colors"
            >
              Take Penalty
            </button>
          </div>
        )}

        {phase === 'guessing' && currentPlayer && (
          <div className="text-center">
            {/* Timer */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className={`w-5 h-5 ${timeLeft <= 3 ? 'text-red-400' : 'text-yellow-400'}`} />
              <span className={`text-2xl font-bold ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {timeLeft}s
              </span>
            </div>

            {/* Scrambled name */}
            <div className="bg-black/40 rounded-xl p-6 mb-4">
              <p className="text-3xl font-mono text-white tracking-wider">
                {currentPlayer.scrambled}
              </p>
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmitGuess()
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Type player name..."
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 text-center text-lg focus:outline-none focus:border-green-500 mb-4"
                autoComplete="off"
                autoCapitalize="off"
              />
              <button
                type="submit"
                disabled={!guess.trim()}
                className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold rounded-xl transition-colors"
              >
                Shoot!
              </button>
            </form>
          </div>
        )}

        {phase === 'result' && lastResult && (
          <div className="text-center">
            <div className={`p-8 rounded-xl mb-4 ${lastResult.correct ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {lastResult.correct ? (
                <>
                  <Goal className="w-16 h-16 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-400">GOAL!</p>
                </>
              ) : (
                <>
                  <X className="w-16 h-16 text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-400">MISS!</p>
                </>
              )}
              <p className="text-gray-400 mt-2">
                The answer was: <span className="text-white font-semibold">{lastResult.playerName}</span>
              </p>
            </div>
            <button
              onClick={proceedToNext}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
            >
              {currentRound >= TOTAL_ROUNDS ? 'Submit Score' : 'Next Penalty'}
            </button>
          </div>
        )}

        {phase === 'submitting' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Submitting your score...</p>
          </div>
        )}

        {phase === 'waiting' && finalResult && (
          <div className="text-center">
            <div className="p-8 rounded-xl mb-4 bg-yellow-500/20">
              <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-2 animate-pulse" />
              <p className="text-2xl font-bold text-white">Your Score: {finalResult.myScore}</p>
              <p className="text-gray-400 mt-2">
                Waiting for {getOpponentName()} to take their penalties...
              </p>
            </div>
            <button
              onClick={() => navigate('/challenges')}
              className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
            >
              Back to Challenges
            </button>
          </div>
        )}

        {phase === 'final' && finalResult && !finalResult.waiting && (
          <div className="text-center">
            <div className={`p-8 rounded-xl mb-4 ${finalResult.iWon ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Trophy className={`w-16 h-16 mx-auto mb-2 ${finalResult.iWon ? 'text-yellow-400' : 'text-gray-500'}`} />
              <p className="text-2xl font-bold text-white">
                {finalResult.iWon ? 'You Win!' : 'You Lose'}
              </p>
              <p className="text-lg text-gray-300 mt-2">
                {finalResult.myScore} - {finalResult.theirScore}
              </p>
              {challenge?.penaltyResult && (
                <p className="text-sm text-gray-500 mt-1">on penalties</p>
              )}
            </div>
            <button
              onClick={() => navigate('/challenges')}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
            >
              Back to Challenges
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
