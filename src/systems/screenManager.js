import { CELL, CANVAS_WIDTH, MAZE_OFFSET_Y, COLORS } from '../constants.js';

const READY_DURATION = 2; // seconds
const GAME_OVER_HOLD = 3; // seconds before showing prompt

export class ScreenManager {
  constructor() {
    this.timer = 0;
  }

  reset() {
    this.timer = 0;
  }

  updateTimer(dt) {
    this.timer += dt;
  }

  isReadyComplete() {
    return this.timer >= READY_DURATION;
  }

  isGameOverPromptVisible() {
    return this.timer >= GAME_OVER_HOLD;
  }

  drawReady(ctx) {
    this._drawCenterText(ctx, 'READY!', COLORS.READY);
  }

  drawGameOver(ctx) {
    this._drawCenterText(ctx, 'GAME OVER', '#FF0000');
    if (this.timer >= GAME_OVER_HOLD) {
      this._drawSubText(ctx, 'PRESS ANY KEY', COLORS.TEXT);
    }
  }

  drawWin(ctx, finalScore) {
    this._drawCenterText(ctx, 'YOU WIN!', COLORS.READY);
    this._drawSubText(ctx, `SCORE: ${finalScore}`, COLORS.TEXT);
    this._drawSubText2(ctx, 'PRESS ANY KEY', COLORS.TEXT);
  }

  _drawCenterText(ctx, text, color) {
    ctx.fillStyle = color;
    ctx.font = `${CELL}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = CANVAS_WIDTH / 2;
    const cy = 17.5 * CELL + MAZE_OFFSET_Y;
    ctx.fillText(text, cx, cy);
  }

  _drawSubText(ctx, text, color) {
    ctx.fillStyle = color;
    ctx.font = `${CELL * 0.7}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = CANVAS_WIDTH / 2;
    const cy = 19.5 * CELL + MAZE_OFFSET_Y;
    ctx.fillText(text, cx, cy);
  }

  _drawSubText2(ctx, text, color) {
    ctx.fillStyle = color;
    ctx.font = `${CELL * 0.7}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = CANVAS_WIDTH / 2;
    const cy = 21 * CELL + MAZE_OFFSET_Y;
    ctx.fillText(text, cx, cy);
  }
}
