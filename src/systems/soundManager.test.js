import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AudioContext before importing
function createMockOscillator() {
  return {
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      value: 440,
    },
    type: "sine",
    onended: null,
  };
}

function createMockGain() {
  return {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      value: 1,
    },
  };
}

global.AudioContext = class {
  constructor() {
    this._state = "suspended";
  }
  createOscillator() {
    return createMockOscillator();
  }
  createGain() {
    return createMockGain();
  }
  get currentTime() {
    return 0;
  }
  get state() {
    return this._state;
  }
  get destination() {
    return {};
  }
  resume() {
    this._state = "running";
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
};

const { SoundManager, soundManager } = await import("./soundManager.js");

describe("SoundManager", () => {
  let sm;

  beforeEach(() => {
    sm = new SoundManager();
    sm.init();
  });

  it("exports soundManager as a singleton", () => {
    expect(soundManager).toBeInstanceOf(SoundManager);
  });

  it("init() is idempotent — calling twice reuses the same AudioContext", () => {
    const ctxBefore = sm._ctx;
    sm.init();
    expect(sm._ctx).toBe(ctxBefore);
  });

  it("playChomp() alternates between high and low frequencies", () => {
    const oscs = [];
    sm._ctx.createOscillator = () => {
      const osc = createMockOscillator();
      oscs.push(osc);
      return osc;
    };
    sm._ctx.createGain = createMockGain;

    sm.playChomp(); // toggle false → true, freq 600
    sm.playChomp(); // toggle true → false, freq 480

    expect(oscs).toHaveLength(2);
    expect(oscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(600, 0);
    expect(oscs[1].frequency.setValueAtTime).toHaveBeenCalledWith(480, 0);
  });

  it("_createOsc sets oscillator type, frequency, and gain", () => {
    const mockOsc = createMockOscillator();
    const mockGain = createMockGain();
    sm._ctx.createOscillator = () => mockOsc;
    sm._ctx.createGain = () => mockGain;

    const result = sm._createOsc("sawtooth", 440, 0.5);

    expect(result).not.toBeNull();
    expect(mockOsc.type).toBe("sawtooth");
    expect(mockOsc.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0);
    expect(mockGain.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
    expect(mockOsc.connect).toHaveBeenCalledWith(mockGain);
    expect(mockGain.connect).toHaveBeenCalledWith(sm._masterGain);
  });

  it("_createOsc tracks oscillator and removes it on ended", () => {
    const mockOsc = createMockOscillator();
    sm._ctx.createOscillator = () => mockOsc;
    sm._ctx.createGain = createMockGain;

    sm._createOsc("sine", 440, 0.3);
    expect(sm._activeOscillators).toContain(mockOsc);

    mockOsc.onended();
    expect(sm._activeOscillators).not.toContain(mockOsc);
  });

  it("_createOsc returns null when _ctx is null", () => {
    sm._ctx = null;
    expect(sm._createOsc("sine", 440, 0.3)).toBeNull();
  });

  it("playIntro() returns a promise that resolves", async () => {
    vi.useFakeTimers();
    const p = sm.playIntro();
    expect(p).toBeInstanceOf(Promise);
    vi.advanceTimersByTime(5000);
    await p;
    vi.useRealTimers();
  });

  it("playIntro() before init() defers and plays after init()", async () => {
    vi.useFakeTimers();
    const fresh = new SoundManager();

    const p = fresh.playIntro();
    expect(fresh._pendingIntro).toBe(true);

    fresh.init();
    expect(fresh._pendingIntro).toBe(false);

    vi.advanceTimersByTime(5000);
    await p;
    vi.useRealTimers();
  });

  it("playDeath() schedules 12 descending oscillator steps", () => {
    const oscs = [];
    sm._ctx.createOscillator = () => {
      const osc = createMockOscillator();
      oscs.push(osc);
      return osc;
    };
    sm._ctx.createGain = createMockGain;

    sm.playDeath();

    expect(oscs).toHaveLength(12);
    for (const osc of oscs) {
      expect(osc.start).toHaveBeenCalled();
      expect(osc.stop).toHaveBeenCalled();
    }
  });

  it("playEatGhost() ramps frequency from 300 to 900", () => {
    const mockOsc = createMockOscillator();
    sm._ctx.createOscillator = () => mockOsc;
    sm._ctx.createGain = createMockGain;

    sm.playEatGhost();

    expect(mockOsc.frequency.setValueAtTime).toHaveBeenCalledWith(300, 0);
    expect(mockOsc.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(900, 0.3);
  });

  it("startSiren() creates interval and stopSiren() clears it", () => {
    sm.startSiren();
    expect(sm._sirenInterval).not.toBeNull();

    sm.stopSiren();
    expect(sm._sirenInterval).toBeNull();
  });

  it("startFrightened() creates interval and stopFrightened() clears it", () => {
    sm.startFrightened();
    expect(sm._frightenedInterval).not.toBeNull();

    sm.stopFrightened();
    expect(sm._frightenedInterval).toBeNull();
  });

  it("stopAll() stops active oscillators and clears intervals", () => {
    const mockOsc = createMockOscillator();
    sm._activeOscillators.push(mockOsc);
    sm.startSiren();
    sm.startFrightened();

    sm.stopAll();

    expect(mockOsc.stop).toHaveBeenCalled();
    expect(sm._activeOscillators).toHaveLength(0);
    expect(sm._sirenInterval).toBeNull();
    expect(sm._frightenedInterval).toBeNull();
  });

  it("stopAll() does not throw when nothing is playing", () => {
    const fresh = new SoundManager();
    expect(() => fresh.stopAll()).not.toThrow();
  });

  it("playFruit() schedules 3 ascending notes", () => {
    const oscs = [];
    sm._ctx.createOscillator = () => {
      const osc = createMockOscillator();
      oscs.push(osc);
      return osc;
    };
    sm._ctx.createGain = createMockGain;

    sm.playFruit();

    expect(oscs).toHaveLength(3);
    expect(oscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(523.25, 0);
    expect(oscs[1].frequency.setValueAtTime).toHaveBeenCalledWith(659.25, 0);
    expect(oscs[2].frequency.setValueAtTime).toHaveBeenCalledWith(783.99, 0);
  });

  it("playExtraLife() schedules 4 ascending notes", () => {
    const oscs = [];
    sm._ctx.createOscillator = () => {
      const osc = createMockOscillator();
      oscs.push(osc);
      return osc;
    };
    sm._ctx.createGain = createMockGain;

    sm.playExtraLife();

    expect(oscs).toHaveLength(4);
    expect(oscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(523.25, 0);
    expect(oscs[3].frequency.setValueAtTime).toHaveBeenCalledWith(1046.5, 0);
  });
});
