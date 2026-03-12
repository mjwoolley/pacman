import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CELL, SCORE } from '../constants.js';
import { Fruit } from './fruit.js';
import { gameState } from '../systems/gameState.js';

describe('Fruit', () => {
  let fruit;
  let mockPacman;

  beforeEach(() => {
    gameState.reset();
    fruit = new Fruit();
    mockPacman = {
      getTile: () => ({ col: 14, row: 17 }),
    };
  });

  it('spawns cherry at 70 dots eaten', () => {
    expect(fruit.active).toBe(false);
    gameState.dotsRemaining = 244 - 70;
    fruit.update(0);
    expect(fruit.active).toBe(true);
    expect(fruit.fruitsSpawned).toBe(1);
  });

  it('spawns second cherry at 170 dots eaten', () => {
    gameState.dotsRemaining = 244 - 70;
    fruit.update(0);
    expect(fruit.fruitsSpawned).toBe(1);

    // Collect first fruit
    fruit.checkCollection(mockPacman);
    expect(fruit.active).toBe(false);

    // Second spawn
    gameState.dotsRemaining = 244 - 170;
    fruit.update(0);
    expect(fruit.active).toBe(true);
    expect(fruit.fruitsSpawned).toBe(2);
  });

  it('does not spawn more than 2 fruits', () => {
    // Spawn and collect first
    gameState.dotsRemaining = 244 - 70;
    fruit.update(0);
    fruit.checkCollection(mockPacman);

    // Spawn and collect second
    gameState.dotsRemaining = 244 - 170;
    fruit.update(0);
    fruit.checkCollection(mockPacman);

    // No more spawns
    gameState.dotsRemaining = 244 - 200;
    fruit.update(0);
    expect(fruit.active).toBe(false);
    expect(fruit.fruitsSpawned).toBe(2);
  });

  it('disappears after 10 seconds', () => {
    gameState.dotsRemaining = 244 - 70;
    fruit.update(0);
    expect(fruit.active).toBe(true);

    fruit.update(9.5);
    expect(fruit.active).toBe(true);

    fruit.update(0.6);
    expect(fruit.active).toBe(false);
  });

  it('awards 100 points on collection', () => {
    gameState.dotsRemaining = 244 - 70;
    fruit.update(0);

    const scoreBefore = gameState.score;
    const collected = fruit.checkCollection(mockPacman);
    expect(collected).toBe(true);
    expect(gameState.score).toBe(scoreBefore + SCORE.CHERRY);
    expect(fruit.active).toBe(false);
  });

  it('shows score popup on collection', () => {
    gameState.dotsRemaining = 244 - 70;
    fruit.update(0);
    fruit.checkCollection(mockPacman);

    expect(fruit.scorePopup).not.toBeNull();
    expect(fruit.scorePopup.text).toBe(String(SCORE.CHERRY));
    expect(fruit.scorePopup.timer).toBeCloseTo(1.0);
  });

  it('does not collect when not active', () => {
    const collected = fruit.checkCollection(mockPacman);
    expect(collected).toBe(false);
  });

  it('does not collect when pacman is on different tile', () => {
    gameState.dotsRemaining = 244 - 70;
    fruit.update(0);

    const farPacman = { getTile: () => ({ col: 1, row: 1 }) };
    const collected = fruit.checkCollection(farPacman);
    expect(collected).toBe(false);
    expect(fruit.active).toBe(true);
  });

  it('resets all state', () => {
    gameState.dotsRemaining = 244 - 70;
    fruit.update(0);
    expect(fruit.active).toBe(true);

    fruit.reset();
    expect(fruit.active).toBe(false);
    expect(fruit.fruitsSpawned).toBe(0);
    expect(fruit.nextSpawnIndex).toBe(0);
  });
});
