import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL, MAZE_OFFSET_Y, COLORS } from './constants.js';
import { MazeRenderer } from './systems/mazeRenderer.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const mazeRenderer = new MazeRenderer();

function drawHUD() {
  ctx.fillStyle = COLORS.TEXT;
  ctx.font = `${CELL * 0.8}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', CELL, CELL * 1.5);
  ctx.fillText('0', CELL, CELL * 2.5);

  ctx.textAlign = 'right';
  ctx.fillText('HIGH SCORE', CANVAS_WIDTH - CELL, CELL * 1.5);
  ctx.fillText('0', CANVAS_WIDTH - CELL, CELL * 2.5);
}

function gameLoop(timestamp) {
  // Clear
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  mazeRenderer.draw(ctx, timestamp);
  drawHUD();

  // Draw Pac-Man placeholder at starting position
  const pacX = 14 * CELL;
  const pacY = 23 * CELL + MAZE_OFFSET_Y;
  ctx.fillStyle = COLORS.PACMAN;
  ctx.beginPath();
  ctx.arc(pacX, pacY + CELL / 2, CELL * 0.45, 0.25 * Math.PI, 1.75 * Math.PI);
  ctx.lineTo(pacX, pacY + CELL / 2);
  ctx.fill();

  // "READY!" text
  ctx.fillStyle = COLORS.READY;
  ctx.font = `${CELL * 0.8}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('READY!', CANVAS_WIDTH / 2, 17.5 * CELL + MAZE_OFFSET_Y);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
console.log('🟡 Pac-Man initialized — canvas ready');
