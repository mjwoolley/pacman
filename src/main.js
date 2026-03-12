import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL, MAZE_OFFSET_Y, COLORS } from './constants.js';
import { MazeRenderer } from './systems/mazeRenderer.js';
import { DotManager } from './systems/dotManager.js';
import { gameState } from './systems/gameState.js';
import { Pacman } from './entities/pacman.js';
import { InputHandler } from './systems/input.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const mazeRenderer = new MazeRenderer();
const dotManager = new DotManager();
const pacman = new Pacman();
const input = new InputHandler(pacman);

let lastTime = 0;

function drawHUD() {
  ctx.fillStyle = COLORS.TEXT;
  ctx.font = `${CELL * 0.8}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', CELL, CELL * 1.5);
  ctx.fillText(String(gameState.score), CELL, CELL * 2.5);

  ctx.textAlign = 'right';
  ctx.fillText('HIGH SCORE', CANVAS_WIDTH - CELL, CELL * 1.5);
  ctx.fillText(String(gameState.highScore), CANVAS_WIDTH - CELL, CELL * 2.5);
}

function gameLoop(timestamp) {
  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0;
  lastTime = timestamp;

  // Clear
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  pacman.update(dt);
  dotManager.checkCollection(pacman);

  mazeRenderer.draw(ctx, timestamp);
  dotManager.draw(ctx, timestamp);
  pacman.draw(ctx);
  drawHUD();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
console.log('🟡 Pac-Man initialized — canvas ready');
