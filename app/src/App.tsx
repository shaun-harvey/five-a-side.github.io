import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { LoginPage } from './pages/LoginPage'
import { GamePage } from './pages/GamePage'
import { LandingPage } from './pages/LandingPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { ChallengesPage } from './pages/ChallengesPage'
import { JoinChallengePage } from './pages/JoinChallengePage'
import { TournamentsPage } from './pages/TournamentsPage'
import { CreateTournamentPage } from './pages/CreateTournamentPage'
import { TournamentDetailPage } from './pages/TournamentDetailPage'
import { PenaltyShootoutPage } from './pages/PenaltyShootoutPage'
import { SettingsPage } from './pages/SettingsPage'
import { StatsPage } from './pages/StatsPage'
import { RulesPage } from './pages/RulesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { Navbar } from './components/layout/Navbar'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { VersionChecker } from './components/common/VersionChecker'
import { useAuthStore } from './store/authStore'
import { LoadingSpinner } from './components/common/LoadingSpinner'
import { useSwipeNavigation } from './hooks/useSwipeNavigation'
import './index.css'

// Wrapper component to enable swipe navigation
function SwipeNavigationWrapper({ children }: { children: React.ReactNode }) {
  useSwipeNavigation()
  return <>{children}</>
}

function App() {
  const initialize = useAuthStore((state) => state.initialize)
  const isInitialized = useAuthStore((state) => state.isInitialized)

  // Initialize Firebase auth listener
  useEffect(() => {
    const unsubscribe = initialize()
    return unsubscribe
  }, [initialize])

  // Show loading while initializing auth
  if (!isInitialized) {
    return <LoadingSpinner />
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SwipeNavigationWrapper>
          <VersionChecker />
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/play" element={<GamePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/penalties/:challengeId" element={<PenaltyShootoutPage />} />
            <Route path="/join/:code" element={<JoinChallengePage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/create" element={<CreateTournamentPage />} />
            <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SwipeNavigationWrapper>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
