import { CELL, MAZE_COLS, MAZE_ROWS, MAZE_OFFSET_Y, COLORS, PACMAN_START, BASE_SPEED, DIR } from "../constants.js";
import { MAZE_DATA } from "../maze.js";

const MOUTH_FRAMES = [0, 30, 70]; // degrees
const MOUTH_FRAME_DURATION = 1 / 8; // 125ms per frame (8fps)
const COLLISION_RADIUS = 0.4; // fraction of CELL
const TUNNEL_SPEED_FACTOR = 0.6;
const TUNNEL_ROW = 14;

function isPassable(row, col) {
  if (row < 0 || row >= MAZE_ROWS) return false;
  if (col < 0 || col >= MAZE_COLS) return true; // tunnel exits are passable
  const t = MAZE_DATA[row][col];
  return t === 0 || t === 2 || t === 3 || t === 6;
}

function tileCenter(col, row) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

export class Pacman {
  constructor() {
    const start = tileCenter(PACMAN_START.col, PACMAN_START.row);
    this.x = start.x;
    this.y = start.y;
    this.dir = DIR.NONE;
    this.nextDir = DIR.NONE;
    this.speed = BASE_SPEED;
    this.mouthAngle = 30;
    this.mouthDir = 1;
    this.animTimer = 0;
    this.animFrame = 1; // start at frame 1 (30°)
  }

  setDirection(dir) {
    this.nextDir = dir;
  }

  getTile() {
    return {
      col: Math.floor(this.x / CELL),
      row: Math.floor(this.y / CELL),
    };
  }

  update(dt) {
    // Update speed based on tunnel
    const tile = this.getTile();
    this.speed = tile.row === TUNNEL_ROW && (tile.col <= 5 || tile.col >= 22)
      ? BASE_SPEED * TUNNEL_SPEED_FACTOR
      : BASE_SPEED;

    // Try to turn
    if (this.nextDir !== DIR.NONE) {
      const centerX = Math.round(this.x / CELL - 0.5) * CELL + CELL / 2;
      const centerY = Math.round(this.y / CELL - 0.5) * CELL + CELL / 2;
      const nextCol = Math.floor(centerX / CELL) + this.nextDir.x;
      const nextRow = Math.floor(centerY / CELL) + this.nextDir.y;
      if (isPassable(nextRow, nextCol)) {
        // Snap to center of current tile on the axis perpendicular to new direction
        if (this.nextDir.x !== 0) {
          this.y = centerY;
        } else {
          this.x = centerX;
        }
        this.dir = this.nextDir;
        this.nextDir = DIR.NONE;
      }
    }

    // Move
    if (this.dir !== DIR.NONE) {
      this.x += this.dir.x * this.speed * dt;
      this.y += this.dir.y * this.speed * dt;

      // Wall collision — check leading edge
      const radius = COLLISION_RADIUS * CELL;
      const leadX = this.x + this.dir.x * radius;
      const leadY = this.y + this.dir.y * radius;
      const leadCol = Math.floor(leadX / CELL);
      const leadRow = Math.floor(leadY / CELL);

      if (!isPassable(leadRow, leadCol)) {
        // Snap back to tile center
        const snapCol = Math.floor(this.x / CELL);
        const snapRow = Math.floor(this.y / CELL);
        const snap = tileCenter(snapCol, snapRow);
        this.x = snap.x;
        this.y = snap.y;
        this.dir = DIR.NONE;
      }
    }

    // Tunnel wrap
    if (this.x < 0) {
      this.x = MAZE_COLS * CELL;
    } else if (this.x > MAZE_COLS * CELL) {
      this.x = 0;
    }

    // Mouth animation
    if (this.dir !== DIR.NONE) {
      this.animTimer += dt;
      if (this.animTimer >= MOUTH_FRAME_DURATION) {
        this.animTimer -= MOUTH_FRAME_DURATION;
        this.animFrame += this.mouthDir;
        if (this.animFrame >= MOUTH_FRAMES.length - 1) {
          this.animFrame = MOUTH_FRAMES.length - 1;
          this.mouthDir = -1;
        } else if (this.animFrame <= 0) {
          this.animFrame = 0;
          this.mouthDir = 1;
        }
        this.mouthAngle = MOUTH_FRAMES[this.animFrame];
      }
    } else {
      this.mouthAngle = 30;
      this.animFrame = 1;
      this.mouthDir = 1;
      this.animTimer = 0;
    }
  }

  draw(ctx) {
    const radius = CELL * 0.45;
    const halfMouth = (this.mouthAngle * Math.PI) / 180;

    // Determine rotation based on direction
    let rotation = 0;
    if (this.dir === DIR.DOWN) rotation = Math.PI / 2;
    else if (this.dir === DIR.LEFT) rotation = Math.PI;
    else if (this.dir === DIR.UP) rotation = (3 * Math.PI) / 2;

    const cx = this.x;
    const cy = this.y + MAZE_OFFSET_Y;

    ctx.fillStyle = COLORS.PACMAN;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, rotation + halfMouth, rotation + 2 * Math.PI - halfMouth);
    ctx.lineTo(cx + Math.cos(rotation) * (halfMouth > 0 ? 0 : radius), cy + Math.sin(rotation) * (halfMouth > 0 ? 0 : radius));
    ctx.lineTo(cx, cy);
    ctx.fill();
  }
}
