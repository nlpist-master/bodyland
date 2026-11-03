import { ICONS } from './icons.js';
import { capturePointer, RUN_PUSH } from '../core/Input.js';

// On-screen controls for phones and tablets: a floating joystick on the
// right (the main hand), jump and action buttons on the left. Pushing the
// joystick all the way runs. Swiping anywhere else turns the camera.
const STICK_R = 55;

export class TouchControls {
  constructor(input, enabled) {
    this.input = input;
    this.enabled = enabled;
    this.wanted = false;
    this.joyId = null;

    const el = (this.el = document.createElement('div'));
    el.className = 'touch hidden';
    el.innerHTML = `
      <div class="joy-zone"><div class="joy-base"><div class="joy-knob"></div></div></div>
      <button class="tbtn tbtn-act" aria-label="פעולה">${ICONS.act}<span>פעולה</span></button>
      <button class="tbtn tbtn-jump" aria-label="קפיצה">${ICONS.jump}<span>קפיצה</span></button>`;
    document.getElementById('ui').appendChild(el);

    this.zone = el.querySelector('.joy-zone');
    this.base = el.querySelector('.joy-base');
    this.knob = el.querySelector('.joy-knob');
    this.actBtn = el.querySelector('.tbtn-act');
    this.actLabel = this.actBtn.querySelector('span');

    this._bindStick();
    this._bindHold(el.querySelector('.tbtn-jump'), 'jump');
    this._bindHold(this.actBtn, 'interact');

    // A touch on a computer with a touch screen turns these controls on.
    if (!enabled) {
      window.addEventListener('touchstart', () => {
        this.enabled = true;
        this.setVisible(this.wanted);
      }, { once: true, passive: true });
    }
  }

  _bindHold(btn, action) {
    const up = () => {
      btn.classList.remove('down');
      this.input.releaseVirtual(action);
    };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      capturePointer(btn, e.pointerId);
      btn.classList.add('down');
      this.input.pressVirtual(action);
    });
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
  }

  _bindStick() {
    const z = this.zone;
    z.addEventListener('pointerdown', (e) => {
      if (this.joyId !== null) return;
      e.preventDefault();
      this.joyId = e.pointerId;
      capturePointer(z, e.pointerId);
      const r = z.getBoundingClientRect();
      this.cx = e.clientX;
      this.cy = e.clientY;
      this.base.style.left = e.clientX - r.left + 'px';
      this.base.style.top = e.clientY - r.top + 'px';
      this.base.classList.add('active');
      this._moveStick(e);
    });
    z.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.joyId) this._moveStick(e);
    });
    const end = (e) => {
      if (e.pointerId === this.joyId) this._resetStick();
    };
    z.addEventListener('pointerup', end);
    z.addEventListener('pointercancel', end);
  }

  _moveStick(e) {
    let dx = e.clientX - this.cx;
    let dy = e.clientY - this.cy;
    const len = Math.hypot(dx, dy);
    if (len > STICK_R) {
      dx *= STICK_R / len;
      dy *= STICK_R / len;
    }
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.base.classList.toggle('run', Math.hypot(dx, dy) >= STICK_R * RUN_PUSH);
    const s = this.input.stick;
    s.x = dx / STICK_R;
    s.y = -dy / STICK_R;
    s.active = true;
  }

  _resetStick() {
    this.joyId = null;
    this.base.style.left = '';
    this.base.style.top = '';
    this.base.classList.remove('active', 'run');
    this.knob.style.transform = '';
    const s = this.input.stick;
    s.x = s.y = 0;
    s.active = false;
  }

  setVisible(v) {
    this.wanted = v;
    this.el.classList.toggle('hidden', !(v && this.enabled));
    if (!v) this._resetStick();
  }

  /** Lights up the action button when something can be used. */
  setInteract(label) {
    this.actBtn.classList.toggle('ready', !!label);
    this.actLabel.textContent = label ? 'פעולה!' : 'פעולה';
  }
}
