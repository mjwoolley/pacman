import { describe, it, expect, beforeEach, vi } from "vitest";
import { DotManager } from "./dotManager.js";
import { gameState } from "./gameState.js";

describe("gameState", () => {
  beforeEach(() => {
    gameState.reset();
  });

  it("addScore increments score and updates highScore", () => {
    gameState.addScore(100);
    expect(gameState.score).toBe(100);
    expect(gameState.highScore).toBe(100);
    gameState.addScore(50);
    expect(gameState.score).toBe(150);
    expect(gameState.highScore).toBe(150);
  });

  it("reset clears state but preserves highScore", () => {
    gameState.addScore(500);
    gameState.lives = 1;
    gameState.won = true;
    gameState.reset();
    expect(gameState.score).toBe(0);
    expect(gameState.lives).toBe(3);
    expect(gameState.dotsRemaining).toBe(244);
    expect(gameState.won).toBe(false);
    expect(gameState.highScore).toBe(500);
  });
});

describe("DotManager", () => {
  let dotManager;

  beforeEach(() => {
    gameState.reset();
    dotManager = new DotManager();
  });

  it("initializes with 244 dots", () => {
    expect(dotManager.dots.size).toBe(244);
    expect(dotManager.totalDots).toBe(244);
  });

  it("checkCollection removes a dot when pacman is on that tile", () => {
    const pacman = { getTile: () => ({ row: 1, col: 1 }) };
    dotManager.checkCollection(pacman);
    expect(dotManager.dots.has("1,1")).toBe(false);
    expect(gameState.dotsRemaining).toBe(243);
  });

  it("scores 10 for a dot", () => {
    const pacman = { getTile: () => ({ row: 1, col: 1 }) };
    dotManager.checkCollection(pacman);
    expect(gameState.score).toBe(10);
  });

  it("scores 50 for a power pellet", () => {
    const pacman = { getTile: () => ({ row: 3, col: 1 }) };
    dotManager.checkCollection(pacman);
    expect(gameState.score).toBe(50);
  });

  it("fires onPowerPellet callback when a power pellet is collected", () => {
    const callback = vi.fn();
    dotManager.onPowerPellet = callback;
    const pacman = { getTile: () => ({ row: 3, col: 1 }) };
    dotManager.checkCollection(pacman);
    expect(callback).toHaveBeenCalledOnce();
    expect(gameState.powerPelletActive).toBe(true);
  });

  it("sets gameState.won when dotsRemaining reaches 0", () => {
    gameState.dotsRemaining = 1;
    dotManager.dots.clear();
    dotManager.dots.add("1,1");
    const pacman = { getTile: () => ({ row: 1, col: 1 }) };
    dotManager.checkCollection(pacman);
    expect(gameState.dotsRemaining).toBe(0);
    expect(gameState.won).toBe(true);
  });

  it("reset restores full dot count", () => {
    const pacman = { getTile: () => ({ row: 1, col: 1 }) };
    dotManager.checkCollection(pacman);
    expect(dotManager.dots.size).toBe(243);
    dotManager.reset();
    expect(dotManager.dots.size).toBe(244);
    expect(gameState.dotsRemaining).toBe(244);
  });
});
