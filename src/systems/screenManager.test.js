import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScreenManager } from './screenManager.js';

describe('ScreenManager', () => {
  let sm;
  let ctx;

  beforeEach(() => {
    sm = new ScreenManager();
    ctx = {
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
      fillText: vi.fn(),
    };
  });

  it('starts with timer at 0', () => {
    expect(sm.timer).toBe(0);
  });

  it('isReadyComplete returns false before 2s', () => {
    sm.updateTimer(1.5);
    expect(sm.isReadyComplete()).toBe(false);
  });

  it('isReadyComplete returns true after 2s', () => {
    sm.updateTimer(2.1);
    expect(sm.isReadyComplete()).toBe(true);
  });

  it('isGameOverPromptVisible returns false before 3s', () => {
    sm.updateTimer(2.5);
    expect(sm.isGameOverPromptVisible()).toBe(false);
  });

  it('isGameOverPromptVisible returns true after 3s', () => {
    sm.updateTimer(3.1);
    expect(sm.isGameOverPromptVisible()).toBe(true);
  });

  it('reset sets timer to 0', () => {
    sm.updateTimer(5);
    sm.reset();
    expect(sm.timer).toBe(0);
  });

  it('drawReady renders READY! text', () => {
    sm.drawReady(ctx);
    expect(ctx.fillText).toHaveBeenCalledWith('READY!', expect.any(Number), expect.any(Number));
  });

  it('drawGameOver renders GAME OVER text', () => {
    sm.drawGameOver(ctx);
    expect(ctx.fillText).toHaveBeenCalledWith('GAME OVER', expect.any(Number), expect.any(Number));
  });

  it('drawGameOver shows PRESS ANY KEY after 3s', () => {
    sm.updateTimer(3.5);
    sm.drawGameOver(ctx);
    const calls = ctx.fillText.mock.calls.map(c => c[0]);
    expect(calls).toContain('GAME OVER');
    expect(calls).toContain('PRESS ANY KEY');
  });

  it('drawGameOver does not show PRESS ANY KEY before 3s', () => {
    sm.updateTimer(1);
    sm.drawGameOver(ctx);
    const calls = ctx.fillText.mock.calls.map(c => c[0]);
    expect(calls).toContain('GAME OVER');
    expect(calls).not.toContain('PRESS ANY KEY');
  });

  it('drawWin renders YOU WIN! with score', () => {
    sm.drawWin(ctx, 12345);
    const calls = ctx.fillText.mock.calls.map(c => c[0]);
    expect(calls).toContain('YOU WIN!');
    expect(calls).toContain('SCORE: 12345');
    expect(calls).toContain('PRESS ANY KEY');
  });
});
