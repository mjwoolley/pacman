export class SoundManager {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._chompToggle = false;
    this._sirenInterval = null;
    this._frightenedInterval = null;
    this._activeOscillators = [];
    this._pendingIntro = false;
    this._pendingIntroResolve = null;
  }

  init() {
    try {
      if (this._ctx) {
        if (this._ctx.state === "suspended") {
          this._ctx.resume();
        }
        return;
      }
      this._ctx = new AudioContext();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = 0.3;
      this._masterGain.connect(this._ctx.destination);
      if (this._ctx.state === "suspended") {
        this._ctx.resume();
      }
      if (this._pendingIntro) {
        this._pendingIntro = false;
        const p = this._doPlayIntro();
        if (this._pendingIntroResolve) {
          p.then(this._pendingIntroResolve);
          this._pendingIntroResolve = null;
        }
      }
    } catch {
      // AudioContext not available
    }
  }

  _createOsc(type, freq, gainValue = 0.3) {
    if (!this._ctx) return null;
    try {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this._ctx.currentTime);
      gain.gain.setValueAtTime(gainValue, this._ctx.currentTime);
      osc.connect(gain);
      gain.connect(this._masterGain);
      this._activeOscillators.push(osc);
      osc.onended = () => {
        const idx = this._activeOscillators.indexOf(osc);
        if (idx !== -1) this._activeOscillators.splice(idx, 1);
      };
      return { osc, gain };
    } catch {
      return null;
    }
  }

  playIntro() {
    if (!this._ctx) {
      this._pendingIntro = true;
      return new Promise((resolve) => {
        this._pendingIntroResolve = resolve;
      });
    }
    return this._doPlayIntro();
  }

  _doPlayIntro() {
    try {
      const now = this._ctx.currentTime;
      // Descending then ascending tones over ~4 seconds
      const notes = [
        523.25, 493.88, 440, 392, 349.23, 329.63, 293.66, 261.63,
        293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33,
      ];
      const noteDuration = 0.22;
      const gap = 0.03;

      for (let i = 0; i < notes.length; i++) {
        const result = this._createOsc("square", notes[i], 0.2);
        if (!result) continue;
        const { osc, gain } = result;
        const start = now + i * (noteDuration + gap);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.linearRampToValueAtTime(0, start + noteDuration);
        osc.start(start);
        osc.stop(start + noteDuration);
      }

      const totalDuration = notes.length * (noteDuration + gap);
      return new Promise((resolve) =>
        setTimeout(resolve, totalDuration * 1000)
      );
    } catch {
      return Promise.resolve();
    }
  }

  playChomp() {
    if (!this._ctx) return;
    try {
      const freq = this._chompToggle ? 480 : 600;
      this._chompToggle = !this._chompToggle;
      const result = this._createOsc("square", freq, 0.15);
      if (!result) return;
      const { osc, gain } = result;
      const now = this._ctx.currentTime;
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }

  startSiren() {
    if (!this._ctx) return;
    this.stopSiren();
    try {
      let freqLow = true;
      this._sirenInterval = setInterval(() => {
        try {
          const freq = freqLow ? 220 : 340;
          freqLow = !freqLow;
          const result = this._createOsc("sawtooth", freq, 0.1);
          if (!result) return;
          const { osc, gain } = result;
          const now = this._ctx.currentTime;
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
        } catch {
          // ignore
        }
      }, 200);
    } catch {
      // ignore
    }
  }

  stopSiren() {
    if (this._sirenInterval !== null) {
      clearInterval(this._sirenInterval);
      this._sirenInterval = null;
    }
  }

  startFrightened() {
    if (!this._ctx) return;
    this.stopFrightened();
    try {
      let toggle = false;
      this._frightenedInterval = setInterval(() => {
        try {
          const freq = toggle ? 500 : 600;
          toggle = !toggle;
          const result = this._createOsc("square", freq, 0.1);
          if (!result) return;
          const { osc, gain } = result;
          const now = this._ctx.currentTime;
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } catch {
          // ignore
        }
      }, 120);
    } catch {
      // ignore
    }
  }

  stopFrightened() {
    if (this._frightenedInterval !== null) {
      clearInterval(this._frightenedInterval);
      this._frightenedInterval = null;
    }
  }

  playEatGhost() {
    if (!this._ctx) return;
    try {
      const result = this._createOsc("sine", 300, 0.25);
      if (!result) return;
      const { osc, gain } = result;
      const now = this._ctx.currentTime;
      osc.frequency.linearRampToValueAtTime(900, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // ignore
    }
  }

  playDeath() {
    if (!this._ctx) return;
    try {
      const now = this._ctx.currentTime;
      const steps = 12;
      const stepDuration = 1.5 / steps;
      let startFreq = 800;

      for (let i = 0; i < steps; i++) {
        const freq = startFreq * Math.pow(0.92, i);
        const result = this._createOsc("sawtooth", freq, 0.2);
        if (!result) continue;
        const { osc, gain } = result;
        const start = now + i * stepDuration;
        gain.gain.setValueAtTime(0.2 * (1 - i / steps), start);
        gain.gain.linearRampToValueAtTime(0, start + stepDuration);
        osc.start(start);
        osc.stop(start + stepDuration);
      }
    } catch {
      // ignore
    }
  }

  playFruit() {
    if (!this._ctx) return;
    try {
      const now = this._ctx.currentTime;
      const notes = [523.25, 659.25, 783.99];
      const dur = 0.05;

      for (let i = 0; i < notes.length; i++) {
        const result = this._createOsc("square", notes[i], 0.15);
        if (!result) continue;
        const { osc, gain } = result;
        const start = now + i * dur;
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.linearRampToValueAtTime(0, start + dur);
        osc.start(start);
        osc.stop(start + dur);
      }
    } catch {
      // ignore
    }
  }

  playExtraLife() {
    if (!this._ctx) return;
    try {
      const now = this._ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const dur = 0.12;
      const gap = 0.02;

      for (let i = 0; i < notes.length; i++) {
        const result = this._createOsc("square", notes[i], 0.2);
        if (!result) continue;
        const { osc, gain } = result;
        const start = now + i * (dur + gap);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.linearRampToValueAtTime(0, start + dur);
        osc.start(start);
        osc.stop(start + dur);
      }
    } catch {
      // ignore
    }
  }

  stopAll() {
    try {
      this.stopSiren();
      this.stopFrightened();
      for (const osc of this._activeOscillators) {
        try {
          osc.stop();
        } catch {
          // already stopped
        }
      }
      this._activeOscillators = [];
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
