# Voice-First Game Control Plan

## Overview
Enable full voice control of the game - always listening during gameplay, recognizing commands like "pass", "sub", "VAR", and player name guesses. Users can play the entire game hands-free.

---

## Core Architecture

```
┌─────────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│  Microphone │ →  │ Deepgram     │ →  │ Intent Parser │ →  │ Game Actions │
│  (always on)│    │ Nova-3       │    │ (context-aware)│    │              │
└─────────────┘    └──────────────┘    └───────────────┘    └──────────────┘
```

**Flow:**
1. User enables voice mode (mic icon on game screen)
2. Deepgram WebSocket stays connected throughout game
3. Every transcript is parsed for intent
4. Intent parser considers current game context (which modal is open)
5. Matching action is executed

---

## Intent Recognition

### Command Phrases (flexible matching)

| Intent | Trigger Phrases | Action |
|--------|-----------------|--------|
| **Pass** | "pass", "skip", "next", "skip this one", "next player" | Skip current player |
| **Open Sub Modal** | "sub", "substitute", "swap", "make a sub", "change letter" | Open substitution modal |
| **Open VAR Modal** | "var", "hint", "help", "give me a hint", "show hint" | Open VAR hint modal |
| **Open Guess Modal** | "guess", "I know", "let me guess" | Open guess modal |
| **Execute Sub** | "E for A", "swap E for A", "change E to A", "replace E with A" | Execute letter substitution |
| **Guess Player** | Any player name | Submit as guess |
| **Close/Cancel** | "cancel", "close", "back", "never mind" | Close current modal |

### Context-Aware Behavior

| Current State | Valid Commands | Default Action for Unrecognized |
|---------------|----------------|--------------------------------|
| Main game screen | pass, sub, var, guess, player names | Treat as player name guess |
| Substitute modal open | "X for Y" patterns, cancel | Ignore (wait for valid sub) |
| VAR modal open | close, cancel | Close modal |
| Guess modal open | player names, cancel | Submit as guess |

---

## Files to Create

### 1. `src/lib/voice/intentParser.ts`

```typescript
// Types
export type GameContext = {
  activeModal: 'none' | 'guess' | 'substitute' | 'var'
  availableVowels: string[]
  availableConsonants: string[]
  selectedLetters: string[]
}

export type Intent =
  | { type: 'pass' }
  | { type: 'openSub' }
  | { type: 'openVar' }
  | { type: 'openGuess' }
  | { type: 'executeSwap'; from: string; to: string }
  | { type: 'guess'; playerName: string }
  | { type: 'cancel' }
  | { type: 'unknown' }

// Helper to clean transcript (remove trailing punctuation like "Ronaldo.")
function cleanTranscript(text: string): string {
  return text.replace(/[.,!?]+$/, '').trim()
}

// Main function
export function parseIntent(transcript: string, context: GameContext): Intent {
  const cleaned = cleanTranscript(transcript)
  const normalized = cleaned.toLowerCase()

  // 1. Check for cancel/close first (works in any context)
  if (matchesCancelPhrases(normalized)) {
    return { type: 'cancel' }
  }

  // 2. Context-specific parsing
  switch (context.activeModal) {
    case 'substitute':
      return parseSubstituteIntent(normalized, context)
    case 'guess':
      return { type: 'guess', playerName: cleaned } // Use cleaned (no punctuation)
    case 'var':
      return { type: 'unknown' } // VAR modal just displays, wait for close
    default:
      return parseMainScreenIntent(normalized, cleaned) // Pass cleaned for guesses
  }
}

function matchesCancelPhrases(text: string): boolean {
  const phrases = ['cancel', 'close', 'back', 'never mind', 'nevermind']
  return phrases.some(p => text.includes(p))
}

function parseMainScreenIntent(normalized: string, cleaned: string): Intent {
  // Check pass phrases
  const passPhrases = ['pass', 'skip', 'next player', 'skip this']
  if (passPhrases.some(p => normalized.includes(p))) {
    return { type: 'pass' }
  }

  // Check sub phrases
  const subPhrases = ['sub', 'substitute', 'swap letter', 'make a sub', 'change letter']
  if (subPhrases.some(p => normalized.includes(p))) {
    return { type: 'openSub' }
  }

  // Check VAR phrases
  const varPhrases = ['var', 'hint', 'help', 'give me a hint', 'show hint']
  if (varPhrases.some(p => normalized.includes(p))) {
    return { type: 'openVar' }
  }

  // Check guess phrases (explicit)
  const guessPhrases = ['guess', 'i know', 'let me guess']
  if (guessPhrases.some(p => normalized.includes(p))) {
    return { type: 'openGuess' }
  }

  // Default: treat as player name guess (cleaned = no trailing punctuation)
  return { type: 'guess', playerName: cleaned }
}

function parseSubstituteIntent(normalized: string, context: GameContext): Intent {
  // Match patterns like "E for A", "swap E for A", "change E to A"
  const patterns = [
    /^([a-z])\s+for\s+([a-z])$/,           // "E for A"
    /swap\s+([a-z])\s+for\s+([a-z])/,      // "swap E for A"
    /change\s+([a-z])\s+to\s+([a-z])/,     // "change E to A"
    /replace\s+([a-z])\s+with\s+([a-z])/,  // "replace E with A"
    /([a-z])\s+to\s+([a-z])$/,             // "E to A"
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    if (match) {
      const [, from, to] = match
      // Validate: 'from' should be in selected letters, 'to' should be available
      return { type: 'executeSwap', from: from.toUpperCase(), to: to.toUpperCase() }
    }
  }

  return { type: 'unknown' }
}
```

