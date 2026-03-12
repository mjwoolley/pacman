import { describe, it, expect } from "vitest";
import { Pacman } from "./pacman.js";
import { CELL, MAZE_COLS, PACMAN_START, DIR } from "../constants.js";

describe("Pacman", () => {
  it("getTile() returns correct tile for starting position", () => {
    const pac = new Pacman();
    const tile = pac.getTile();
    expect(tile.col).toBe(PACMAN_START.col);
    expect(tile.row).toBe(PACMAN_START.row);
  });

  it("setDirection() sets nextDir", () => {
    const pac = new Pacman();
    pac.setDirection(DIR.RIGHT);
    expect(pac.nextDir).toEqual(DIR.RIGHT);
  });

  it("update(dt) with dir=RIGHT moves x forward", () => {
    const pac = new Pacman();
    pac.dir = DIR.RIGHT;
    const startX = pac.x;
    pac.update(1 / 60);
    expect(pac.x).toBeGreaterThan(startX);
  });

  it("update(dt) collision: moving into a wall snaps back and stops", () => {
    const pac = new Pacman();
    // Pac-Man starts at col 14, row 23. Moving UP into row 22 which is a wall row.
    // First, let's move pac-man up by setting dir directly
    pac.dir = DIR.UP;
    // Simulate many frames to force collision
    for (let i = 0; i < 120; i++) {
      pac.update(1 / 60);
    }
    // After hitting a wall, dir should be NONE and position snapped to tile center
    expect(pac.dir).toEqual(DIR.NONE);
    expect(pac.x % CELL).toBeCloseTo(CELL / 2, 0);
    expect(pac.y % CELL).toBeCloseTo(CELL / 2, 0);
  });

  it("tunnel wrap: Pac-Man traverses left tunnel exit and reappears on right", () => {
    const pac = new Pacman();
    // Place Pac-Man on tunnel row (14), near left edge, moving left
    pac.x = CELL * 0.5; // half a cell from left edge
    pac.y = 14 * CELL + CELL / 2;
    pac.dir = DIR.LEFT;
    // Simulate enough frames to cross x=0
    for (let i = 0; i < 30; i++) {
      pac.update(1 / 60);
      if (pac.x >= MAZE_COLS * CELL - CELL) break; // wrapped
    }
    expect(pac.x).toBeGreaterThan(CELL * (MAZE_COLS / 2)); // reappeared on right side
  });

  it("startDeath() begins dying state", () => {
    const pac = new Pacman();
    pac.startDeath();
    expect(pac.isDying()).toBe(true);
    expect(pac.isDeathComplete()).toBe(false);
  });

  it("death animation completes after sufficient time", () => {
    const pac = new Pacman();
    pac.startDeath();
    // Advance 2 seconds (death duration is 1.5s)
    pac.update(2.0);
    expect(pac.isDeathComplete()).toBe(true);
  });

  it("dying pacman does not move", () => {
    const pac = new Pacman();
    pac.dir = DIR.RIGHT;
    pac.startDeath();
    const startX = pac.x;
    pac.update(1 / 60);
    expect(pac.x).toBe(startX);
  });

  it("resetPosition() snaps back to start", () => {
    const pac = new Pacman();
    pac.x = 100;
    pac.y = 200;
    pac.dir = DIR.RIGHT;
    pac.startDeath();
    pac.resetPosition();
    expect(pac.getTile().col).toBe(PACMAN_START.col);
    expect(pac.getTile().row).toBe(PACMAN_START.row);
    expect(pac.isDying()).toBe(false);
    expect(pac.dir).toEqual(DIR.NONE);
  });
});
