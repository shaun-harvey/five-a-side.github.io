import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useGameStore } from '../../store/gameStore'
import { Menu, X, Trophy, HelpCircle, Settings, LogOut, Play, User, BarChart3, Home, Gamepad2 } from 'lucide-react'

export function Navbar() {
  const location = useLocation()
  const { isAuthenticated, user, profile, signOut } = useAuth()
  const gamePhase = useGameStore((state) => state.phase)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false)
  const avatarMenuRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => location.pathname === path
  const closeSidebar = () => setIsSidebarOpen(false)

  // Check if user is actively in a game (hide nav links to prevent cheating)
  const isInActiveGame = location.pathname === '/play' &&
    (gamePhase === 'playing' || gamePhase === 'round-transition')

  const handleSignOut = () => {
    closeSidebar()
    setIsAvatarMenuOpen(false)
    signOut()
  }

  // Close avatar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* Desktop Navbar - Football themed */}
      <nav className="fixed top-0 left-0 right-0 bg-deep-green z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title - Left (disabled during active gameplay) */}
            {isInActiveGame ? (
              <div className="flex items-center flex-shrink-0 cursor-default">
                <img src="/images/logo.png" alt="five-a-side" className="h-12 w-auto" />
                <span className="hidden sm:block text-xl font-bold text-white -ml-2">five-a-side</span>
              </div>
            ) : (
              <Link to="/" className="flex items-center flex-shrink-0">
                <img src="/images/logo.png" alt="five-a-side" className="h-12 w-auto" />
                <span className="hidden sm:block text-xl font-bold text-white -ml-2">five-a-side</span>
              </Link>
            )}

            {/* Desktop Nav Links - Center */}
            <div className="hidden md:flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
              {isAuthenticated && isInActiveGame ? (
                // Show "In Game" indicator when actively playing
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white">
                  <Gamepad2 className="w-4 h-4" />
                  In Game
                </div>
              ) : isAuthenticated && (
                <>
                  <Link
                    to="/play"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/play')
                        ? 'bg-green-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    Play
                  </Link>
                  <Link
                    to="/leaderboard"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/leaderboard')
                        ? 'bg-trophy-gold text-gray-900'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    League
                  </Link>
                  <Link
                    to="/stats"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/stats')
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Stats
                  </Link>
                  <Link
                    to="/rules"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/rules')
                        ? 'bg-pitch-green text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Rules
                  </Link>
                </>
              )}
            </div>

            {/* Right side - Avatar/Sign In */}
            <div className="hidden md:flex items-center">
              {isAuthenticated && !isInActiveGame && (
                <div className="relative" ref={avatarMenuRef}>
                  <button
                    onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {(profile?.photoURL || user?.photoURL) ? (
                      <img
                        src={profile?.photoURL || user?.photoURL || ''}
                        alt={profile?.displayName || 'Avatar'}
                        className="w-8 h-8 rounded-full object-cover border-2 border-trophy-gold"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-trophy-gold flex items-center justify-center text-gray-900 font-bold">
                        {profile?.displayName?.charAt(0).toUpperCase() || user?.displayName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                      </div>
                    )}
                  </button>

                  {/* Avatar Dropdown Menu */}
                  {isAvatarMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-deep-green border border-white/20 rounded-lg shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white truncate">{profile?.displayName}</p>
                        <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setIsAvatarMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isAuthenticated && (
                <Link
                  to="/login"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/login')
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button - hidden during active gameplay */}
            {!isInActiveGame && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden bg-pitch-green hover:bg-green-700 p-2 rounded-lg transition duration-300 text-white"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            {/* Mobile "In Game" indicator */}
            {isInActiveGame && (
              <div className="md:hidden flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white">
                <Gamepad2 className="w-4 h-4" />
                In Game
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[200] md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Sidebar - Football themed */}
      <div
        className={`fixed top-0 right-0 h-full w-3/4 bg-stadium z-[201] transform transition-transform duration-300 ease-in-out md:hidden border-l-2 border-white/20 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <img src="/images/logo.png" alt="five-a-side" className="h-10 w-auto" />
          <button
            onClick={closeSidebar}
            className="p-2 text-gray-300 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-4 space-y-2">
          <Link
            to="/"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              isActive('/')
                ? 'bg-pitch-green text-white'
                : 'text-gray-200 hover:bg-white/10'
            }`}
          >
            <Home className="w-5 h-5" />
            Home
          </Link>

          <Link
            to="/rules"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              isActive('/rules')
                ? 'bg-pitch-green text-white'
                : 'text-gray-200 hover:bg-white/10'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            How to Play
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/play"
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive('/play')
                    ? 'bg-green-600 text-white'
                    : 'text-gray-200 hover:bg-white/10'
                }`}
              >
                <Play className="w-5 h-5" />
                Play
              </Link>

              <Link
                to="/leaderboard"
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive('/leaderboard')
                    ? 'bg-trophy-gold text-gray-900'
                    : 'text-gray-200 hover:bg-white/10'
                }`}
              >
                <Trophy className="w-5 h-5" />
                League Table
              </Link>

              <Link
                to="/stats"
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive('/stats')
                    ? 'bg-pitch-green text-white'
                    : 'text-gray-200 hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Stats
              </Link>

              <Link
                to="/settings"
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive('/settings')
                    ? 'bg-pitch-green text-white'
                    : 'text-gray-200 hover:bg-white/10'
                }`}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>

              <div className="pt-4 mt-4 border-t border-white/20">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </>
          )}

          {!isAuthenticated && (
            <Link
              to="/login"
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive('/login')
                  ? 'bg-green-600 text-white'
                  : 'text-gray-200 hover:bg-white/10'
              }`}
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </>
  )
}
