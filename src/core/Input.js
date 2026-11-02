// Keyboard + mouse + touch input, merged into simple game actions.
// Keys use KeyboardEvent.code (physical position), so WASD works
// even when the keyboard is switched to Hebrew.
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'run', ShiftRight: 'run',
  Space: 'jump',
  KeyE: 'interact',
  Enter: 'confirm', NumpadEnter: 'confirm',
  KeyI: 'inventory',
  KeyJ: 'quests',
  KeyM: 'map',
  Escape: 'pause', KeyP: 'pause',
  KeyH: 'help',
};
const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
const TOUCH_LOOK_SCALE = 1.5;

/** Keep receiving a finger's moves even if it slides off the element. */
export function capturePointer(el, id) {
  try {
    el.setPointerCapture(id);
  } catch {
    // The pointer may already be gone; nothing to capture.
  }
}

export class Input {
  constructor(canvas) {
    this.codes = new Set();        // physical keys currently down
    this.virtual = new Set();      // actions held by on-screen buttons
    this.pressed = new Set();      // actions pressed this frame
    this.stick = { x: 0, y: 0, active: false };
    this.runToggle = false;
    this.lookX = 0;
    this.lookY = 0;
    this.zoom = 0;
    this._mouse = null;
    this._touch = null;
    this._move = { x: 0, y: 0 };

    window.addEventListener('keydown', (e) => this._key(e, true));
    window.addEventListener('keyup', (e) => this._key(e, false));
    window.addEventListener('blur', () => {
      this.codes.clear();
      this.virtual.clear();
    });

    canvas.addEventListener('pointerdown', (e) => this._down(e, canvas));
    canvas.addEventListener('pointermove', (e) => this._moveLook(e));
    canvas.addEventListener('pointerup', (e) => this._up(e));
    canvas.addEventListener('pointercancel', (e) => this._up(e));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom += Math.sign(e.deltaY);
    }, { passive: false });
  }

  _key(e, down) {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (PREVENT.has(e.code)) e.preventDefault();
    if (down) {
      if (!e.repeat) this.pressed.add(action);
      this.codes.add(e.code);
    } else {
      this.codes.delete(e.code);
    }
  }

  _down(e, canvas) {
    if (e.pointerType === 'mouse') {
      this._mouse = { id: e.pointerId, x: e.clientX, y: e.clientY };
    } else if (!this._touch) {
      this._touch = { id: e.pointerId, x: e.clientX, y: e.clientY };
    } else {
      return;
    }
    capturePointer(canvas, e.pointerId);
  }

  _moveLook(e) {
    const p = this._mouse?.id === e.pointerId ? this._mouse : this._touch?.id === e.pointerId ? this._touch : null;
    if (!p) return;
    const scale = p === this._touch ? TOUCH_LOOK_SCALE : 1;
    this.lookX += (e.clientX - p.x) * scale;
    this.lookY += (e.clientY - p.y) * scale;
    p.x = e.clientX;
    p.y = e.clientY;
  }

  _up(e) {
    if (this._mouse?.id === e.pointerId) this._mouse = null;
    if (this._touch?.id === e.pointerId) this._touch = null;
  }

  isHeld(action) {
    if (this.virtual.has(action)) return true;
    for (const code of this.codes) if (KEYMAP[code] === action) return true;
    return false;
  }

  /** Returns true once per press. */
  consume(action) {
    return this.pressed.delete(action);
  }

  /** On-screen buttons call this to act like a key. */
  pressVirtual(action) {
    this.pressed.add(action);
    this.virtual.add(action);
  }

  releaseVirtual(action) {
    this.virtual.delete(action);
  }

  /** Movement as {x: right, y: forward}, length 0..1. */
  getMove() {
    const m = this._move;
    if (this.stick.active) {
      m.x = this.stick.x;
      m.y = this.stick.y;
    } else {
      m.x = (this.isHeld('right') ? 1 : 0) - (this.isHeld('left') ? 1 : 0);
      m.y = (this.isHeld('up') ? 1 : 0) - (this.isHeld('down') ? 1 : 0);
    }
    const len = Math.hypot(m.x, m.y);
    if (len > 1) {
      m.x /= len;
      m.y /= len;
    }
    return m;
  }

  isRunning() {
    return this.runToggle || this.isHeld('run');
  }

  consumeLook() {
    const out = { x: this.lookX, y: this.lookY };
    this.lookX = 0;
    this.lookY = 0;
    return out;
  }

  consumeZoom() {
    const z = this.zoom;
    this.zoom = 0;
    return z;
  }

  /** Presses not handled this frame are dropped so they can't fire later. */
  endFrame() {
    this.pressed.clear();
  }
}
