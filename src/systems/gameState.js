import { STATE, STARTING_LIVES, EXTRA_LIFE_SCORE } from '../constants.js';

export const gameState = {
  score: 0,
  highScore: 0,
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
    if (this.score > this.highScore) this.highScore = this.score;
    if (!this.extraLifeAwarded && this.score >= EXTRA_LIFE_SCORE) {
      this.extraLifeAwarded = true;
      this.lives++;
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
