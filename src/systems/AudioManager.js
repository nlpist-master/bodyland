// All sound effects are synthesized with the Web Audio API:
// no audio files to download, nothing to wait for.
export class AudioManager {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this._lastStep = 0;
    const unlock = () => {
      if (!this._ensure()) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
    };
    for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, unlock, { passive: true });
  }

  _ensure() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 0.55 : 0;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, len);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return true;
  }

  /** While the game is in the background, nothing should keep sounding. */
  setSuspended(on) {
    if (!this.ctx) return;
    if (on) this.ctx.suspend();
    else this.ctx.resume();
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? 0.55 : 0;
  }

  _tone(type, f0, f1, dur, vol, when = 0) {
    const c = this.ctx;
    const t = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  _noise(dur, vol, type, freq, when = 0, freqEnd) {
    const c = this.ctx;
    const t = c.currentTime + when;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  play(name, amount = 1) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    switch (name) {
      case 'jump':
        this._tone('triangle', 330, 720, 0.16, 0.22);
        break;
      case 'land':
        this._noise(0.14, 0.35 * amount, 'lowpass', 500);
        this._tone('sine', 120, 60, 0.12, 0.25 * amount);
        break;
      case 'step': {
        const now = this.ctx.currentTime;
        if (now - this._lastStep < 0.12) return;
        this._lastStep = now;
        this._noise(0.05, 0.05 * amount, 'bandpass', 900 + Math.random() * 500);
        break;
      }
      case 'boing':
        this._tone('sine', 180, 620, 0.35, 0.3);
        this._tone('triangle', 260, 900, 0.3, 0.12, 0.03);
        break;
      case 'click':
        this._tone('sine', 880, 660, 0.07, 0.15);
        break;
      case 'lever':
        this._tone('square', 140, 90, 0.12, 0.12);
        this._noise(0.1, 0.2, 'highpass', 2000);
        break;
      case 'gate':
        this._tone('sawtooth', 90, 45, 1.1, 0.1);
        this._noise(1.1, 0.12, 'lowpass', 400, 0, 120);
        break;
      case 'secret':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this._tone('sine', f, 0, 0.35, 0.16, i * 0.08));
        break;
      case 'success':
        [523, 659, 784].forEach((f, i) => this._tone('triangle', f, 0, 0.25, 0.18, i * 0.1));
        this._tone('triangle', 1047, 0, 0.5, 0.2, 0.3);
        break;
      case 'whoosh':
        this._noise(0.5, 0.25, 'bandpass', 1800, 0, 300);
        break;
      case 'select':
        this._tone('triangle', 660, 990, 0.12, 0.16);
        break;
      case 'talk':
        for (let i = 0; i < 4; i++) {
          const f = 420 + Math.random() * 380;
          this._tone('square', f, f * 1.1, 0.05, 0.05, i * 0.07);
        }
        break;
      case 'pickup':
        this._tone('triangle', 660, 1320, 0.12, 0.18);
        this._tone('sine', 990, 1480, 0.15, 0.12, 0.06);
        break;
      case 'coin':
        this._tone('square', 988, 0, 0.06, 0.08);
        this._tone('square', 1319, 0, 0.18, 0.08, 0.06);
        break;
      case 'quest':
        [392, 523, 659].forEach((f, i) => this._tone('triangle', f, 0, 0.22, 0.16, i * 0.09));
        break;
      case 'step-done':
        this._tone('triangle', 784, 0, 0.12, 0.16);
        this._tone('triangle', 1047, 0, 0.25, 0.16, 0.1);
        break;
      case 'machine':
        this._tone('sawtooth', 80, 220, 0.8, 0.12);
        this._tone('sine', 440, 880, 0.6, 0.12, 0.3);
        this._noise(0.5, 0.12, 'bandpass', 1200, 0, 400);
        break;
      case 'fail':
        this._tone('triangle', 330, 220, 0.25, 0.16);
        this._tone('triangle', 262, 196, 0.35, 0.14, 0.18);
        break;
      case 'badge':
        [659, 880, 1175].forEach((f, i) => this._tone('sine', f, 0, 0.3, 0.14, i * 0.07));
        break;
      case 'tick':
        this._tone('sine', 1200, 1600, 0.08, 0.15);
        break;
      case 'build':
        this._noise(0.12, 0.3, 'lowpass', 900);
        this._tone('square', 200, 120, 0.1, 0.1);
        break;
      case 'portal':
        this._tone('sine', 300, 1200, 0.6, 0.18);
        this._tone('triangle', 450, 1800, 0.5, 0.1, 0.08);
        this._noise(0.6, 0.15, 'bandpass', 600, 0, 3000);
        break;
    }
  }
}
