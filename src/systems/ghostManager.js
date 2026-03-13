import { CELL, COLORS, DIR, MODE_TIMING, GHOST_MODE, FRIGHTENED_DURATION, MAZE_OFFSET_Y, SCORE, GHOST_HOUSE } from '../constants.js';
import { Ghost } from '../entities/ghost.js';
import { gameState } from './gameState.js';
import { soundManager } from './soundManager.js';

// Ghost spawn configurations — single source of truth for constructor and resetPositions
const GHOST_CONFIGS = [
  { name: 'blinky', color: COLORS.BLINKY, scatter: { col: 25, row: 0 }, startCol: 14, startRow: 11, startDir: DIR.LEFT, inHouse: false },
  { name: 'pinky',  color: COLORS.PINKY,  scatter: { col: 2, row: 0 },  startCol: 14, startRow: 14, startDir: DIR.DOWN, inHouse: true },
  { name: 'inky',   color: COLORS.INKY,   scatter: { col: 27, row: 30 }, startCol: 12, startRow: 14, startDir: DIR.UP,   inHouse: true },
  { name: 'clyde',  color: COLORS.CLYDE,  scatter: { col: 0, row: 30 },  startCol: 16, startRow: 14, startDir: DIR.UP,   inHouse: true },
];

export class GhostManager {
  constructor() {
    const [blinkyConf, pinkyConf, inkyConf, clydeConf] = GHOST_CONFIGS;
    const blinky = new Ghost(blinkyConf.name, blinkyConf.color, blinkyConf.scatter, blinkyConf.startCol, blinkyConf.startRow, blinkyConf.startDir, blinkyConf.inHouse);
    const pinky = new Ghost(pinkyConf.name, pinkyConf.color, pinkyConf.scatter, pinkyConf.startCol, pinkyConf.startRow, pinkyConf.startDir, pinkyConf.inHouse);
    const inky = new Ghost(inkyConf.name, inkyConf.color, inkyConf.scatter, inkyConf.startCol, inkyConf.startRow, inkyConf.startDir, inkyConf.inHouse);
    const clyde = new Ghost(clydeConf.name, clydeConf.color, clydeConf.scatter, clydeConf.startCol, clydeConf.startRow, clydeConf.startDir, clydeConf.inHouse);

    pinky.dotThreshold = 0;
    inky.dotThreshold = 30;
    clyde.dotThreshold = 60;

    // Chase target functions
    blinky.chaseTargetFn = (pac) => pac.getTile();

    pinky.chaseTargetFn = (pac) => ({
      col: pac.getTile().col + pac.dir.x * 4,
      row: pac.getTile().row + pac.dir.y * 4,
    });

    inky.chaseTargetFn = (pac, blinkyRef) => {
      const ahead = {
        col: pac.getTile().col + pac.dir.x * 2,
        row: pac.getTile().row + pac.dir.y * 2,
      };
      const bt = blinkyRef.getTile();
      return {
        col: ahead.col + (ahead.col - bt.col),
        row: ahead.row + (ahead.row - bt.row),
      };
    };

    clyde.chaseTargetFn = (pac) => {
      const pt = pac.getTile();
      const ct = clyde.getTile();
      const d = Math.sqrt((pt.col - ct.col) ** 2 + (pt.row - ct.row) ** 2);
      return d > 8 ? pt : { col: 0, row: 30 };
    };

    this.ghosts = [blinky, pinky, inky, clyde];
    this.blinky = blinky;
    this.modeIndex = 0;
    this.modeTimer = 0;
    this.globalMode = 'scatter';
    this.frightenedActive = false;
    this.frightenedTimer = 0;
    this.scorePopups = [];
  }

