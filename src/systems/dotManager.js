import { CELL, MAZE_OFFSET_Y, COLORS, SCORE } from "../constants.js";
import { MAZE_DATA } from "../maze.js";
import { gameState } from "./gameState.js";
import { soundManager } from "./soundManager.js";

export class DotManager {
  constructor() {
    this.dots = new Set();
    this.onPowerPellet = null;
    this.onEatDot = null;
    this._buildDots();
    this.totalDots = this.dots.size;
  }

  _buildDots() {
    this.dots.clear();
    for (let row = 0; row < MAZE_DATA.length; row++) {
      for (let col = 0; col < MAZE_DATA[row].length; col++) {
        const tile = MAZE_DATA[row][col];
        if (tile === 2 || tile === 3) {
          this.dots.add(`${row},${col}`);
        }
      }
    }
  }

  checkCollection(pacman) {
    const { row, col } = pacman.getTile();
    const key = `${row},${col}`;
    if (!this.dots.has(key)) return;

    this.dots.delete(key);
    soundManager.playChomp();
    const tile = MAZE_DATA[row][col];
    gameState.addScore(tile === 3 ? SCORE.POWER_PELLET : SCORE.DOT);
    gameState.dotsRemaining--;
    this.onEatDot?.(row, col);

    if (tile === 3) {
      gameState.powerPelletActive = true;
      this.onPowerPellet?.();
    }

    if (gameState.dotsRemaining === 0) {
      gameState.won = true;
    }
  }

  draw(ctx, timestamp) {
    for (const key of this.dots) {
      const [row, col] = key.split(",").map(Number);
      const tile = MAZE_DATA[row][col];
      const x = col * CELL + CELL / 2;
      const y = row * CELL + MAZE_OFFSET_Y + CELL / 2;

      if (tile === 3) {
        if (Math.floor(timestamp / 200) % 2 === 0) {
          ctx.fillStyle = COLORS.POWER_PELLET;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = COLORS.DOT;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  reset() {
    this._buildDots();
    gameState.dotsRemaining = this.totalDots;
  }
}
