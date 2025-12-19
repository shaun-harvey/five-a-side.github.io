# Five-a-Side: React + Firebase Migration

## Source of Truth
`new_version.html` - All code, styling, and player data will be extracted from this file.

---

## Phase 1: Project Setup
- [ ] 1.1 Create new Vite + React + TypeScript project
- [ ] 1.2 Install dependencies (tailwindcss, zustand, firebase, react-router-dom)
- [ ] 1.3 Configure Tailwind CSS (tailwind.config.js, postcss.config.js)
- [ ] 1.4 Copy custom CSS animations from new_version.html
- [ ] 1.5 Set up folder structure (components, hooks, store, lib, types, pages)
- [ ] 1.6 Create Firebase project in Firebase Console
- [ ] 1.7 Enable Firebase Authentication (Email/Password + Google)
- [ ] 1.8 Create Firestore database in Firebase Console
- [ ] 1.9 Create .env.local with Firebase credentials
- [ ] 1.10 Configure ESLint + Prettier

## Phase 2: Firebase Backend Setup
- [ ] 2.1 Create src/lib/firebase/config.ts - Firebase initialization
- [ ] 2.2 Create src/lib/firebase/auth.ts - Auth helper functions
- [ ] 2.3 Create src/lib/firebase/firestore.ts - Firestore operations
- [ ] 2.4 Write firestore.rules security rules file
- [ ] 2.5 Write firestore.indexes.json for compound indexes
- [ ] 2.6 Extract all players from new_version.html to src/data/players.json
- [ ] 2.7 Create scripts/seed-players.ts script
- [ ] 2.8 Run seed script to populate players collection (~468 players)
- [ ] 2.9 Test security rules with Firebase Emulator

## Phase 3: TypeScript Types & Constants
- [ ] 3.1 Create src/types/player.ts - Player interfaces
- [ ] 3.2 Create src/types/user.ts - User/auth interfaces
- [ ] 3.3 Create src/types/game.ts - Game state interfaces
- [ ] 3.4 Create src/lib/game/constants.ts - Game constants (times, points, etc.)

## Phase 4: Core Game Logic
- [ ] 4.1 Create src/lib/game/letterUtils.ts - VOWELS array, letter validation
- [ ] 4.2 Create src/lib/game/levenshtein.ts - Port distance algorithm
- [ ] 4.3 Create src/lib/game/guessValidator.ts - Port processGuess logic (70% similarity)
- [ ] 4.4 Create src/lib/game/playerUtils.ts - Name masking, player filtering
- [ ] 4.5 Create src/lib/game/scoreCalculator.ts - Point calculation logic
- [ ] 4.6 Write unit tests for game logic

## Phase 5: State Management (Zustand)
- [ ] 5.1 Create src/store/authStore.ts - Auth state (user, loading, error)
- [ ] 5.2 Create src/store/uiStore.ts - Modal states, loading indicators
- [ ] 5.3 Create src/store/gameStore.ts - Port full GameState class
  - [ ] 5.3.1 Letter selection state (chosenLetters, availableLetters, vowelCount)
  - [ ] 5.3.2 Current game state (currentPlayer, currentRound, timeLeft, isGameOver)
  - [ ] 5.3.3 Resources state (score, passesLeft, substitutionsLeft, varHintsLeft, wrongGuesses)
  - [ ] 5.3.4 Streak system (correctStreak, hasEarnedVARBonus)
  - [ ] 5.3.5 Tracking (usedPlayers, varHintedPlayers, guessAttemptsForCurrentPlayer)
  - [ ] 5.3.6 All game actions (selectLetter, startGame, processGuess, usePass, etc.)

## Phase 6: Custom Hooks
- [ ] 6.1 Create src/hooks/useAuth.ts - Firebase auth state hook
- [ ] 6.2 Create src/hooks/useTimer.ts - Timer with drift correction
- [ ] 6.3 Create src/hooks/usePlayers.ts - Fetch & cache players from Firestore
- [ ] 6.4 Create src/hooks/useLeaderboard.ts - Fetch/submit scores
- [ ] 6.5 Create src/hooks/useAntiCheat.ts - Tab/window blur detection

## Phase 7: Common Components (Mobile-First)
- [ ] 7.1 Create src/components/common/Button.tsx - 44px min tap target
- [ ] 7.2 Create src/components/common/Modal.tsx - Full-screen on mobile
- [ ] 7.3 Create src/components/common/Timer.tsx - Large, prominent countdown
- [ ] 7.4 Create src/components/common/TimerBar.tsx - Full-width progress bar
- [ ] 7.5 Test all common components on mobile (iPhone SE, standard iPhone)

## Phase 8: Auth Components (Mobile-First)
- [ ] 8.1 Create src/components/auth/LoginForm.tsx - Large inputs, keyboard-friendly
- [ ] 8.2 Create src/components/auth/SignUpForm.tsx - Large inputs, keyboard-friendly
- [ ] 8.3 Create src/components/auth/GoogleSignInButton.tsx - Big tap target
- [ ] 8.4 Create src/components/auth/AuthGuard.tsx - Protected route wrapper
- [ ] 8.5 Test auth flow on mobile (keyboard handling, form submission)

