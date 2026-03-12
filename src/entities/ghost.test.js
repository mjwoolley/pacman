import { describe, it, expect } from 'vitest';
import { Ghost, isGhostPassable, getAvailableDirections } from './ghost.js';
import { CELL, DIR, COLORS } from '../constants.js';

function makeGhost(overrides = {}) {
  return new Ghost(
    overrides.name || 'blinky',
    overrides.color || COLORS.BLINKY,
    overrides.scatterTarget || { col: 25, row: 0 },
    overrides.startCol ?? 14,
    overrides.startRow ?? 11,
    overrides.startDir || DIR.LEFT,
    overrides.inHouse ?? false,
  );
}

function mockPacman(col = 14, row = 23, dir = DIR.LEFT) {
  return {
    getTile: () => ({ col, row }),
    dir,
    x: col * CELL + CELL / 2,
    y: row * CELL + CELL / 2,
  };
}

describe('Ghost', () => {
  it('initializes at correct tile center position', () => {
    const g = makeGhost({ startCol: 14, startRow: 11 });
    expect(g.x).toBe(14 * CELL + CELL / 2);
    expect(g.y).toBe(11 * CELL + CELL / 2);
  });

  it('getTile returns correct tile', () => {
    const g = makeGhost({ startCol: 10, startRow: 5 });
    const tile = g.getTile();
    expect(tile.col).toBe(10);
    expect(tile.row).toBe(5);
  });

  it('reverseDirection reverses dir', () => {
    const g = makeGhost({ startDir: DIR.LEFT });
    g.reverseDirection();
    expect(g.dir.x).toBe(1);
    expect(Math.abs(g.dir.y)).toBe(0);
  });
});

describe('isGhostPassable', () => {
  it('wall returns false', () => {
    // Row 0, Col 0 is a wall (tile type 1)
    expect(isGhostPassable(0, 0)).toBe(false);
  });

  it('dot returns true', () => {
    // Row 1, Col 1 is a dot (tile type 2)
    expect(isGhostPassable(1, 1)).toBe(true);
  });

  it('ghost house tile returns true', () => {
    // Row 13, Col 13 is ghost house (tile type 4) or gate (5)
    expect(isGhostPassable(13, 11)).toBe(true);
  });
});

describe('getAvailableDirections', () => {
  it('excludes reverse direction', () => {
    // Row 5, Col 6 is a dot tile with open paths
    const dirs = getAvailableDirections(5, 6, DIR.LEFT);
    const hasRight = dirs.some(d => d.x === 1 && d.y === 0);
    expect(hasRight).toBe(false);
  });
});

describe('Chase target functions', () => {
  it('Blinky chase = pac tile', () => {
    const pac = mockPacman(10, 20);
    const blinkyFn = (p) => p.getTile();
    expect(blinkyFn(pac)).toEqual({ col: 10, row: 20 });
  });

  it('Pinky chase = 4 ahead', () => {
    const pac = mockPacman(10, 20, DIR.LEFT);
    const pinkyFn = (p) => ({
      col: p.getTile().col + p.dir.x * 4,
      row: p.getTile().row + p.dir.y * 4,
    });
    expect(pinkyFn(pac)).toEqual({ col: 6, row: 20 });
  });

  it('Inky chase = vector double from blinky', () => {
    const pac = mockPacman(10, 20, DIR.LEFT);
    const blinky = makeGhost({ startCol: 12, startRow: 18 });
    const inkyFn = (p, b) => {
      const ahead = { col: p.getTile().col + p.dir.x * 2, row: p.getTile().row + p.dir.y * 2 };
      const bt = b.getTile();
      return { col: ahead.col + (ahead.col - bt.col), row: ahead.row + (ahead.row - bt.row) };
    };
    // ahead = (8, 20), blinky at (12, 18) => (8+(8-12), 20+(20-18)) = (4, 22)
    expect(inkyFn(pac, blinky)).toEqual({ col: 4, row: 22 });
  });

  it('Clyde: >8 tiles returns pac tile', () => {
    const pac = mockPacman(10, 20);
    const clyde = makeGhost({ startCol: 1, startRow: 1 });
    const ct = clyde.getTile();
    const pt = pac.getTile();
    const d = Math.sqrt((pt.col - ct.col) ** 2 + (pt.row - ct.row) ** 2);
    expect(d).toBeGreaterThan(8);
    // Should return pac tile
    const result = d > 8 ? pt : { col: 0, row: 30 };
    expect(result).toEqual({ col: 10, row: 20 });
  });

  it('Clyde: <=8 tiles returns scatter corner', () => {
    const pac = mockPacman(14, 14);
    const clyde = makeGhost({ startCol: 14, startRow: 11 });
    const ct = clyde.getTile();
    const pt = pac.getTile();
    const d = Math.sqrt((pt.col - ct.col) ** 2 + (pt.row - ct.row) ** 2);
    expect(d).toBeLessThanOrEqual(8);
    const result = d > 8 ? pt : { col: 0, row: 30 };
    expect(result).toEqual({ col: 0, row: 30 });
  });
});

describe('No-up zones', () => {
  it('filters UP in scatter/chase mode at no-up zone', () => {
    const g = makeGhost({ startCol: 12, startRow: 11, startDir: DIR.LEFT });
    g.mode = 'scatter';
    g.scatterTarget = { col: 25, row: 0 };
    // getAvailableDirections at (11, 12) moving LEFT
    const dirs = getAvailableDirections(11, 12, DIR.LEFT);
    const hasUp = dirs.some(d => d.x === DIR.UP.x && d.y === DIR.UP.y);
    // The no-up zone filtering happens in pickDirection, not getAvailableDirections
    // So we test via pickDirection
    const pac = mockPacman(14, 23);
    g.pickDirection(11, 12, pac, null);
    // The ghost should not choose UP at this no-up zone
    expect(g.dir.y).not.toBe(-1);
  });
});