### 2. `src/lib/voice/commandPhrases.ts`

```typescript
// Centralized phrase definitions for easy tuning

export const PASS_PHRASES = [
  'pass',
  'skip',
  'next',
  'next player',
  'skip this one',
  'skip this player',
]

export const SUB_PHRASES = [
  'sub',
  'substitute',
  'make a sub',
  'swap',
  'swap letter',
  'change letter',
  'substitution',
]

export const VAR_PHRASES = [
  'var',
  'hint',
  'help',
  'give me a hint',
  'show hint',
  'need a hint',
  'v a r', // spelled out
]

export const GUESS_PHRASES = [
  'guess',
  'i know',
  'i know this',
  'let me guess',
]

export const CANCEL_PHRASES = [
  'cancel',
  'close',
  'back',
  'go back',
  'never mind',
  'nevermind',
]
```

### 3. `src/hooks/useVoiceControl.ts`

```typescript
import { useState, useRef, useCallback, useEffect } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { parseIntent, Intent, GameContext } from '../lib/voice/intentParser'

interface UseVoiceControlOptions {
  onIntent: (intent: Intent) => void
  getContext: () => GameContext
  onError?: (error: string) => void
  onTranscript?: (text: string) => void // For UI feedback
}

export function useVoiceControl({
  onIntent,
  getContext,
  onError,
  onTranscript,
}: UseVoiceControlOptions) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const socketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
    }
    mediaRecorderRef.current = null

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close()
    }
    socketRef.current = null

    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null

    setIsEnabled(false)
  }, [])

  const start = useCallback(async () => {
    if (isEnabled || isConnecting) return
    setIsConnecting(true)

    try {
      // Get Deepgram token
      const functions = getFunctions()
      const getToken = httpsCallable(functions, 'getDeepgramToken')
      const result = await getToken()
      const token = (result.data as { token: string }).token

      // Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Connect to Deepgram
      const socket = new WebSocket(
        'wss://api.deepgram.com/v1/listen?model=nova-3&language=en&smart_format=true&interim_results=false',
        ['token', token]
      )
      socketRef.current = socket

      socket.onopen = () => {
        setIsConnecting(false)
        setIsEnabled(true)

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data)
          }
        }

        mediaRecorder.start(250) // 250ms chunks
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const transcript = data.channel?.alternatives?.[0]?.transcript

          if (transcript && data.is_final) {
            onTranscript?.(transcript)

            const context = getContext()
            const intent = parseIntent(transcript, context)

            if (intent.type !== 'unknown') {
              onIntent(intent)
            }
          }
        } catch {
          // Ignore parse errors
        }
      }

      socket.onerror = () => {
        onError?.('Voice connection error')
        stop()
      }

      socket.onclose = () => {
        setIsEnabled(false)
        setIsConnecting(false)
      }

    } catch (error) {
      setIsConnecting(false)
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          onError?.('Microphone access denied')
        } else {
          onError?.('Failed to start voice control')
        }
      }
    }
  }, [isEnabled, isConnecting, onIntent, getContext, onError, onTranscript, stop])

  const toggle = useCallback(() => {
    if (isEnabled) {
      stop()
    } else {
      start()
    }
  }, [isEnabled, start, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => stop()
  }, [stop])

  return {
    isEnabled,
    isConnecting,
    start,
    stop,
    toggle,
  }
}
```

---

## Files to Modify

### 1. `src/pages/GamePage.tsx`

Add voice control integration:

