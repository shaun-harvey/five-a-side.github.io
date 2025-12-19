export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="flex flex-col items-center">
        <img
          src="/images/logo.webp"
          alt="five-a-side"
          className="h-48 w-auto mb-2"
        />
        <p className="text-white text-lg -mt-6">
          Loading<span className="animate-pulse">...</span>
        </p>
      </div>
    </div>
  )
}
