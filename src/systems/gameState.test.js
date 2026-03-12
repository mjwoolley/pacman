// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('gameState high score persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    gameState.highScore = 0;
    gameState.reset();
  });

  it('saves high score to localStorage when beaten', () => {
    gameState.addScore(5000);
    expect(localStorage.getItem('pacman_high_score')).toBe('5000');
  });

  it('updates high score in localStorage when beaten again', () => {
    gameState.addScore(5000);
    gameState.addScore(3000);
    expect(localStorage.getItem('pacman_high_score')).toBe('8000');
  });

  it('does not save to localStorage when score does not beat high score', () => {
    localStorage.setItem('pacman_high_score', '99999');
    gameState.highScore = 99999;
    gameState.addScore(100);
    expect(localStorage.getItem('pacman_high_score')).toBe('99999');
  });
});