```typescript
// Add to imports
import { useVoiceControl } from '../hooks/useVoiceControl'
import { Mic, MicOff } from 'lucide-react'

// Inside GamePage component
const { isEnabled: isVoiceEnabled, isConnecting: isVoiceConnecting, toggle: toggleVoice } = useVoiceControl({
  onIntent: (intent) => {
    switch (intent.type) {
      case 'pass':
        if (passesRemaining > 0) handlePass()
        break
      case 'openSub':
        if (substitutesRemaining > 0) openModal('substitute')
        break
      case 'openVar':
        if (varHintsRemaining > 0) openModal('var')
        break
      case 'openGuess':
        openModal('guess')
        break
      case 'executeSwap':
        // Execute substitution directly if modal is open
        if (activeModal === 'substitute') {
          executeSubstitution(intent.from, intent.to)
        }
        break
      case 'guess':
        // Submit guess (could auto-open modal or submit directly)
        if (activeModal === 'guess') {
          submitGuess(intent.playerName)
        } else {
          openModal('guess')
          // Store pending guess to submit when modal opens
        }
        break
      case 'cancel':
        closeModal()
        break
    }
  },
  getContext: () => ({
    activeModal: activeModal || 'none',
    availableVowels: getAvailableVowels(),
    availableConsonants: getAvailableConsonants(),
    selectedLetters: selectedLetters,
  }),
  onError: (error) => showFeedback({ type: 'error', message: error }),
  onTranscript: (text) => {
    // Optional: show what was heard
    console.log('Heard:', text)
  },
})

// Add voice toggle button to UI (near other controls)
<button
  onClick={toggleVoice}
  className={`p-3 rounded-full ${isVoiceEnabled ? 'bg-red-600 animate-pulse' : 'bg-gray-700'}`}
  title={isVoiceEnabled ? 'Disable voice control' : 'Enable voice control'}
>
  {isVoiceConnecting ? (
    <Loader2 className="w-6 h-6 animate-spin" />
  ) : isVoiceEnabled ? (
    <MicOff className="w-6 h-6" />
  ) : (
    <Mic className="w-6 h-6" />
  )}
</button>
```

### 2. `src/components/modals/SubstituteModal.tsx`

The substitute modal may need to expose a way to execute substitutions programmatically, or the voice control can interact with the game store directly.

### 3. `src/store/gameStore.ts`

Ensure these actions are exposed:
- `handlePass()` - already exists
- `executeSubstitution(from, to)` - may need to add
- `submitGuess(playerName)` - already exists via `processGuess`

---

## UI/UX Additions

### Voice Control Toggle Button
- Position: Top-right of game screen or near other controls
- States:
  - Gray mic icon = voice off
  - Spinning loader = connecting
  - Red pulsing mic = listening

### Visual Feedback (Optional Enhancement)
- Show floating "transcript bubble" briefly when speech is recognized
- Flash the relevant button when a command is recognized (e.g., flash Pass button when "pass" is heard)
- Show "Listening..." text indicator

### Onboarding
- First time: show tooltip explaining voice commands
- Settings page: list of available voice commands

---

## Cost Analysis

**Deepgram Nova-3 Pricing:** ~$0.0043/minute

| Scenario | Duration | Cost |
|----------|----------|------|
| Single game | 3 min | $0.013 |
| Single game | 5 min | $0.022 |
| Heavy user (10 games/day) | 50 min | $0.22/day |
| Monthly heavy user | 1500 min | $6.45/month |

**Mitigation strategies:**
1. Voice control is opt-in (button to enable)
2. Could add daily usage limits per user
3. Could pause streaming when game is paused/between rounds

---

## Edge Cases & Solutions

| Edge Case | Solution |
|-----------|----------|
| Player name sounds like command (e.g., "Paz" vs "pass") | Context helps - if in guess modal, treat everything as guess |
| Background noise triggers command | Require some confidence threshold; phrases must be somewhat complete |
| User says "pass" but means the player Paz | Could add confirmation for commands, or require "pass it" not just "pass" |
| Network drops mid-game | Auto-reconnect with exponential backoff; show "reconnecting..." state |
| No microphone permission | Show helpful error message; voice toggle becomes disabled |
| Deepgram token expires | Token lasts 15 min; refresh before expiry or on reconnect |
| Trailing punctuation on names | `cleanTranscript()` strips `.`, `,`, `!`, `?` from end |

---

## Testing Plan

1. **Unit tests for intent parser**
   - Test each phrase variant is recognized
   - Test context-aware behavior
   - Test substitution pattern matching
   - Test punctuation stripping

2. **Integration testing**
   - Enable voice, speak commands, verify actions fire
   - Test with various accents/speeds (manual)

3. **Edge case testing**
   - Disconnect network mid-stream
   - Deny microphone permission
   - Speak very quickly/slowly

---

## Implementation Order

1. **Phase 1: Intent Parser** (no UI changes)
   - Create `intentParser.ts` and `commandPhrases.ts`
   - Write unit tests

2. **Phase 2: Voice Control Hook**
   - Create `useVoiceControl.ts`
   - Test with console.log outputs

3. **Phase 3: GamePage Integration**
   - Add voice toggle button
   - Wire up intent handlers
   - Test full flow

4. **Phase 4: Polish**
   - Add visual feedback
   - Handle edge cases
   - Add onboarding/help text

---

## Future Enhancements

- **Voice feedback**: Game speaks back ("Correct! That's Ronaldo!")
- **Customizable wake word**: "Hey ref, pass"
- **Language support**: Spanish, French, etc.
- **Voice profiles**: Learn user's accent over time
