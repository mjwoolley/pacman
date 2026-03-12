import { CELL, MAZE_OFFSET_Y, SCORE } from '../constants.js';
import { gameState } from '../systems/gameState.js';

const FRUIT_COL = 14;
const FRUIT_ROW = 17;
const FRUIT_TIMEOUT = 10; // seconds
const FRUIT_SPAWN_DOTS = [70, 170]; // dots eaten triggers
const MAX_FRUITS = 2;

export class Fruit {
  constructor() {
    this.active = false;
    this.timer = 0;
    this.fruitsSpawned = 0;
    this.nextSpawnIndex = 0;
    this.scorePopup = null;
  }

  get col() { return FRUIT_COL; }
  get row() { return FRUIT_ROW; }

  update(dt) {
    // Check if we should spawn
    const dotsEaten = 244 - gameState.dotsRemaining;
    if (!this.active && this.nextSpawnIndex < MAX_FRUITS &&
        dotsEaten >= FRUIT_SPAWN_DOTS[this.nextSpawnIndex]) {
      this.active = true;
      this.timer = FRUIT_TIMEOUT;
      this.fruitsSpawned++;
      this.nextSpawnIndex++;
    }

    // Countdown active fruit
    if (this.active) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.active = false;
      }
    }

    // Update score popup
    if (this.scorePopup) {
      this.scorePopup.timer -= dt;
      if (this.scorePopup.timer <= 0) {
        this.scorePopup = null;
      }
    }
  }

  checkCollection(pacman) {
    if (!this.active) return false;
    const tile = pacman.getTile();
    if (tile.col === FRUIT_COL && tile.row === FRUIT_ROW) {
      this.active = false;
      gameState.addScore(SCORE.CHERRY);
      this.scorePopup = {
        x: FRUIT_COL * CELL + CELL / 2,
        y: FRUIT_ROW * CELL + MAZE_OFFSET_Y + CELL / 2,
        text: String(SCORE.CHERRY),
        timer: 1.0,
      };
      return true;
    }
    return false;
  }

  draw(ctx) {
    if (this.active) {
      const x = FRUIT_COL * CELL + CELL / 2;
      const y = FRUIT_ROW * CELL + MAZE_OFFSET_Y + CELL / 2;
      const r = CELL * 0.25;

      // Two red circles (cherry pair)
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(x - r * 0.7, y + r * 0.3, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + r * 0.7, y + r * 0.3, r, 0, Math.PI * 2);
      ctx.fill();

      // Green stems
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.7, y + r * 0.3 - r);
      ctx.quadraticCurveTo(x - r * 0.2, y - r * 1.5, x, y - r * 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + r * 0.7, y + r * 0.3 - r);
      ctx.quadraticCurveTo(x + r * 0.2, y - r * 1.5, x, y - r * 1.2);
      ctx.stroke();
    }

    // Score popup
    if (this.scorePopup) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${CELL * 0.6}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.scorePopup.text, this.scorePopup.x, this.scorePopup.y);
    }
  }

  reset() {
    this.active = false;
    this.timer = 0;
    this.fruitsSpawned = 0;
    this.nextSpawnIndex = 0;
    this.scorePopup = null;
  }
}
