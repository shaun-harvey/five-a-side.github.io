import { useAuthStore } from '../store/authStore'

/**
 * Hook to access auth state
 * Note: Auth is initialized once in App.tsx, not here, to avoid duplicate listeners
 */
export function useAuth() {
  const {
    user,
    profile,
    isLoading,
    isInitialized,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    deleteAccount,
    clearError,
    refreshProfile,
    setSelectedLeague,
  } = useAuthStore()

  return {
    user,
    profile,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    deleteAccount,
    clearError,
    refreshProfile,
    setSelectedLeague,
    // Convenience getter for selected league
    selectedLeague: profile?.selectedLeague || 'premier-league',
  }
}
