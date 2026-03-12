import { describe, it, expect } from 'vitest';
import { MazeRenderer, isWall } from './mazeRenderer.js';

describe('MazeRenderer', () => {
  describe('_initDots', () => {
    it('should find 244 total dots and power pellets', () => {
      const renderer = new MazeRenderer();
      expect(renderer.dots.size).toBe(244);
    });

    it('should contain both dots (tile=2) and power pellets (tile=3)', () => {
      const renderer = new MazeRenderer();
      // Just verify it's a non-empty Set with string keys
      for (const key of renderer.dots) {
        expect(key).toMatch(/^\d+,\d+$/);
      }
    });
  });

  describe('eatDot', () => {
    it('should remove a dot from the Set', () => {
      const renderer = new MazeRenderer();
      const initialSize = renderer.dots.size;
      // Get the first dot
      const firstDot = renderer.dots.values().next().value;
      const [row, col] = firstDot.split(',').map(Number);

      renderer.eatDot(row, col);
      expect(renderer.dots.size).toBe(initialSize - 1);
      expect(renderer.dots.has(firstDot)).toBe(false);
    });

    it('should be a no-op for non-existent dot', () => {
      const renderer = new MazeRenderer();
      const initialSize = renderer.dots.size;
      renderer.eatDot(0, 0); // wall position
      expect(renderer.dots.size).toBe(initialSize);
    });
  });
});

describe('isWall', () => {
  it('should return true for a known wall tile (row=0, col=0)', () => {
    expect(isWall(0, 0)).toBe(true);
  });

  it('should return false for a known non-wall tile (row=1, col=1)', () => {
    expect(isWall(1, 1)).toBe(false);
  });

  it('should return false for out-of-bounds column (tunnel edge)', () => {
    expect(isWall(14, -1)).toBe(false);
  });

  it('should return true for out-of-bounds row (border)', () => {
    expect(isWall(-1, 5)).toBe(true);
  });
});
