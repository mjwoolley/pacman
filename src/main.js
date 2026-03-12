import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL, MAZE_COLS, MAZE_ROWS, MAZE_OFFSET_Y, COLORS } from './constants.js';
import { MAZE_DATA } from './maze.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

function drawMaze() {
  for (let row = 0; row < MAZE_ROWS; row++) {
    for (let col = 0; col < MAZE_COLS; col++) {
      const tile = MAZE_DATA[row][col];
      const x = col * CELL;
      const y = row * CELL + MAZE_OFFSET_Y;

      switch (tile) {
        case 1: // Wall
          ctx.fillStyle = COLORS.WALL;
          ctx.fillRect(x, y, CELL, CELL);
          break;
        case 2: // Dot
          ctx.fillStyle = COLORS.DOT;
          ctx.beginPath();
          ctx.arc(x + CELL / 2, y + CELL / 2, CELL * 0.1, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 3: // Power pellet
          ctx.fillStyle = COLORS.POWER_PELLET;
          ctx.beginPath();
          ctx.arc(x + CELL / 2, y + CELL / 2, CELL * 0.35, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 5: // Ghost house gate
          ctx.fillStyle = '#FFB8FF';
          ctx.fillRect(x, y + CELL * 0.4, CELL, CELL * 0.2);
          break;
      }
    }
  }
}

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

function render() {
  // Clear
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawMaze();
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
}

render();

console.log('🟡 Pac-Man initialized — canvas ready');
