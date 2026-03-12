import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL, MAZE_OFFSET_Y, MAZE_ROWS, COLORS, STATE } from './constants.js';
import { MazeRenderer } from './systems/mazeRenderer.js';
import { DotManager } from './systems/dotManager.js';
import { gameState } from './systems/gameState.js';
import { Pacman } from './entities/pacman.js';
import { InputHandler } from './systems/input.js';
import { GhostManager } from './systems/ghostManager.js';
import { checkPacmanGhostCollision } from './systems/collisionManager.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let mazeRenderer = new MazeRenderer();
let dotManager = new DotManager();
let pacman = new Pacman();
const input = new InputHandler(pacman);
let ghostManager = new GhostManager();

dotManager.onEatDot = (row, col) => mazeRenderer.eatDot(row, col);
dotManager.onPowerPellet = () => ghostManager.triggerFrightened();

let lastTime = 0;
let stateTimer = 0;
let freezeTimer = 0;

gameState.currentState = STATE.READY;

function drawHUD() {
  ctx.fillStyle = COLORS.TEXT;
  ctx.font = `${CELL * 0.8}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', CELL, CELL * 1.5);
  ctx.fillText(String(gameState.score), CELL, CELL * 2.5);

  ctx.textAlign = 'right';
  ctx.fillText('HIGH SCORE', CANVAS_WIDTH - CELL, CELL * 1.5);
  ctx.fillText(String(gameState.highScore), CANVAS_WIDTH - CELL, CELL * 2.5);

  // Draw life icons at bottom
  const lifeY = (MAZE_ROWS + 3 + 1) * CELL + CELL / 2; // below maze
  const lifeRadius = CELL * 0.35;
  ctx.fillStyle = COLORS.PACMAN;
  for (let i = 0; i < gameState.lives - 1; i++) {
    const lifeX = CELL * 2 + i * CELL * 1.5;
    const halfMouth = (30 * Math.PI) / 180;
    const rotation = Math.PI; // face left like classic
    ctx.beginPath();
    ctx.arc(lifeX, lifeY, lifeRadius, rotation + halfMouth, rotation + 2 * Math.PI - halfMouth);
    ctx.lineTo(lifeX, lifeY);
    ctx.fill();
  }
}

function drawCenterText(text, color) {
  ctx.fillStyle = color;
  ctx.font = `${CELL}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = CANVAS_WIDTH / 2;
  const cy = 17.5 * CELL + MAZE_OFFSET_Y; // roughly center of maze
  ctx.fillText(text, cx, cy);
}

function gameLoop(timestamp) {
  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0;
  lastTime = timestamp;

  // Clear
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Always draw maze and HUD
  mazeRenderer.draw(ctx, timestamp);
  dotManager.draw(ctx, timestamp);
  drawHUD();

  const state = gameState.currentState;

  if (state === STATE.READY) {
    stateTimer += dt;
    pacman.draw(ctx);
    ghostManager.draw(ctx);
    drawCenterText('READY!', COLORS.READY);
    if (stateTimer >= 2) {
      gameState.currentState = STATE.PLAYING;
      stateTimer = 0;
    }
  } else if (state === STATE.PLAYING) {
    pacman.update(dt);
    dotManager.checkCollection(pacman);
    ghostManager.update(dt, pacman);

    // Check for win
    if (gameState.won) {
      gameState.currentState = STATE.WIN;
    } else {
      // Check collision with non-frightened ghosts
      const result = checkPacmanGhostCollision(pacman, ghostManager.ghosts);
      if (result.died) {
        gameState.currentState = STATE.DYING;
        freezeTimer = 1; // 1s freeze before death animation
      }
    }

    pacman.draw(ctx);
    ghostManager.draw(ctx);
  } else if (state === STATE.DYING) {
    if (freezeTimer > 0) {
      // Freeze frame — show everything but don't update
      freezeTimer -= dt;
      pacman.draw(ctx);
      ghostManager.draw(ctx);
      if (freezeTimer <= 0) {
        pacman.startDeath();
      }
    } else {
      // Death animation playing
      pacman.update(dt);
      pacman.draw(ctx);
      if (pacman.isDeathComplete()) {
        gameState.loseLife();
        if (gameState.isGameOver()) {
          gameState.currentState = STATE.GAME_OVER;
          stateTimer = 0;
        } else {
          // Reset positions, show READY again
          pacman.resetPosition();
          ghostManager.resetPositions();
          gameState.currentState = STATE.READY;
          stateTimer = 0;
        }
      }
    }
  } else if (state === STATE.GAME_OVER) {
    drawCenterText('GAME OVER', '#FF0000');
  } else if (state === STATE.WIN) {
    pacman.draw(ctx);
    drawCenterText('YOU WIN!', COLORS.READY);
  }

  requestAnimationFrame(gameLoop);
}

// Listen for any key to restart from GAME_OVER
document.addEventListener('keydown', () => {
  if (gameState.currentState === STATE.GAME_OVER) {
    gameState.reset();
    mazeRenderer = new MazeRenderer();
    dotManager = new DotManager();
    dotManager.onEatDot = (row, col) => mazeRenderer.eatDot(row, col);
    pacman.resetPosition();
    ghostManager = new GhostManager();
    dotManager.onPowerPellet = () => ghostManager.triggerFrightened();
    stateTimer = 0;
    freezeTimer = 0;
  }
});

requestAnimationFrame(gameLoop);
console.log('🟡 Pac-Man initialized — canvas ready');
