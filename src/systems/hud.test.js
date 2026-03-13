import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HUD } from './hud.js';

describe('HUD', () => {
  let hud;

  beforeEach(() => {
    hud = new HUD();
  });

  it('starts with 0 fruits collected', () => {
    expect(hud.fruitsCollected).toBe(0);
  });

  it('tracks collected fruits', () => {
    hud.collectFruit();
    expect(hud.fruitsCollected).toBe(1);
    hud.collectFruit();
    expect(hud.fruitsCollected).toBe(2);
  });

  it('resets fruit count', () => {
    hud.collectFruit();
    hud.collectFruit();
    hud.reset();
    expect(hud.fruitsCollected).toBe(0);
  });

  it('draw does not throw', () => {
    const ctx = {
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
      fillText: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: '',
      lineWidth: 0,
    };
    expect(() => hud.draw(ctx)).not.toThrow();
  });
});
