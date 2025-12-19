import { type ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-green-600 hover:bg-green-700 text-white',
  secondary: 'bg-blue-600 hover:bg-blue-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-black',
  ghost: 'bg-transparent hover:bg-white/10 text-white',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2 text-base min-h-[44px]', // 44px for mobile touch target
  lg: 'px-6 py-3 text-lg min-h-[52px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          rounded-lg font-semibold
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-95
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
