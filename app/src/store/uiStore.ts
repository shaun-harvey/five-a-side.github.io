import { create } from 'zustand'

type ModalType =
  | 'guess'
  | 'substitute'
  | 'var'
  | 'instructions'
  | 'highScores'
  | 'gameOver'
  | null

interface FeedbackMessage {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface UIState {
  // Modal state
  activeModal: ModalType
  modalData: Record<string, unknown>

  // Timer pause state - pauses the main game timer when modal is open
  isTimerPaused: boolean

  // Feedback
  feedback: FeedbackMessage | null

  // Loading states
  isLoadingPlayers: boolean
  isSubmittingScore: boolean

  // Actions
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void
  closeModal: () => void
  showFeedback: (feedback: FeedbackMessage) => void
  clearFeedback: () => void
  setLoadingPlayers: (loading: boolean) => void
  setSubmittingScore: (submitting: boolean) => void
  pauseTimer: () => void
  resumeTimer: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  modalData: {},
  isTimerPaused: false,
  feedback: null,
  isLoadingPlayers: false,
  isSubmittingScore: false,

  openModal: (modal, data = {}) => {
    // Pause timer when any modal opens (like the original)
    set({ activeModal: modal, modalData: data, isTimerPaused: true })
  },

  closeModal: () => {
    // Resume timer when modal closes
    set({ activeModal: null, modalData: {}, isTimerPaused: false })
  },

  pauseTimer: () => {
    set({ isTimerPaused: true })
  },

  resumeTimer: () => {
    set({ isTimerPaused: false })
  },

  showFeedback: (feedback) => {
    set({ feedback })
    // Auto-clear after duration (default 3 seconds)
    if (feedback.duration !== 0) {
      setTimeout(() => {
        set((state) => {
          // Only clear if it's the same message
          if (state.feedback?.message === feedback.message) {
            return { feedback: null }
          }
          return state
        })
      }, feedback.duration || 3000)
    }
  },

  clearFeedback: () => {
    set({ feedback: null })
  },

  setLoadingPlayers: (loading) => {
    set({ isLoadingPlayers: loading })
  },

  setSubmittingScore: (submitting) => {
    set({ isSubmittingScore: submitting })
  },
}))
