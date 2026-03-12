import { CELL, MAZE_COLS, MAZE_ROWS, MAZE_OFFSET_Y, COLORS } from "../constants.js";
import { MAZE_DATA } from "../maze.js";

/**
 * Returns true if the tile at (row, col) is a wall (type 1).
 * Out-of-bounds cells on left/right are treated as non-wall (for tunnel openings).
 * Out-of-bounds cells on top/bottom are treated as wall (border continuity).
 */
export function isWall(row, col) {
  if (row < 0 || row >= MAZE_ROWS) return true;
  if (col < 0 || col >= MAZE_COLS) return false;
  return MAZE_DATA[row][col] === 1;
}

export class MazeRenderer {
  constructor() {
    this.dots = new Set();
    this._initDots();
    // Pre-render walls to an offscreen canvas for performance
    this._wallCanvas = null;
  }

  _initDots() {
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        const t = MAZE_DATA[row][col];
        if (t === 2 || t === 3) this.dots.add(`${row},${col}`);
      }
    }
  }

  eatDot(row, col) {
    this.dots.delete(`${row},${col}`);
  }

  _renderWalls() {
    const width = MAZE_COLS * CELL;
    const height = MAZE_ROWS * CELL + MAZE_OFFSET_Y;
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height + CELL;
    const ctx = offscreen.getContext("2d");

    const LINE_WIDTH = 3;
    const HALF = CELL / 2;
    const INSET = 3; // pixels inset from cell edge
    const R = 5; // corner rounding radius

    ctx.strokeStyle = COLORS.WALL;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (!isWall(row, col)) continue;

        const x = col * CELL;
        const y = row * CELL + MAZE_OFFSET_Y;

        const top = isWall(row - 1, col);
        const bottom = isWall(row + 1, col);
        const left = isWall(row, col - 1);
        const right = isWall(row, col + 1);
        const topLeft = isWall(row - 1, col - 1);
        const topRight = isWall(row - 1, col + 1);
        const bottomLeft = isWall(row + 1, col - 1);
        const bottomRight = isWall(row + 1, col + 1);

        // Draw outline segments on sides adjacent to non-wall cells
        // For each open side, draw a line inset from that edge

        // Top side open
        if (!top) {
          const x1 = left ? x : x + INSET;
          const x2 = right ? x + CELL : x + CELL - INSET;
          ctx.beginPath();
          ctx.moveTo(x1, y + INSET);
          ctx.lineTo(x2, y + INSET);
          ctx.stroke();
        }

        // Bottom side open
        if (!bottom) {
          const x1 = left ? x : x + INSET;
          const x2 = right ? x + CELL : x + CELL - INSET;
          ctx.beginPath();
          ctx.moveTo(x1, y + CELL - INSET);
          ctx.lineTo(x2, y + CELL - INSET);
          ctx.stroke();
        }

        // Left side open
        if (!left) {
          const y1 = top ? y : y + INSET;
          const y2 = bottom ? y + CELL : y + CELL - INSET;
          ctx.beginPath();
          ctx.moveTo(x + INSET, y1);
          ctx.lineTo(x + INSET, y2);
          ctx.stroke();
        }

        // Right side open
        if (!right) {
          const y1 = top ? y : y + INSET;
          const y2 = bottom ? y + CELL : y + CELL - INSET;
          ctx.beginPath();
          ctx.moveTo(x + CELL - INSET, y1);
          ctx.lineTo(x + CELL - INSET, y2);
          ctx.stroke();
        }

        // Inner corners: when this wall has two adjacent walls forming an L,
        // but the diagonal is NOT a wall, draw an arc in the inner corner
        if (top && right && !topRight) {
          ctx.beginPath();
          ctx.arc(x + CELL - INSET, y + INSET, R, Math.PI, 1.5 * Math.PI);
          ctx.stroke();
        }
        if (top && left && !topLeft) {
          ctx.beginPath();
          ctx.arc(x + INSET, y + INSET, R, 1.5 * Math.PI, 2 * Math.PI);
          ctx.stroke();
        }
        if (bottom && right && !bottomRight) {
          ctx.beginPath();
          ctx.arc(x + CELL - INSET, y + CELL - INSET, R, 0.5 * Math.PI, Math.PI);
          ctx.stroke();
        }
        if (bottom && left && !bottomLeft) {
          ctx.beginPath();
          ctx.arc(x + INSET, y + CELL - INSET, R, 0, 0.5 * Math.PI);
          ctx.stroke();
        }

        // Outer corners: when exactly two adjacent sides are open, draw rounded corner
        if (!top && !right && left && bottom) {
          // Open top-right corner
          ctx.beginPath();
          ctx.arc(x + CELL - INSET, y + INSET, R, -0.5 * Math.PI, 0);
          ctx.stroke();
        }
        if (!top && !left && right && bottom) {
          // Open top-left corner
          ctx.beginPath();
          ctx.arc(x + INSET, y + INSET, R, Math.PI, 1.5 * Math.PI);
          ctx.stroke();
        }
        if (!bottom && !right && left && top) {
          // Open bottom-right corner
          ctx.beginPath();
          ctx.arc(x + CELL - INSET, y + CELL - INSET, R, 0, 0.5 * Math.PI);
          ctx.stroke();
        }
        if (!bottom && !left && right && top) {
          // Open bottom-left corner
          ctx.beginPath();
          ctx.arc(x + INSET, y + CELL - INSET, R, 0.5 * Math.PI, Math.PI);
          ctx.stroke();
        }

        // Endcap: isolated end of a wall stub (only one neighbor is wall)
        if (!top && !left && !right && bottom) {
          // Cap on top
          ctx.beginPath();
          ctx.arc(x + HALF, y + INSET, HALF - INSET, Math.PI, 0);
          ctx.stroke();
        }
        if (top && !left && !right && !bottom) {
          // Cap on bottom
          ctx.beginPath();
          ctx.arc(x + HALF, y + CELL - INSET, HALF - INSET, 0, Math.PI);
          ctx.stroke();
        }
        if (!top && !left && right && !bottom) {
          // Cap on left
          ctx.beginPath();
          ctx.arc(x + INSET, y + HALF, HALF - INSET, 0.5 * Math.PI, 1.5 * Math.PI);
          ctx.stroke();
        }
        if (!top && left && !right && !bottom) {
          // Cap on right
          ctx.beginPath();
          ctx.arc(x + CELL - INSET, y + HALF, HALF - INSET, 1.5 * Math.PI, 0.5 * Math.PI);
          ctx.stroke();
        }

        // Fully isolated wall (no neighbors)
        if (!top && !bottom && !left && !right) {
          ctx.beginPath();
          ctx.arc(x + HALF, y + HALF, HALF - INSET, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    }

    this._wallCanvas = offscreen;
  }

  draw(ctx, timestamp) {
    // Render walls (cached)
    if (!this._wallCanvas) {
      this._renderWalls();
    }
    ctx.drawImage(this._wallCanvas, 0, 0);

    // Render dots and power pellets
    for (const key of this.dots) {
      const [row, col] = key.split(",").map(Number);
      const tile = MAZE_DATA[row][col];
      const x = col * CELL + CELL / 2;
      const y = row * CELL + MAZE_OFFSET_Y + CELL / 2;

      if (tile === 2) {
        // Small dot
        ctx.fillStyle = COLORS.DOT;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === 3) {
        // Power pellet — blink at ~500ms interval
        const visible = Math.floor(timestamp / 250) % 2 === 0;
        if (visible) {
          ctx.fillStyle = COLORS.POWER_PELLET;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Ghost house gate
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (MAZE_DATA[row][col] === 5) {
          const gx = col * CELL;
          const gy = row * CELL + MAZE_OFFSET_Y;
          ctx.fillStyle = "#FFB8FF";
          ctx.fillRect(gx, gy + CELL * 0.4, CELL, CELL * 0.2);
        }
      }
    }
  }
}
