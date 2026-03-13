import { CELL, MAZE_COLS, MAZE_ROWS, MAZE_OFFSET_Y, BASE_SPEED, GHOST_SPEED_FACTOR, DIR, GHOST_MODE, FRIGHTENED_DURATION, FRIGHTENED_FLASH_START, COLORS } from '../constants.js';
import { MAZE_DATA } from '../maze.js';

export function isGhostPassable(row, col) {
  if (row < 0 || row >= MAZE_ROWS) return false;
  if (col < 0 || col >= MAZE_COLS) return true; // tunnel
  const t = MAZE_DATA[row][col];
  return t !== 1; // everything except walls
}

export function getAvailableDirections(row, col, currentDir) {
  const reverse = { x: -currentDir.x, y: -currentDir.y };
  const dirs = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
  return dirs.filter(d => {
    if (d.x === reverse.x && d.y === reverse.y) return false;
    return isGhostPassable(row + d.y, col + d.x);
  });
}

const NO_UP_ZONES = [
  { row: 11, col: 12 },
  { row: 11, col: 15 },
  { row: 23, col: 12 },
  { row: 23, col: 15 },
];

export class Ghost {
  constructor(name, color, scatterTarget, startCol, startRow, startDir, inHouse) {
    this.name = name;
    this.color = color;
    this.scatterTarget = scatterTarget;
    this.x = startCol * CELL + CELL / 2;
    this.y = startRow * CELL + CELL / 2;
    this.dir = startDir;
    this.mode = 'scatter';
    this.inHouse = inHouse;
    this.exitingHouse = false;
    this.speed = BASE_SPEED * GHOST_SPEED_FACTOR;
    this.targetTile = scatterTarget;
    this.chaseTargetFn = null;
    this.dotThreshold = 0;
    this.animTimer = 0;
    this.prevTile = null;
    this._bobDir = 1;
    this.frightenedTimer = 0;
    this.eaten = false;
    this.homeTarget = { col: 14, row: 14 };
  }

  getTile() {
    return {
      col: Math.floor(this.x / CELL),
      row: Math.floor(this.y / CELL),
    };
  }

  reverseDirection() {
    this.dir = { x: -this.dir.x, y: -this.dir.y };
  }

  enterFrightened() {
    if (this.eaten || this.mode === GHOST_MODE.EATEN) return;
    if (this.inHouse) return;
    this.mode = GHOST_MODE.FRIGHTENED;
    this.frightenedTimer = 0;
    this.reverseDirection();
  }

  updateFrightenedTimer(dt) {
    if (this.mode !== GHOST_MODE.FRIGHTENED) return;
    this.frightenedTimer += dt * 1000;
  }

