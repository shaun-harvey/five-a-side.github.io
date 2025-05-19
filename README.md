# Five-a-side: Premier League Quiz Game

A football-themed quiz game where you try to guess as many Premier League players as possible using your chosen letters. Test your knowledge across three rounds featuring current stars, legends, and forgotten heroes of the Premier League!

## Basic Rules

1. Choose your starting lineup: 1 vowel and 4 consonants
2. Use these letters to help you identify players
3. You can guess either the player's full name or just their surname to get points
4. Rounds 1 and 2 last 45 seconds, Round 3 lasts 30 seconds
5. Score 3 points per correct guess in Rounds 1 and 2, and 6 points per correct guess in Round 3

## Game Features

### Substitutions

- You get 5 substitutions per game
- Vowels can only be substituted for vowels, and consonants for consonants
- Each substitution window has a 20-second time limit
- Using substitutions does NOT break your streak bonus
- Time wasting with substitutions will result in penalties

### Passes

- You get 5 passes per game
- Use these to skip players you're unsure about
- Using a pass WILL break your streak bonus
- Choose wisely between passing and guessing!

### VAR Hints

- Round 1: Start with 5 VAR hints
- Round 2: Get 5 more VAR hints (only if you have hints remaining from Round 1)
- Round 3: Get 1 VAR hint (only if you have hints remaining from Round 2)
- Each VAR check has a 20-second time limit
- Each check gives you a hint about the player's identity
- Using all your hints in a round without earning the bonus means no new hints next round!

### 6 Pointer Bonus System

Earn bonus VAR hints by building a streak:

- Get 6 correct guesses in a row to earn 5 bonus VAR hints
- Substitutions are allowed during your streak
- Using passes will break your streak
- Incorrect guesses break your streak
- Streaks can continue across rounds
- You can only earn the bonus once per game
- WARNING: If you use all your VAR hints trying for the bonus and don't achieve it, you won't get new hints in the next round!

## Special Rules

### Shot on Target Rule

If your guess is close to the correct surname, it counts as a goal! Examples include:

- "Lampty" for "Lamptey"
- "Robertsno" for "Robertson"
- "Pedor" for "Pedro"

The game uses advanced string matching to recognize when you clearly knew the player but had a small typo.

### Time Wasting Rules

To prevent cheating by repeatedly opening windows, there's a strict three-strikes policy:

1. First Time Wasting Offense

   - Triggered by opening guess window 3+ times for the same player
   - Warning message (in green)
   - Costs one guess
   - Message: "That's a warning for time wasting! Get on with the game!"

2. Second Time Wasting Offense

   - Yellow card message
   - Costs another guess
   - Message: "That's a booking for time wasting! Get on with the game!"

3. Third Time Wasting Offense
   - Red card message
   - Game Over
   - Message: "I can't believe you have got yourself sent off for time wasting!"

### Anti-Cheating Measures

- Leaving the game window or switching tabs results in immediate disqualification
- Substitution and VAR windows have 20-second time limits
- Guess windows have 20 second time limits
- Excessive time wasting with any feature results in penalties

## Game Over Conditions

The game ends when any of these occur:

- You complete all three rounds
- You get 3 wrong guesses
- You get three time wasting penalties
- You leave the game window or switch tabs
- You waste too much time with substitutions

## Rounds

1. **Round 1: Current Stars** (45 seconds)

   - Guess current Premier League players
   - 3 points per correct guess
   - Start with 5 VAR hints

2. **Round 2: Legends** (45 seconds)

   - Guess Premier League legends
   - 3 points per correct guess
   - Get 5 more VAR hints (if you have hints remaining)

3. **Round 3: Forgotten Heroes** (30 seconds)
   - Guess obscure Premier League stars from the past
   - 6 points per correct guess
   - Get 1 VAR hint (if you have hints remaining)

## Season System

- Each player can play up to 6 games per "season"
- After 6 games, your season resets and all player pools refresh
- Game keeps track of recently used players to ensure variety
- High scores table shows the top 6 scores

## Tips for Success

- Use substitutions freely - they don't break your streak!
- Save passes for emergencies since they break your streak
- Try to build streaks of correct guesses for bonus VAR hints
- Consider saving some VAR hints for later rounds
- Be careful not to use all your VAR hints chasing the bonus if you're not confident
- Remember you only need the surname to get points
- Watch out for time wasting penalties!
- Keep track of your streak - 6 in a row earns valuable bonus hints!

## License

This project is licensed under the [MIT License](LICENSE).

