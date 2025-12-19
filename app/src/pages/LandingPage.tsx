import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Timer, Tv, ArrowLeftRight, SpellCheck, Keyboard, UserSearch, Trophy } from 'lucide-react'

export function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Width */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4">
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/hero-bg.webp"
            alt=""
            className="w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.6)_0%,_transparent_70%)]" />
        </div>
        <div className="relative max-w-6xl mx-auto text-center">
          <img
            src="/images/logo.webp"
            alt="five-a-side"
            className="h-auto w-full max-w-[280px] sm:max-w-[380px] md:max-w-[480px] mx-auto"
            loading="eager"
            fetchPriority="high"
          />
          <p className="text-xl sm:text-2xl md:text-3xl text-white mb-8 sm:mb-10 max-w-3xl mx-auto -mt-6 sm:-mt-10 md:-mt-14">
            The ultimate football player guessing game
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={isAuthenticated ? '/play' : '/login'}
              className="bg-white text-pitch-green font-bold py-4 px-12 rounded-lg text-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              {isAuthenticated ? 'Play Now' : 'Get Started'}
            </Link>
            <Link
              to="/rules"
              className="bg-transparent border-2 border-white text-white font-bold py-4 px-12 rounded-lg text-xl hover:bg-white/10 transition-colors"
            >
              How to Play
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - Full Width */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-16">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl">
                <Keyboard className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Pick Your Letters</h3>
              <p className="text-gray-300 text-lg">
                Choose 1 vowel and 4 consonants to form your team
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl">
                <UserSearch className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Guess the Players</h3>
              <p className="text-gray-300 text-lg">
                Name the footballers whose names contain your chosen letters
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-xl">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Climb the League</h3>
              <p className="text-gray-300 text-lg">
                Score points and compete on the global leaderboard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Full Width */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-16">
            Game Features
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/10 rounded-xl p-8 border border-white/20">
              <Timer className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">3 Rounds</h3>
              <p className="text-gray-300">
                Modern Stars, Legends, and Forgotten Heroes - each with different time limits and point values
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-8 border border-white/20">
              <Tv className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">VAR System</h3>
              <p className="text-gray-300">
                Use VAR hints to reveal clues about player names when you're stuck
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-8 border border-white/20">
              <ArrowLeftRight className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Substitutions</h3>
              <p className="text-gray-300">
                Swap out a letter from your team to unlock different players
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-8 border border-white/20">
              <SpellCheck className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Fuzzy Matching</h3>
              <p className="text-gray-300">
                Close guesses count - you don't need perfect spelling to score
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Full Width */}
      <section className="py-24 px-4 bg-black/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Play?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Sign up for free and start testing your football knowledge
          </p>
          <Link
            to={isAuthenticated ? '/play' : '/login'}
            className="inline-block bg-white text-pitch-green font-bold py-4 px-12 rounded-lg text-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            {isAuthenticated ? 'Play Now' : 'Sign Up Free'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-gray-400 space-y-2">
          <p className="font-medium text-gray-300">five-a-side</p>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} five-a-side. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Player data and statistics are for entertainment purposes only. All player names, images, and related trademarks are the property of their respective owners.
          </p>
        </div>
      </footer>
    </div>
  )
}
