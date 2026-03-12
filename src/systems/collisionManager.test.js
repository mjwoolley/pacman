import { describe, it, expect } from 'vitest';
import { checkPacmanGhostCollision } from './collisionManager.js';
import { GHOST_MODE } from '../constants.js';

function mockPacman(col = 14, row = 23) {
  return { getTile: () => ({ col, row }) };
}

function mockGhost(col, row, mode, { inHouse = false, exitingHouse = false } = {}) {
  return {
    getTile: () => ({ col, row }),
    mode,
    inHouse,
    exitingHouse,
  };
}

describe('checkPacmanGhostCollision', () => {
  it('ghost in chase mode on same tile → died=true', () => {
    const pac = mockPacman(14, 23);
    const ghost = mockGhost(14, 23, GHOST_MODE.CHASE);
    const result = checkPacmanGhostCollision(pac, [ghost]);
    expect(result.died).toBe(true);
    expect(result.ghost).toBe(ghost);
  });

  it('ghost in scatter mode on same tile → died=true', () => {
    const pac = mockPacman(14, 23);
    const ghost = mockGhost(14, 23, GHOST_MODE.SCATTER);
    const result = checkPacmanGhostCollision(pac, [ghost]);
    expect(result.died).toBe(true);
  });

  it('ghost in frightened mode → died=false (handled elsewhere)', () => {
    const pac = mockPacman(14, 23);
    const ghost = mockGhost(14, 23, GHOST_MODE.FRIGHTENED);
    const result = checkPacmanGhostCollision(pac, [ghost]);
    expect(result.died).toBe(false);
  });

  it('ghost in eaten mode → no collision', () => {
    const pac = mockPacman(14, 23);
    const ghost = mockGhost(14, 23, GHOST_MODE.EATEN);
    const result = checkPacmanGhostCollision(pac, [ghost]);
    expect(result.died).toBe(false);
  });

  it('ghost in house → no collision', () => {
    const pac = mockPacman(14, 23);
    const ghost = mockGhost(14, 23, GHOST_MODE.CHASE, { inHouse: true });
    const result = checkPacmanGhostCollision(pac, [ghost]);
    expect(result.died).toBe(false);
  });

  it('ghost exiting house → no collision', () => {
    const pac = mockPacman(14, 23);
    const ghost = mockGhost(14, 23, GHOST_MODE.CHASE, { exitingHouse: true });
    const result = checkPacmanGhostCollision(pac, [ghost]);
    expect(result.died).toBe(false);
  });

  it('ghost on different tile → no collision', () => {
    const pac = mockPacman(14, 23);
    const ghost = mockGhost(10, 10, GHOST_MODE.CHASE);
    const result = checkPacmanGhostCollision(pac, [ghost]);
    expect(result.died).toBe(false);
    expect(result.ghost).toBeNull();
  });
});
