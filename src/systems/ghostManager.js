import { CELL, COLORS, DIR, MODE_TIMING, GHOST_MODE, FRIGHTENED_DURATION, MAZE_OFFSET_Y, SCORE, GHOST_HOUSE } from '../constants.js';
import { Ghost } from '../entities/ghost.js';
import { gameState } from './gameState.js';

export class GhostManager {
  constructor() {
    const blinky = new Ghost('blinky', COLORS.BLINKY, { col: 25, row: 0 }, 14, 11, DIR.LEFT, false);
    const pinky = new Ghost('pinky', COLORS.PINKY, { col: 2, row: 0 }, 14, 14, DIR.DOWN, true);
    const inky = new Ghost('inky', COLORS.INKY, { col: 27, row: 30 }, 12, 14, DIR.UP, true);
    const clyde = new Ghost('clyde', COLORS.CLYDE, { col: 0, row: 30 }, 16, 14, DIR.UP, true);

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
    // Reset Blinky - starts outside house
    const blinky = this.ghosts[0];
    blinky.x = 14 * CELL + CELL / 2;
    blinky.y = 11 * CELL + CELL / 2;
    blinky.dir = DIR.LEFT;
    blinky.inHouse = false;
    blinky.exitingHouse = false;
    blinky.mode = this.globalMode;
    blinky.eaten = false;

    // Reset Pinky
    const pinky = this.ghosts[1];
    pinky.x = 14 * CELL + CELL / 2;
    pinky.y = 14 * CELL + CELL / 2;
    pinky.dir = DIR.DOWN;
    pinky.inHouse = true;
    pinky.exitingHouse = false;
    pinky.mode = this.globalMode;
    pinky.eaten = false;

    // Reset Inky
    const inky = this.ghosts[2];
    inky.x = 12 * CELL + CELL / 2;
    inky.y = 14 * CELL + CELL / 2;
    inky.dir = DIR.UP;
    inky.inHouse = true;
    inky.exitingHouse = false;
    inky.mode = this.globalMode;
    inky.eaten = false;

    // Reset Clyde
    const clyde = this.ghosts[3];
    clyde.x = 16 * CELL + CELL / 2;
    clyde.y = 14 * CELL + CELL / 2;
    clyde.dir = DIR.UP;
    clyde.inHouse = true;
    clyde.exitingHouse = false;
    clyde.mode = this.globalMode;
    clyde.eaten = false;

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
