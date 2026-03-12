export const gameState = {
  score: 0,
  highScore: 0,
  lives: 3,
  dotsRemaining: 244,
  powerPelletActive: false,
  powerPelletTimer: 0,
  ghostEatCombo: 0,
  won: false,

  addScore(points) {
    this.score += points;
    if (this.score > this.highScore) this.highScore = this.score;
  },

  reset() {
    this.score = 0;
    this.lives = 3;
    this.dotsRemaining = 244;
    this.powerPelletActive = false;
    this.powerPelletTimer = 0;
    this.ghostEatCombo = 0;
    this.won = false;
  }
};
