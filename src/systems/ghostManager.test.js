import { describe, it, expect, beforeEach } from 'vitest';
import { GhostManager } from './ghostManager.js';
import { gameState } from './gameState.js';
import { DIR, CELL, GHOST_MODE, FRIGHTENED_DURATION, SCORE } from '../constants.js';

function mockPacman(col = 14, row = 23, dir = DIR.LEFT) {
  return {
    getTile: () => ({ col, row }),
    dir,
    x: col * CELL + CELL / 2,
    y: row * CELL + CELL / 2,
  };
}

describe('GhostManager', () => {
  let gm;

  beforeEach(() => {
    gameState.reset();
    gm = new GhostManager();
  });

  it('creates 4 ghosts', () => {
    expect(gm.ghosts.length).toBe(4);
    expect(gm.ghosts.map(g => g.name)).toEqual(['blinky', 'pinky', 'inky', 'clyde']);
  });

  it('initial mode is scatter', () => {
    expect(gm.globalMode).toBe('scatter');
  });

  it('after 7s timer, mode switches to chase', () => {
    const pac = mockPacman();
    // Advance 7.1 seconds
    gm.update(7.1, pac);
    expect(gm.globalMode).toBe('chase');
  });

  it('Pinky exits immediately (dotThreshold 0)', () => {
    const pac = mockPacman();
    const pinky = gm.ghosts[1];
    expect(pinky.inHouse).toBe(true);
    // dotsEaten = 244 - 244 = 0 >= 0
    gm.update(0.016, pac);
    expect(pinky.exitingHouse).toBe(true);
  });

  it('Inky exits at 30 dots eaten', () => {
    const pac = mockPacman();
    const inky = gm.ghosts[2];
    // 244 - 214 = 30
    gameState.dotsRemaining = 214;
    gm.update(0.016, pac);
    expect(inky.exitingHouse).toBe(true);
  });

  it('Clyde exits at 60 dots eaten', () => {
    const pac = mockPacman();
    const clyde = gm.ghosts[3];
    // 244 - 184 = 60
    gameState.dotsRemaining = 184;
    gm.update(0.016, pac);
    expect(clyde.exitingHouse).toBe(true);
  });
});

describe('Frightened mode', () => {
  let gm;

  beforeEach(() => {
    gameState.reset();
    gm = new GhostManager();
  });

  it('triggerFrightened() sets all non-house ghosts to frightened mode', () => {
    gm.triggerFrightened();
    // Blinky is not in house, should be frightened
    expect(gm.ghosts[0].mode).toBe(GHOST_MODE.FRIGHTENED);
    // Pinky, Inky, Clyde are in house, should NOT be frightened
    expect(gm.ghosts[1].mode).not.toBe(GHOST_MODE.FRIGHTENED);
    expect(gm.ghosts[2].mode).not.toBe(GHOST_MODE.FRIGHTENED);
    expect(gm.ghosts[3].mode).not.toBe(GHOST_MODE.FRIGHTENED);
  });

  it('triggerFrightened() resets ghostEatCombo to 0', () => {
    gameState.ghostEatCombo = 3;
    gm.triggerFrightened();
    expect(gameState.ghostEatCombo).toBe(0);
  });

  it('eating frightened ghost adds 200 points and sets ghost to eaten', () => {
    const blinky = gm.ghosts[0];
    blinky.mode = GHOST_MODE.FRIGHTENED;
    // Place blinky on same tile as pacman
    const pac = mockPacman(14, 11);
    blinky.x = pac.x;
    blinky.y = pac.y;
    const scoreBefore = gameState.score;
    gm.checkGhostCollision(pac);
    expect(gameState.score - scoreBefore).toBe(SCORE.GHOST_BASE);
    expect(blinky.mode).toBe(GHOST_MODE.EATEN);
    expect(blinky.eaten).toBe(true);
  });

  it('consecutive ghost eats score 200, 400, 800, 1600', () => {
    gameState.ghostEatCombo = 0;
    const expectedScores = [200, 400, 800, 1600];
    let totalScore = 0;
    for (let i = 0; i < 4; i++) {
      const ghost = gm.ghosts[i];
      ghost.mode = GHOST_MODE.FRIGHTENED;
      ghost.inHouse = false;
      ghost.x = 14 * CELL + CELL / 2;
      ghost.y = 11 * CELL + CELL / 2;
      const pac = mockPacman(14, 11);
      const before = gameState.score;
      gm.checkGhostCollision(pac);
      expect(gameState.score - before).toBe(expectedScores[i]);
      totalScore += expectedScores[i];
    }
    expect(gameState.score).toBe(totalScore);
  });

  it('frightened mode expires after FRIGHTENED_DURATION', () => {
    const pac = mockPacman();
    gm.triggerFrightened();
    expect(gm.ghosts[0].mode).toBe(GHOST_MODE.FRIGHTENED);
    // Advance past FRIGHTENED_DURATION (6 seconds)
    gm.update(6.1, pac);
    expect(gm.frightenedActive).toBe(false);
    expect(gm.ghosts[0].mode).not.toBe(GHOST_MODE.FRIGHTENED);
  });

  it('new power pellet during frightened resets timer', () => {
    const pac = mockPacman();
    gm.triggerFrightened();
    // Advance 3 seconds
    gm.update(3.0, pac);
    expect(gm.frightenedActive).toBe(true);
    // Trigger again
    gm.triggerFrightened();
    expect(gm.frightenedTimer).toBe(0);
    expect(gm.frightenedActive).toBe(true);
    // Advance 3 more seconds — should still be active (reset timer)
    gm.update(3.0, pac);
    expect(gm.frightenedActive).toBe(true);
  });
});