  update(dt, pacman, blinky) {
    this.animTimer += dt;

    if (this.inHouse && !this.exitingHouse) {
      // Bob up/down between row 13.5 and row 15
      const minY = 13.5 * CELL + CELL / 2;
      const maxY = 15 * CELL + CELL / 2;
      const halfSpeed = BASE_SPEED * GHOST_SPEED_FACTOR * 0.5;
      this.y += this._bobDir * halfSpeed * dt;
      if (this.y <= minY) { this.y = minY; this._bobDir = 1; }
      if (this.y >= maxY) { this.y = maxY; this._bobDir = -1; }
      return;
    }

    if (this.exitingHouse) {
      const gateX = 13.5 * CELL + CELL / 2;
      const gateY = 12 * CELL + CELL / 2;
      const exitY = 11 * CELL + CELL / 2;
      const moveSpeed = BASE_SPEED * GHOST_SPEED_FACTOR * 0.5;

      // Move horizontally to gate center
      if (Math.abs(this.x - gateX) > 1) {
        this.x += (gateX > this.x ? 1 : -1) * moveSpeed * dt;
        return;
      }
      this.x = gateX;

      // Move up through gate
      if (this.y > gateY) {
        this.y -= moveSpeed * dt;
        return;
      }

      // Move up to row 11
      if (this.y > exitY) {
        this.y -= moveSpeed * dt;
        return;
      }

      this.y = exitY;
      this.inHouse = false;
      this.exitingHouse = false;
      this.dir = DIR.LEFT;
      return;
    }

    // Eaten mode: rush back to ghost house
    if (this.mode === GHOST_MODE.EATEN) {
      const tile = this.getTile();
      // Reached the gate area — reset into house
      if (tile.row >= 11 && tile.row <= 12 && (tile.col === 13 || tile.col === 14)) {
        this.eaten = false;
        this.mode = GHOST_MODE.SCATTER; // reset mode so ghost regenerates as normal on exit
        this.x = 14 * CELL + CELL / 2;
        this.y = 14 * CELL + CELL / 2;
        this.exitingHouse = true;
        this.inHouse = false;
        return;
      }

      this.speed = BASE_SPEED * GHOST_SPEED_FACTOR * 2;
      this.x += this.dir.x * this.speed * dt;
      this.y += this.dir.y * this.speed * dt;

      // Tunnel wrap
      if (this.x < 0) {
        this.x = MAZE_COLS * CELL;
      } else if (this.x > MAZE_COLS * CELL) {
        this.x = 0;
      }

      const currentTile = this.getTile();
      if (this.prevTile === null ||
          currentTile.col !== this.prevTile.col ||
          currentTile.row !== this.prevTile.row) {
        this.x = currentTile.col * CELL + CELL / 2;
        this.y = currentTile.row * CELL + CELL / 2;
        this.pickDirection(currentTile.row, currentTile.col, pacman, blinky);
      }
      this.prevTile = { col: currentTile.col, row: currentTile.row };
      return;
    }

    // Normal movement
    const tile = this.getTile();

    // Speed adjustments
    if (tile.row === 14 && (tile.col <= 5 || tile.col >= 22)) {
      this.speed = BASE_SPEED * GHOST_SPEED_FACTOR * 0.5; // tunnel
    } else if (this.mode === GHOST_MODE.FRIGHTENED) {
      this.speed = BASE_SPEED * GHOST_SPEED_FACTOR * 0.5;
    } else {
      this.speed = BASE_SPEED * GHOST_SPEED_FACTOR;
    }

    // Move
    this.x += this.dir.x * this.speed * dt;
    this.y += this.dir.y * this.speed * dt;

    // Tunnel wrap
    if (this.x < 0) {
      this.x = MAZE_COLS * CELL;
    } else if (this.x > MAZE_COLS * CELL) {
      this.x = 0;
    }

    // Tile center detection
    const currentTile = this.getTile();
    if (this.prevTile === null ||
        currentTile.col !== this.prevTile.col ||
        currentTile.row !== this.prevTile.row) {
      // Snap to tile center
      this.x = currentTile.col * CELL + CELL / 2;
      this.y = currentTile.row * CELL + CELL / 2;
      this.pickDirection(currentTile.row, currentTile.col, pacman, blinky);
    }
    this.prevTile = { col: currentTile.col, row: currentTile.row };
  }

