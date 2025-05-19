import assert from 'assert';
import { GameState, handleStreak, getHighScores, saveHighScore, LocalStorageMock } from '../src/game.js';

// Test GameState.reset()
{
  const game = new GameState();
  game.score = 10;
  game.varHintsLeft = 2;
  game.isGameOver = true;
  game.correctStreak = 3;
  game.reset();
  assert.strictEqual(game.score, 0, 'score should reset to 0');
  assert.strictEqual(game.varHintsLeft, 5, 'varHintsLeft should reset to 5');
  assert.strictEqual(game.isGameOver, false, 'isGameOver should reset to false');
  assert.strictEqual(game.correctStreak, 0, 'correctStreak should reset to 0');
  assert.deepStrictEqual(game.chosenLetters, [], 'chosenLetters should be empty');
  assert.strictEqual(game.availableLetters.length, 26, 'availableLetters should contain 26 letters');
}

// Test streak logic and bonus
{
  const game = new GameState();
  for (let i = 0; i < 5; i++) {
    handleStreak(game, true);
  }
  assert.strictEqual(game.correctStreak, 5, 'streak should be 5');
  assert.strictEqual(game.varHintsLeft, 5, 'bonus not yet awarded');
  handleStreak(game, true); // 6th correct answer
  assert.strictEqual(game.correctStreak, 6, 'streak should be 6');
  assert.strictEqual(game.varHintsLeft, 10, 'bonus hints awarded');
  assert.strictEqual(game.hasEarnedVARBonus, true, 'bonus flag set');
  handleStreak(game, true); // additional correct answer
  assert.strictEqual(game.varHintsLeft, 10, 'no additional bonus after first');
  handleStreak(game, false); // wrong answer resets streak
  assert.strictEqual(game.correctStreak, 0, 'streak resets on wrong answer');
}

// Test high score saving and retrieval
{
  const storage = new LocalStorageMock();
  storage.setItem('userName', 'Alice');
  storage.setItem('highScores', JSON.stringify([{ name: 'Bob', score: 30 }, { name: 'Carol', score: 20 }]));
  saveHighScore(25, storage);
  const scores = JSON.parse(storage.getItem('highScores'));
  assert.deepStrictEqual(scores, [
    { name: 'Bob', score: 30 },
    { name: 'Alice', score: 25 },
    { name: 'Carol', score: 20 }
  ], 'scores should be sorted and include new entry');
  const top = getHighScores(storage);
  assert.deepStrictEqual(top, scores, 'getHighScores should return sorted list');
}

console.log('All tests executed');
