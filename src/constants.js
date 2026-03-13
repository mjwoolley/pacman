// Classic Pac-Man runs on a 28x36 tile grid (28x31 maze + HUD rows)
export const TILE_SIZE = 8;
export const SCALE = 3; // Render at 3x for modern displays
export const CELL = TILE_SIZE * SCALE; // 24px per cell

export const MAZE_COLS = 28;
export const MAZE_ROWS = 31;

// Canvas dimensions (includes HUD space: 3 rows top, 2 rows bottom)
export const CANVAS_COLS = 28;
export const CANVAS_ROWS = 36;
export const CANVAS_WIDTH = CANVAS_COLS * CELL;
export const CANVAS_HEIGHT = CANVAS_ROWS * CELL;

// Maze offset (3 tile rows from top for score HUD)
export const MAZE_OFFSET_Y = 3 * CELL;

// Pac-Man starting position (tile coordinates)
export const PACMAN_START = { col: 14, row: 23 };

// Ghost house position
export const GHOST_HOUSE = { col: 14, row: 14 };

// Speeds (pixels per second at scale)
export const BASE_SPEED = CELL * 9.375; // ~80% of max in original
export const GHOST_SPEED_FACTOR = 0.25; // reduces ghost speed to 25% of base for playability

// Scoring
export const SCORE = {
  DOT: 10,
  POWER_PELLET: 50,
  GHOST_BASE: 200, // doubles per ghost eaten in sequence
  CHERRY: 100,
  STRAWBERRY: 300,
  ORANGE: 500,
  APPLE: 700,
  MELON: 1000,
  GALAXIAN: 2000,
  BELL: 3000,
  KEY: 5000,
};

// Lives
export const STARTING_LIVES = 3;
export const EXTRA_LIFE_SCORE = 10000;

// Ghost names
export const GHOSTS = {
  BLINKY: 'blinky',
  PINKY: 'pinky',
  INKY: 'inky',
  CLYDE: 'clyde',
};

// Colors
export const COLORS = {
  WALL: '#2121DE',
  DOT: '#FFCCAA',
  POWER_PELLET: '#FFCCAA',
  BACKGROUND: '#000000',
  PACMAN: '#FFFF00',
  BLINKY: '#FF0000',
  PINKY: '#FFB8FF',
  INKY: '#00FFFF',
  CLYDE: '#FFB852',
  FRIGHTENED: '#2121DE',
  FRIGHTENED_FLASH: '#FFFFFF',
  TEXT: '#FFFFFF',
  READY: '#FFFF00',
};

// Game states
export const STATE = {
  READY: 'ready',
  PLAYING: 'playing',
  DYING: 'dying',
  GAME_OVER: 'game_over',
  WIN: 'win',
};

// Directions
export const DIR = {
  NONE: { x: 0, y: 0 },
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

// Ghost modes
export const GHOST_MODE = {
  SCATTER: 'scatter',
  CHASE: 'chase',
  FRIGHTENED: 'frightened',
  EATEN: 'eaten',
};

// Frightened mode duration (ms)
export const FRIGHTENED_DURATION = 6000;
export const FRIGHTENED_FLASH_START = 4000; // Start flashing at this point

// Chase/Scatter timing (ms) — simplified single-level pattern
export const MODE_TIMING = [
  { mode: 'scatter', duration: 7000 },
  { mode: 'chase', duration: 20000 },
  { mode: 'scatter', duration: 7000 },
  { mode: 'chase', duration: 20000 },
  { mode: 'scatter', duration: 5000 },
  { mode: 'chase', duration: 20000 },
  { mode: 'scatter', duration: 5000 },
  { mode: 'chase', duration: Infinity }, // Permanent chase
];
