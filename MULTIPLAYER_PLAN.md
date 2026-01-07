# Multiplayer & Tournament System Plan

## Overview
Add head-to-head multiplayer and tournament features where players compete by playing their own games and comparing scores.

---

## Core Concepts

### Head-to-Head Matches
- Two players are matched up
- Each plays their **own** game (own letters, own random players)
- Higher score wins
- **Tiebreaker**: Penalty shootout (5 players each, most correct wins, then sudden death if still tied)

### Tournament Formats
1. **Knockout Brackets** - Single elimination, bracket visualization
2. **League Tables** - Round-robin, everyone plays everyone, points standings

### Access Levels
- **Public tournaments** - Anyone can join
- **Private groups** - Invite-only friend groups for recurring competitions
- **Custom deadlines** - Tournament creator sets time limits for matches

---

## Phase 1: Challenges (Foundation)

### New Files
- `src/stores/challengeStore.ts` - Challenge state management
- `src/services/challengeService.ts` - Firebase operations for challenges
- `src/pages/ChallengesPage.tsx` - List of active/past challenges
- `src/components/ChallengeCard.tsx` - Challenge display component

### Firestore Collections
```
challenges/{challengeId}
  - challengerId: string
  - challengerScore: number | null
  - challengerGameId: string | null
  - opponentId: string
  - opponentScore: number | null
  - opponentGameId: string | null
  - status: 'pending' | 'in_progress' | 'completed'
  - winnerId: string | null
  - createdAt: timestamp
  - deadline: timestamp
```

### Features
- Challenge a friend by username or share link
- Track pending/active/completed challenges
- Win/loss record on profile

---

## Phase 2: Penalty Shootout (Tiebreaker)

### New Files
- `src/pages/PenaltyShootoutPage.tsx` - Shootout game mode
- `src/components/PenaltyShootout/` - Shootout-specific components
- `src/stores/penaltyStore.ts` - Shootout state

### Mechanics
1. Each player picks 1 vowel + 4 consonants (same as main game)
2. 5 players shown one at a time
3. One guess attempt per player (no passes/subs/VAR)
4. Most correct out of 5 wins
5. If tied: sudden death rounds until winner

---

## Phase 3: Tournaments - Knockout

### New Files
- `src/pages/TournamentsPage.tsx` - Tournament list/browse
- `src/pages/TournamentDetailPage.tsx` - Single tournament view
- `src/pages/CreateTournamentPage.tsx` - Tournament creation form
- `src/components/Tournament/Bracket.tsx` - Knockout bracket visualization
- `src/services/tournamentService.ts` - Tournament Firebase operations
- `src/stores/tournamentStore.ts` - Tournament state

### Firestore Collections
```
tournaments/{tournamentId}
  - name: string
  - creatorId: string
  - type: 'knockout' | 'league'
  - status: 'registration' | 'in_progress' | 'completed'
  - isPublic: boolean
  - maxPlayers: 8 | 16 | 32
  - matchDeadlineHours: number
  - participants: string[] (user IDs)
  - bracket: object (knockout structure)
  - createdAt: timestamp
  - startedAt: timestamp | null

tournaments/{tournamentId}/matches/{matchId}
  - round: number
  - player1Id: string
  - player2Id: string
  - player1Score: number | null
  - player2Score: number | null
  - winnerId: string | null
  - status: 'pending' | 'in_progress' | 'completed' | 'penalty'
  - deadline: timestamp
```

### Features
- Create knockout tournament (8/16/32 players)
- Random seeding when tournament starts
- Visual bracket showing all matches
- Auto-advance winners to next round
- Penalty shootout for ties

---

## Phase 4: Tournaments - League

### New Files
- `src/components/Tournament/LeagueTable.tsx` - Standings table
- Update `TournamentDetailPage.tsx` to handle league format

### Firestore Additions
```
tournaments/{tournamentId}
  - standings: { [userId]: { played, won, drawn, lost, points, scored } }

(matches collection same as knockout)
```

### Features
- Round-robin fixture generation
- Points system: Win = 3pts, Draw = 1pt, Loss = 0pts
- League table with standings
- Tiebreaker: Goal difference (total score difference)

---

## Phase 5: Friend Groups

### New Files
- `src/pages/GroupsPage.tsx` - My groups list
- `src/pages/GroupDetailPage.tsx` - Group view with members & tournaments
- `src/pages/CreateGroupPage.tsx` - Create group form
- `src/components/GroupInvite.tsx` - Invite link/code component

### Firestore Collections
```
groups/{groupId}
  - name: string
  - creatorId: string
  - memberIds: string[]
  - inviteCode: string (short unique code)
  - createdAt: timestamp

groups/{groupId}/tournaments/{tournamentId}
  (reference to main tournament)
```

### Features
- Create private friend group
- Invite via link or code
- Run tournaments within group
- Group leaderboard (all-time stats)

---

## Phase 6: Push Notifications

### Setup
- Firebase Cloud Messaging (FCM) integration
- Service worker for background notifications

### New Files
- `src/services/notificationService.ts` - FCM token management
- `functions/src/notifications.ts` - Cloud Functions to trigger notifications
- `public/firebase-messaging-sw.js` - Service worker for push

### Notification Triggers
- "You've been challenged by [name]!"
- "Your match against [name] is ready"
- "24 hours left to complete your match"
- "You advanced to Round [X]!"
- "Tournament [name] is starting!"

---

## UI/Navigation Updates

### Modified Files
- `src/components/Navbar.tsx` - Add Tournaments/Challenges nav items
- `src/App.tsx` - Add new routes
- `src/pages/StatsPage.tsx` - Add multiplayer stats (W/L record, tournaments won)

### New Navigation Structure
```
Home | Play | Leaderboard | Tournaments | Stats | Rules
                              |
                              ├── My Challenges
                              ├── Browse Tournaments
                              ├── My Groups
                              └── Create Tournament
```

---

## Implementation Order

1. **Phase 1**: Basic 1v1 challenges (2-3 days)
2. **Phase 2**: Penalty shootout mode (1-2 days)
3. **Phase 3**: Knockout tournaments (3-4 days)
4. **Phase 4**: League format (2 days)
5. **Phase 5**: Friend groups (2 days)
6. **Phase 6**: Push notifications (1-2 days)

Each phase is independently valuable - can ship after Phase 1 and iterate.

---

## Resolved Decisions
- **Missed deadline**: Auto-forfeit (0 points, opponent advances)
- **Notifications**: Push notifications via Firebase Cloud Messaging
- **Minimum players**: 4 for knockout, 3 for league