## Phase 9: Game Components (Mobile-First)
- [ ] 9.1 Create src/components/game/LetterGrid.tsx - Large tap targets, 2-row layout
- [ ] 9.2 Create src/components/game/PlayerCard.tsx - Full-width, large scrambled text
- [ ] 9.3 Create src/components/game/Scoreboard.tsx - 2x3 grid, compact but readable
- [ ] 9.4 Create src/components/game/GameControls.tsx - Fixed bottom bar, equal buttons
- [ ] 9.5 Create src/components/game/CurrentTeam.tsx - Horizontal scroll if needed
- [ ] 9.6 Create src/components/game/FeedbackPopup.tsx - Toast-style, doesn't block
- [ ] 9.7 Create src/components/game/GameContainer.tsx - Orchestrates layout
- [ ] 9.8 Test all game components on mobile (touch, scroll, layout)

## Phase 10: Modal Components (Mobile-First)
- [ ] 10.1 Create src/components/modals/GuessModal.tsx - Full-screen, keyboard safe
- [ ] 10.2 Create src/components/modals/SubstituteModal.tsx - Scrollable, large buttons
- [ ] 10.3 Create src/components/modals/VARModal.tsx - Full-screen, readable hint
- [ ] 10.4 Create src/components/modals/InstructionsModal.tsx - Swipeable carousel
- [ ] 10.5 Create src/components/modals/HighScoresModal.tsx - Scrollable list
- [ ] 10.6 Test all modals on mobile (keyboard, scroll, dismiss gestures)

## Phase 11: Layout Components (Mobile-First)
- [ ] 11.1 Create src/components/layout/Header.tsx - Hamburger menu on mobile
- [ ] 11.2 Create src/components/layout/GameLayout.tsx - Safe area padding, no overflow
- [ ] 11.3 Test layout on various mobile sizes (SE, standard, Plus/Max)

## Phase 12: Pages (Mobile-First)
- [ ] 12.1 Create src/pages/LoginPage.tsx - Centered form, keyboard handling
- [ ] 12.2 Create src/pages/HomePage.tsx - Vertical stack layout on mobile
- [ ] 12.3 Create src/pages/LeaderboardPage.tsx - Scrollable table/list
- [ ] 12.4 Set up React Router in src/App.tsx
- [ ] 12.5 Full mobile end-to-end test of all pages

## Phase 13: Integration & Wiring
- [ ] 13.1 Wire up auth flow (login -> redirect to game)
- [ ] 13.2 Wire up game flow (letter select -> rounds -> game over)
- [ ] 13.3 Connect score submission to Firestore
- [ ] 13.4 Connect leaderboard display to Firestore
- [ ] 13.5 Implement recently-used player tracking per user
- [ ] 13.6 Handle localStorage migration for existing players

## Phase 14: Anti-Cheat, Animations & Final Polish
- [ ] 14.1 Implement visibility change detection (tab switch = game over)
- [ ] 14.2 Implement window blur detection
- [ ] 14.3 Add animations (fade-in, slide-in, pulse, stadium-glow)
- [ ] 14.4 Add loading states and error handling throughout
- [ ] 14.5 Performance optimization (React.memo, useMemo, lazy loading)
- [ ] 14.6 Final mobile QA: test complete game flow on real devices
- [ ] 14.7 Cross-browser testing (Safari iOS, Chrome Android)
- [ ] 14.8 PWA setup (manifest.json, service worker for offline)

## Phase 15: Deployment
- [ ] 15.1 Create firebase.json hosting config
- [ ] 15.2 Deploy Firestore rules and indexes
- [ ] 15.3 Build production bundle (npm run build)
- [ ] 15.4 Deploy to Firebase Hosting (firebase deploy)
- [ ] 15.5 Test production deployment
- [ ] 15.6 Set up GitHub Actions CI/CD (optional)

---

# FUTURE EXPANSION

## Phase A: La Liga
- [ ] A.1 Research & compile ~150 La Liga players (modern, legends, obscure)
- [ ] A.2 Add players to Firestore with league: 'la-liga'
- [ ] A.3 Add league selector UI on home page
- [ ] A.4 Update usePlayers hook to filter by league
- [ ] A.5 Update game UI theming for La Liga (colors, branding)

## Phase B: Other Leagues
- [ ] B.1 Serie A players (~150)
- [ ] B.2 Bundesliga players (~150)
- [ ] B.3 Ligue 1 players (~150)
- [ ] B.4 League-specific theming for each

## Phase C: Champions League System
- [ ] C.1 Add European Points tracking to user profile
- [ ] C.2 Create EP earning logic in score submission
- [ ] C.3 Add Champions League unlock check
- [ ] C.4 Compile Champions League players (~150+)
- [ ] C.5 Create Champions League UI theme (starball, anthem vibe)
- [ ] C.6 Add qualification progress indicator on home page
- [ ] C.7 Special "CL Nights" events (weekly bonus EP opportunities)

---

# Champions League Qualification

**How to Qualify:**
- Play games across ANY of the 5 domestic leagues
- Earn "European Points" based on performance:
  - Complete a game: +10 EP
  - Score 50+ points: +25 EP
  - Score 100+ points: +50 EP
  - Perfect round (no wrong guesses): +20 EP
  - Streak bonus earned: +15 EP
- **Threshold**: 500 European Points unlocks Champions League mode

**Champions League Mode:**
- Round 1 (45s): Current CL stars
- Round 2 (45s): CL legends (Messi, Ronaldo, Zidane, etc.)
- Round 3 (30s): Obscure CL players
- Higher point multiplier (4/8 instead of 3/6)

---

# Mobile-First Checklist (Per Component)
- [ ] Works on iPhone SE (375px width)
- [ ] Works on standard iPhone (390px width)
- [ ] Works on larger phones (428px width)
- [ ] Works on tablets (768px+)
- [ ] Touch targets are 44px minimum
- [ ] No horizontal scroll
- [ ] Keyboard doesn't break layout
- [ ] Landscape orientation handled
