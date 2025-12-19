interface TimerProps {
  timeLeft: number
  totalTime: number
  size?: 'sm' | 'md' | 'lg'
  showBar?: boolean
  urgent?: boolean
}

export function Timer({
  timeLeft,
  totalTime,
  size = 'md',
  showBar = true,
  urgent = timeLeft <= 10,
}: TimerProps) {
  const percentage = (timeLeft / totalTime) * 100

  const sizeStyles = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return secs.toString()
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Time Display */}
      <div
        className={`
          ${sizeStyles[size]}
          font-bold font-mono
          ${urgent ? 'text-red-500 animate-pulse' : 'text-white'}
          transition-colors duration-300
        `}
      >
        {formatTime(timeLeft)}
      </div>

      {/* Progress Bar */}
      {showBar && (
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`
              h-full rounded-full transition-all duration-1000 ease-linear
              ${urgent ? 'bg-red-500' : percentage > 50 ? 'bg-green-500' : 'bg-yellow-500'}
            `}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}
