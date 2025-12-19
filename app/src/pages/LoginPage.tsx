import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { SignUpForm } from '../components/auth/SignUpForm'
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const { isAuthenticated, isInitialized, isLoading } = useAuth()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen flex flex-col justify-start sm:justify-center px-4 pt-4 pb-8 sm:py-8">
      {/* Main Container - Stadium themed card */}
      <div className="bg-stadium rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-sm mx-auto border-2 border-white/30 grass-texture space-y-4">
        {/* Logo and Title */}
        <div className="text-center">
          <img src="/images/logo.png" alt="five-a-side" className="h-28 sm:h-36 w-auto drop-shadow-2xl mx-auto -mb-4 sm:-mb-6" />
          <h2 className="text-lg sm:text-xl font-bold text-trophy-gold">
            {isSignUp ? 'Join the Squad!' : 'Welcome Back!'}
          </h2>
          <p className="text-sm text-gray-300">
            {isSignUp ? 'Create an account to start playing' : 'Sign in to start playing'}
          </p>
        </div>

        {/* Google Sign In */}
        <GoogleSignInButton />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        {/* Email/Password Forms */}
        {isSignUp ? (
          <SignUpForm onSwitchToLogin={() => setIsSignUp(false)} />
        ) : (
          <LoginForm onSwitchToSignUp={() => setIsSignUp(true)} />
        )}
      </div>
    </div>
  )
}
