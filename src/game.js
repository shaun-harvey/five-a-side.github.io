class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.chosenLetters = [];
    this.availableLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    this.currentPlayer = "";
    this.displayedName = "";
    this.score = 0;
    this.substitutionsLeft = 5;
    this.passesLeft = 5;
    this.varHintsLeft = 5;
    this.timeLeft = 45;
    this.currentRound = 0;
    this.timerInterval = null;
    this.usedPlayers = { 1: [], 2: [], 3: [] };
    this.usedLetters = new Set();
    this.substitutedLetters = new Set();
    this.currentPlayerLetters = new Set();
    this.pendingSubstitutions = {};
    this.allChosenLetters = new Set();
    this.vowelCount = 0;
    this.substitutionColorMap = {};
    this.wrongGuesses = 0;
    this.substitutionTimeoutCount = 0;
    this.isGameOver = false;
    this.guessAttemptsForCurrentPlayer = 0;
    this.timeWastingOffenses = 0;
    this.correctStreak = 0;
    this.hasEarnedVARBonus = false;
    this.hasPerfectStreak = true;
    this.varHintedPlayers = new Set();
  }
}

function handleStreak(gameState, isCorrect) {
  if (isCorrect) {
    gameState.correctStreak++;
    if (gameState.correctStreak === 6 && !gameState.hasEarnedVARBonus) {
      gameState.varHintsLeft += 5;
      gameState.hasEarnedVARBonus = true;
    }
  } else {
    gameState.correctStreak = 0;
  }
}

const MAX_HIGH_SCORES = 6;

class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key)
      ? this.store[key]
      : null;
  }
  setItem(key, value) {
    this.store[key] = value;
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

function getHighScores(storage) {
  const highScores = JSON.parse(storage.getItem("highScores")) || [];
  return highScores
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HIGH_SCORES);
}

function saveHighScore(score, storage) {
  const userName = storage.getItem("userName");
  const highScores = getHighScores(storage);
  highScores.push({ name: userName, score });
  highScores.sort((a, b) => b.score - a.score);
  highScores.splice(MAX_HIGH_SCORES);
  storage.setItem("highScores", JSON.stringify(highScores));
}

export {
  GameState,
  handleStreak,
  getHighScores,
  saveHighScore,
  LocalStorageMock,
};
