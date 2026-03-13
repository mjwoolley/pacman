import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, STATE } from './constants.js';
import { MazeRenderer } from './systems/mazeRenderer.js';
import { DotManager } from './systems/dotManager.js';
import { gameState } from './systems/gameState.js';
import { Pacman } from './entities/pacman.js';
import { InputHandler } from './systems/input.js';
import { GhostManager } from './systems/ghostManager.js';
import { checkPacmanGhostCollision } from './systems/collisionManager.js';
import { Fruit } from './entities/fruit.js';
import { HUD } from './systems/hud.js';
import { ScreenManager } from './systems/screenManager.js';
import { soundManager } from './systems/soundManager.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let mazeRenderer = new MazeRenderer();
let dotManager = new DotManager();
let pacman = new Pacman();
const input = new InputHandler(pacman);
let ghostManager = new GhostManager();
let fruit = new Fruit();
let hud = new HUD();
let screenManager = new ScreenManager();

dotManager.onEatDot = (row, col) => mazeRenderer.eatDot(row, col);
dotManager.onPowerPellet = () => ghostManager.triggerFrightened();

let lastTime = 0;
let freezeTimer = 0;
let canRestart = false;
let introComplete = true;
let audioInitialized = false;

function startIntro() {
  introComplete = false;
  soundManager.playIntro().then(() => {
    introComplete = true;
  });
}

gameState.currentState = STATE.READY;

function gameLoop(timestamp) {
  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0;
  lastTime = timestamp;

  // Clear
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Always draw maze, dots, HUD
  mazeRenderer.draw(ctx, timestamp);
  dotManager.draw(ctx, timestamp);
  hud.draw(ctx);

  const state = gameState.currentState;

  if (state === STATE.READY) {
    screenManager.updateTimer(dt);
    pacman.draw(ctx);
    ghostManager.draw(ctx);
    fruit.draw(ctx);
    screenManager.drawReady(ctx);
    if (screenManager.isReadyComplete() && introComplete) {
      gameState.currentState = STATE.PLAYING;
      soundManager.startSiren();
      screenManager.reset();
    }
  } else if (state === STATE.PLAYING) {
    pacman.update(dt);
    dotManager.checkCollection(pacman);
    ghostManager.update(dt, pacman);
    fruit.update(dt);
    if (fruit.checkCollection(pacman)) {
      hud.collectFruit();
    }

    // Check for win
    if (gameState.won) {
      gameState.currentState = STATE.WIN;
      soundManager.stopAll();
      screenManager.reset();
      canRestart = false;
    } else {
      // Check collision with non-frightened ghosts
      const result = checkPacmanGhostCollision(pacman, ghostManager.ghosts);
      if (result.died) {
        gameState.currentState = STATE.DYING;
        soundManager.stopSiren();
        soundManager.stopFrightened();
        soundManager.playDeath();
        freezeTimer = 1;
      }
    }

    pacman.draw(ctx);
    ghostManager.draw(ctx);
    fruit.draw(ctx);
  } else if (state === STATE.DYING) {
    fruit.draw(ctx);
    if (freezeTimer > 0) {
      freezeTimer -= dt;
      pacman.draw(ctx);
      ghostManager.draw(ctx);
      if (freezeTimer <= 0) {
        pacman.startDeath();
      }
    } else {
      pacman.update(dt);
      pacman.draw(ctx);
      if (pacman.isDeathComplete()) {
        gameState.loseLife();
        if (gameState.isGameOver()) {
          gameState.currentState = STATE.GAME_OVER;
          soundManager.stopAll();
          screenManager.reset();
          canRestart = false;
        } else {
          pacman.resetPosition();
          ghostManager.resetPositions();
          gameState.currentState = STATE.READY;
          startIntro();
          screenManager.reset();
        }
      }
    }
  } else if (state === STATE.GAME_OVER) {
    screenManager.updateTimer(dt);
    screenManager.drawGameOver(ctx);
    if (screenManager.isGameOverPromptVisible()) {
      canRestart = true;
    }
  } else if (state === STATE.WIN) {
    pacman.draw(ctx);
    screenManager.drawWin(ctx, gameState.score);
    canRestart = true;
  }

  requestAnimationFrame(gameLoop);
}

function fullRestart() {
  soundManager.stopAll();
  gameState.reset();
  mazeRenderer = new MazeRenderer();
  dotManager = new DotManager();
  dotManager.onEatDot = (row, col) => mazeRenderer.eatDot(row, col);
  pacman.resetPosition();
  ghostManager = new GhostManager();
  dotManager.onPowerPellet = () => ghostManager.triggerFrightened();
  fruit = new Fruit();
  hud.reset();
  screenManager.reset();
  freezeTimer = 0;
  canRestart = false;
  startIntro();
}

document.addEventListener('keydown', () => {
  if (!audioInitialized) {
    audioInitialized = true;
    soundManager.init();
    if (gameState.currentState === STATE.READY) {
      startIntro();
    }
  } else {
    soundManager.init();
  }
  if (canRestart && (gameState.currentState === STATE.GAME_OVER || gameState.currentState === STATE.WIN)) {
    fullRestart();
  }
});

requestAnimationFrame(gameLoop);
console.log('🟡 Pac-Man initialized — canvas ready');
