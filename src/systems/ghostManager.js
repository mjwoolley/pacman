import { COLORS, DIR, MODE_TIMING } from '../constants.js';
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
  }

  update(dt, pacman) {
    this.modeTimer += dt * 1000;

    const timing = MODE_TIMING[this.modeIndex];
    if (timing && this.modeTimer >= timing.duration && timing.duration !== Infinity) {
      this.modeIndex++;
      this.modeTimer = 0;
      if (this.modeIndex < MODE_TIMING.length) {
        this.globalMode = MODE_TIMING[this.modeIndex].mode;
      }
      // Reverse direction on all ghosts not in house
      for (const ghost of this.ghosts) {
        if (!ghost.inHouse && !ghost.exitingHouse) {
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
      if (!ghost.inHouse && !ghost.exitingHouse) {
        ghost.mode = this.globalMode;
      }
      ghost.update(dt, pacman, this.blinky);
    }
  }

  draw(ctx) {
    for (const ghost of this.ghosts) {
      ghost.draw(ctx);
    }
  }
}
