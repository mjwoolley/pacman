import { STATE, STARTING_LIVES, EXTRA_LIFE_SCORE } from '../constants.js';
import { soundManager } from './soundManager.js';

const HIGH_SCORE_KEY = 'pacman_high_score';

function loadHighScore() {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    return stored ? parseInt(stored, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // localStorage unavailable (tests, private browsing, etc.)
  }
}

export const gameState = {
  score: 0,
  highScore: loadHighScore(),
  lives: STARTING_LIVES,
  dotsRemaining: 244,
  powerPelletActive: false,
  powerPelletTimer: 0,
  ghostEatCombo: 0,
  won: false,
  currentState: STATE.READY,
  extraLifeAwarded: false,

  addScore(points) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveHighScore(this.highScore);
    }
    if (!this.extraLifeAwarded && this.score >= EXTRA_LIFE_SCORE) {
      this.extraLifeAwarded = true;
      this.lives++;
      soundManager.playExtraLife();
    }
  },

  loseLife() {
    this.lives--;
    return this.lives;
  },

  isGameOver() {
    return this.lives <= 0;
  },

  reset() {
    this.score = 0;
    const stored = loadHighScore();
    this.highScore = Math.max(this.highScore, stored);
    this.lives = STARTING_LIVES;
    this.dotsRemaining = 244;
    this.powerPelletActive = false;
    this.powerPelletTimer = 0;
    this.ghostEatCombo = 0;
    this.won = false;
    this.currentState = STATE.READY;
    this.extraLifeAwarded = false;
  }
};
