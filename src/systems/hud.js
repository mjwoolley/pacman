import { CELL, CANVAS_WIDTH, MAZE_ROWS, MAZE_OFFSET_Y, COLORS } from '../constants.js';
import { gameState } from './gameState.js';

const LIFE_RADIUS = CELL * 0.35;
const LIFE_MOUTH = (30 * Math.PI) / 180;
const CHERRY_RADIUS = CELL * 0.2;

export class HUD {
  constructor() {
    this.fruitsCollected = 0;
  }

  collectFruit() {
    this.fruitsCollected++;
  }

  reset() {
    this.fruitsCollected = 0;
  }

  draw(ctx) {
    this._drawTopHUD(ctx);
    this._drawBottomHUD(ctx);
  }

  _drawTopHUD(ctx) {
    ctx.font = `${CELL * 0.7}px monospace`;

    // 1UP + score (left)
    ctx.fillStyle = COLORS.TEXT;
    ctx.textAlign = 'left';
    ctx.fillText('1UP', CELL * 3, CELL * 1.2);
    ctx.fillText(String(gameState.score).padStart(2, ' '), CELL * 1, CELL * 2.2);

    // HIGH SCORE (center)
    ctx.textAlign = 'center';
    ctx.fillText('HIGH SCORE', CANVAS_WIDTH / 2, CELL * 1.2);
    ctx.fillText(String(gameState.highScore).padStart(2, ' '), CANVAS_WIDTH / 2, CELL * 2.2);

    // 2UP (right)
    ctx.textAlign = 'right';
    ctx.fillText('2UP', CANVAS_WIDTH - CELL * 3, CELL * 1.2);
  }

  _drawBottomHUD(ctx) {
    const bottomY = (MAZE_ROWS + 3 + 1) * CELL + CELL / 2;

    // Life icons (left) — show lives - 1
    ctx.fillStyle = COLORS.PACMAN;
    for (let i = 0; i < gameState.lives - 1; i++) {
      const lifeX = CELL * 2 + i * CELL * 1.5;
      const rotation = Math.PI; // face left
      ctx.beginPath();
      ctx.arc(lifeX, bottomY, LIFE_RADIUS, rotation + LIFE_MOUTH, rotation + 2 * Math.PI - LIFE_MOUTH);
      ctx.lineTo(lifeX, bottomY);
      ctx.fill();
    }

    // Fruit indicator (right) — show collected fruits as cherry icons
    for (let i = 0; i < this.fruitsCollected; i++) {
      const fx = CANVAS_WIDTH - CELL * 2 - i * CELL * 1.5;
      const r = CHERRY_RADIUS;

      // Two red circles
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(fx - r * 0.5, bottomY + r * 0.2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx + r * 0.5, bottomY + r * 0.2, r, 0, Math.PI * 2);
      ctx.fill();

      // Green stem
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx, bottomY + r * 0.2 - r);
      ctx.lineTo(fx, bottomY - r * 1.2);
      ctx.stroke();
    }
  }
}