  resetPositions() {
    for (let i = 0; i < this.ghosts.length; i++) {
      const ghost = this.ghosts[i];
      const conf = GHOST_CONFIGS[i];
      ghost.x = conf.startCol * CELL + CELL / 2;
      ghost.y = conf.startRow * CELL + CELL / 2;
      ghost.dir = conf.startDir;
      ghost.inHouse = conf.inHouse;
      ghost.exitingHouse = false;
      ghost.mode = this.globalMode;
      ghost.eaten = false;
    }

    // Reset frightened state
    this.frightenedActive = false;
    this.frightenedTimer = 0;
    this.scorePopups = [];
  }

  triggerFrightened() {
    this.frightenedActive = true;
    this.frightenedTimer = 0;
    gameState.powerPelletActive = true;
    gameState.ghostEatCombo = 0;
    soundManager.stopSiren();
    soundManager.startFrightened();
    for (const ghost of this.ghosts) {
      ghost.enterFrightened();
    }
  }

  checkGhostCollision(pacman) {
    const pacTile = pacman.getTile();
    for (const ghost of this.ghosts) {
      if (ghost.mode === GHOST_MODE.FRIGHTENED) {
        const gt = ghost.getTile();
        if (gt.col === pacTile.col && gt.row === pacTile.row) {
          gameState.ghostEatCombo++;
          const points = SCORE.GHOST_BASE * (2 ** (gameState.ghostEatCombo - 1));
          gameState.addScore(points);
          ghost.mode = GHOST_MODE.EATEN;
          ghost.eaten = true;
          soundManager.playEatGhost();
          this.scorePopups.push({
            x: ghost.x,
            y: ghost.y + MAZE_OFFSET_Y,
            text: String(points),
            timer: 1.0,
          });
        }
      }
    }
  }

  update(dt, pacman) {
    // Update frightened timer
    if (this.frightenedActive) {
      this.frightenedTimer += dt * 1000;
      if (this.frightenedTimer >= FRIGHTENED_DURATION) {
        this.frightenedActive = false;
        gameState.powerPelletActive = false;
        soundManager.stopFrightened();
        soundManager.startSiren();
        for (const ghost of this.ghosts) {
          if (ghost.mode === GHOST_MODE.FRIGHTENED) {
            ghost.mode = this.globalMode;
          }
        }
      }
    }

    // Update score popups
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      this.scorePopups[i].timer -= dt;
      if (this.scorePopups[i].timer <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }

    // Check ghost collision
    this.checkGhostCollision(pacman);

    // Mode timing (scatter/chase switching)
    this.modeTimer += dt * 1000;

    const timing = MODE_TIMING[this.modeIndex];
    if (timing && this.modeTimer >= timing.duration && timing.duration !== Infinity) {
      this.modeIndex++;
      this.modeTimer = 0;
      if (this.modeIndex < MODE_TIMING.length) {
        this.globalMode = MODE_TIMING[this.modeIndex].mode;
      }
      // Reverse direction on ghosts not in house, not frightened, not eaten
      for (const ghost of this.ghosts) {
        if (!ghost.inHouse && !ghost.exitingHouse &&
            ghost.mode !== GHOST_MODE.FRIGHTENED && ghost.mode !== GHOST_MODE.EATEN) {
          ghost.reverseDirection();
        }
      }
    }

    // Ghost house release
    const dotsEaten = 244 - gameState.dotsRemaining;
    for (const ghost of this.ghosts) {
      if (ghost.inHouse && dotsEaten >= ghost.dotThreshold) {
        ghost.exitingHouse = true;
      }
    }

    // Set mode and update
    for (const ghost of this.ghosts) {
      if (!ghost.inHouse && !ghost.exitingHouse &&
          ghost.mode !== GHOST_MODE.FRIGHTENED && ghost.mode !== GHOST_MODE.EATEN) {
        ghost.mode = this.globalMode;
      }
      ghost.updateFrightenedTimer(dt);
      ghost.update(dt, pacman, this.blinky);
    }
  }

  draw(ctx) {
    for (const ghost of this.ghosts) {
      ghost.draw(ctx);
    }

    // Draw score popups
    for (const popup of this.scorePopups) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${CELL * 0.6}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(popup.text, popup.x, popup.y);
    }
  }
}
