import { describe, it, expect, beforeEach } from 'vitest';
import { GhostManager } from './ghostManager.js';
import { gameState } from './gameState.js';
import { DIR, CELL } from '../constants.js';

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
