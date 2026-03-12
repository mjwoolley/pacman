import { describe, it, expect, beforeEach } from 'vitest';
import { gameState } from './gameState.js';
import { STATE, STARTING_LIVES } from '../constants.js';

describe('gameState lives and extra life', () => {
  beforeEach(() => {
    gameState.reset();
  });

  it('loseLife decrements lives', () => {
    const remaining = gameState.loseLife();
    expect(remaining).toBe(STARTING_LIVES - 1);
    expect(gameState.lives).toBe(STARTING_LIVES - 1);
  });

  it('isGameOver returns true when lives reach 0', () => {
    gameState.lives = 1;
    gameState.loseLife();
    expect(gameState.isGameOver()).toBe(true);
  });

  it('isGameOver returns false when lives remain', () => {
    expect(gameState.isGameOver()).toBe(false);
  });

  it('awards extra life at 10000 points (only once)', () => {
    gameState.addScore(10000);
    expect(gameState.lives).toBe(STARTING_LIVES + 1);
    expect(gameState.extraLifeAwarded).toBe(true);
    // Adding more points should not award another life
    gameState.addScore(10000);
    expect(gameState.lives).toBe(STARTING_LIVES + 1);
  });

  it('reset clears currentState and extraLifeAwarded', () => {
    gameState.currentState = STATE.GAME_OVER;
    gameState.extraLifeAwarded = true;
    gameState.reset();
    expect(gameState.currentState).toBe(STATE.READY);
    expect(gameState.extraLifeAwarded).toBe(false);
  });
});