  pickDirection(row, col, pacman, blinky) {
    let available = getAvailableDirections(row, col, this.dir);
    if (available.length === 0) return;

    // Frightened mode: random direction
    if (this.mode === GHOST_MODE.FRIGHTENED) {
      this.dir = available[Math.floor(Math.random() * available.length)];
      return;
    }

    // Eaten mode: target above gate
    if (this.mode === GHOST_MODE.EATEN) {
      const target = { col: 14, row: 11 };
      let bestDir = available[0];
      let bestDist = Infinity;
      for (const d of available) {
        const nc = col + d.x;
        const nr = row + d.y;
        const dist = Math.sqrt((nc - target.col) ** 2 + (nr - target.row) ** 2);
        if (dist < bestDist) {
          bestDist = dist;
          bestDir = d;
        }
      }
      this.dir = bestDir;
      return;
    }

    // No-up zones
    if (this.mode === 'scatter' || this.mode === 'chase') {
      const isNoUp = NO_UP_ZONES.some(z => z.row === row && z.col === col);
      if (isNoUp) {
        const filtered = available.filter(d => !(d.x === DIR.UP.x && d.y === DIR.UP.y));
        if (filtered.length > 0) available = filtered;
      }
    }

    // Determine target
    let target;
    if (this.mode === 'scatter') {
      target = this.scatterTarget;
    } else if (this.mode === 'chase' && this.chaseTargetFn) {
      target = this.chaseTargetFn(pacman, blinky);
    } else {
      target = this.scatterTarget;
    }

    // Pick direction minimizing Euclidean distance to target
    let bestDir = available[0];
    let bestDist = Infinity;
    for (const d of available) {
      const nc = col + d.x;
      const nr = row + d.y;
      const dist = Math.sqrt((nc - target.col) ** 2 + (nr - target.row) ** 2);
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = d;
      }
    }
    this.dir = bestDir;
  }

  draw(ctx) {
    const r = CELL * 0.45;
    const cx = this.x;
    const cy = this.y + MAZE_OFFSET_Y;

    ctx.save();
    ctx.translate(cx, cy);

    // Eaten: draw only eyes
    if (this.mode === GHOST_MODE.EATEN) {
      this._drawEyes(ctx, r);
      ctx.restore();
      return;
    }

    // Frightened: blue/white body with spooked face
    if (this.mode === GHOST_MODE.FRIGHTENED) {
      // Body color: blue, or flash blue/white
      if (this.frightenedTimer >= FRIGHTENED_FLASH_START) {
        const flashIndex = Math.floor(this.frightenedTimer / 200) % 2;
        ctx.fillStyle = flashIndex === 0 ? COLORS.FRIGHTENED : COLORS.FRIGHTENED_FLASH;
      } else {
        ctx.fillStyle = COLORS.FRIGHTENED;
      }

      this._drawBody(ctx, r);

      // Spooked face: small dot eyes
      const eyeOffsetX = r * 0.3;
      ctx.fillStyle = '#FFFFFF';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(side * eyeOffsetX, -r * 0.15, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wavy mouth
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const mouthY = r * 0.25;
      const segments = 4;
      const mouthWidth = r * 1.2;
      const startX = -mouthWidth / 2;
      ctx.moveTo(startX, mouthY);
      for (let i = 0; i <= segments; i++) {
        const mx = startX + (i / segments) * mouthWidth;
        const my = mouthY + (i % 2 === 0 ? 0 : -r * 0.15);
        ctx.lineTo(mx, my);
      }
      ctx.stroke();

      ctx.restore();
      return;
    }

    // Normal ghost drawing
    ctx.fillStyle = this.color;
    this._drawBody(ctx, r);
    this._drawEyes(ctx, r);

    ctx.restore();
  }

  _drawBody(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI, 0, false);

    const phase = this.animTimer * 5;
    const bumps = 3;
    const bumpWidth = (2 * r) / bumps;
    ctx.lineTo(r, r * 0.6);
    for (let i = bumps - 1; i >= 0; i--) {
      const bx = -r + (i + 0.5) * bumpWidth;
      const by = r * 0.6 + Math.sin(phase + i) * r * 0.2;
      ctx.lineTo(bx + bumpWidth / 2, by);
      ctx.lineTo(bx, r * 0.6);
    }
    ctx.closePath();
    ctx.fill();
  }

  _drawEyes(ctx, r) {
    const eyeOffsetX = r * 0.3;
    const eyeW = r * 0.25;
    const eyeH = r * 0.35;
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(side * eyeOffsetX, -r * 0.15, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#0000FF';
      const pupilOX = this.dir.x * eyeW * 0.35;
      const pupilOY = this.dir.y * eyeH * 0.35;
      ctx.beginPath();
      ctx.arc(side * eyeOffsetX + pupilOX, -r * 0.15 + pupilOY, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
