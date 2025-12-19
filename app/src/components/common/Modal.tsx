import { type ReactNode, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  fullScreenMobile?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  fullScreenMobile = true,
}: ModalProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose()
      }
    },
    [onClose, closeOnEscape]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal Content */}
      <div
        className={`
          relative z-10 bg-gray-900 rounded-xl shadow-2xl
          animate-slideIn
          ${
            fullScreenMobile
              ? 'w-full h-full md:w-auto md:h-auto md:max-w-lg md:max-h-[90vh] md:rounded-xl'
              : 'w-full max-w-lg mx-4 max-h-[90vh]'
          }
          overflow-hidden flex flex-col
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {title && (
              <h2
                id="modal-title"
                className="text-xl font-bold text-white"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
