// Procedural animation: each state produces a target pose, and the
// current pose eases toward it, so transitions are always smooth.
//
// Rotation signs (character faces +Z): negative X swings a limb forward,
// +Z lifts the left arm (+X side) outward, -Z lifts the right arm outward.

const KEYS = ['bodyY', 'bodyRotY', 'torsoX', 'torsoZ', 'headX', 'headY', 'headZ', 'armLX', 'armLZ', 'armRX', 'armRZ', 'legLX', 'legRX'];

export class Animator {
  constructor(parts) {
    this.p = parts;
    this.cur = {};
    this.tgt = {};
    for (const k of KEYS) this.cur[k] = this.tgt[k] = 0;
    this.time = Math.random() * 10;
    this.phase = 0;
    this.squash = 0;
    this.blink = 2 + Math.random() * 3;
    this.swingAng = 0;
    this.swingVel = 0;
    this.lastSin = 0;
    this.onStep = null;
  }

  /** Squash on landing, scaled by impact speed. */
  land(impact) {
    this.squash = Math.min(0.28, 0.06 + impact * 0.018);
  }

  update(dt, state, speed = 0, vy = 0) {
    const t = this.tgt;
    for (const k of KEYS) t[k] = 0;
    this.time += dt;
    const time = this.time;
    let moving = 0;

    switch (state) {
      case 'idle': {
        const b = Math.sin(time * 2.2);
        t.bodyY = b * 0.008;
        t.armLZ = 0.12 + b * 0.03;
        t.armRZ = -0.12 - b * 0.03;
        t.headY = Math.sin(time * 0.5) * Math.sin(time * 0.23) * 0.5;
        t.headX = Math.sin(time * 0.9) * 0.04;
        break;
      }
      case 'walk':
      case 'run': {
        const run = state === 'run';
        const stride = run ? 1.25 : 0.85;
        this.phase += dt * (speed / stride) * Math.PI;
        const s = Math.sin(this.phase);
        const amp = run ? 0.95 : 0.6;
        t.legLX = s * amp;
        t.legRX = -s * amp;
        t.armLX = -s * amp * 0.85;
        t.armRX = s * amp * 0.85;
        t.armLZ = run ? 0.25 : 0.1;
        t.armRZ = run ? -0.25 : -0.1;
        t.bodyY = Math.abs(Math.cos(this.phase)) * (run ? 0.07 : 0.04);
        t.bodyRotY = s * (run ? 0.12 : 0.07);
        t.torsoX = run ? 0.2 : 0.06;
        t.headX = run ? -0.12 : -0.03;
        if (Math.sign(s) !== Math.sign(this.lastSin)) this.onStep?.(run);
        this.lastSin = s;
        moving = run ? 1 : 0.6;
        break;
      }
      case 'jump':
        t.legLX = -0.8;
        t.legRX = 0.25;
        t.armLZ = 2.3;
        t.armRZ = -2.3;
        t.armLX = -0.3;
        t.armRX = -0.3;
        t.torsoX = -0.08;
        t.headX = -0.15;
        break;
      case 'fall': {
        const f = time * 16;
        t.armLZ = 1.5 + Math.sin(f) * 0.35;
        t.armRZ = -1.5 - Math.sin(f + 1.3) * 0.35;
        t.legLX = -0.35 + Math.sin(f * 0.8) * 0.3;
        t.legRX = 0.25 - Math.sin(f * 0.8) * 0.3;
        t.headX = 0.1;
        break;
      }
      case 'climb': {
        this.phase += dt * Math.abs(vy) * 3.2;
        const c = Math.sin(this.phase);
        t.armLX = -2.6 + c * 0.4;
        t.armRX = -2.6 - c * 0.4;
        t.armLZ = 0.15;
        t.armRZ = -0.15;
        t.legLX = -0.7 + c * 0.45;
        t.legRX = -0.7 - c * 0.45;
        t.headX = -0.25;
        break;
      }
      case 'wave': {
        const b = Math.sin(time * 2.2);
        t.armRZ = -2.6 + Math.sin(time * 9) * 0.35;
        t.armLZ = 0.15 + b * 0.03;
        t.headZ = 0.12;
        t.headY = 0;
        t.bodyY = Math.abs(Math.sin(time * 4.5)) * 0.03;
        break;
      }
      case 'use': {
        // Reaching out with both hands, a little busy: pressing, turning.
        const u = Math.sin(time * 12);
        t.armLX = -1.5 + u * 0.15;
        t.armRX = -1.5 - u * 0.15;
        t.armLZ = 0.12;
        t.armRZ = -0.12;
        t.torsoX = 0.14;
        t.headX = 0.12;
        break;
      }
      case 'dance': {
        const d = time * 7;
        t.bodyY = Math.abs(Math.sin(d)) * 0.13;
        t.bodyRotY = Math.sin(d * 0.5) * 0.7;
        t.armLZ = 2.4 + Math.sin(d) * 0.4;
        t.armRZ = -2.4 + Math.sin(d) * 0.4;
        t.legLX = Math.max(0, Math.sin(d)) * -0.5;
        t.legRX = Math.max(0, -Math.sin(d)) * -0.5;
        t.headZ = Math.sin(d * 0.5) * 0.2;
        break;
      }
    }

    const k = 1 - Math.exp(-14 * dt);
    const cur = this.cur;
    for (const key of KEYS) cur[key] += (t[key] - cur[key]) * k;

    this.squash *= Math.exp(-9 * dt);
    const p = this.p;
    p.body.position.y = cur.bodyY;
    p.body.rotation.y = cur.bodyRotY;
    p.body.scale.set(1 + this.squash * 0.6, 1 - this.squash, 1 + this.squash * 0.6);
    p.torso.rotation.set(cur.torsoX, 0, cur.torsoZ);
    p.head.rotation.set(cur.headX, cur.headY, cur.headZ);
    p.armL.rotation.set(cur.armLX, 0, cur.armLZ);
    p.armR.rotation.set(cur.armRX, 0, cur.armRZ);
    p.legL.rotation.x = cur.legLX;
    p.legR.rotation.x = cur.legRX;

    // Braids, ponytail, skirt and tzitzit follow with a little spring.
    const target = -vy * 0.035 + Math.sin(this.phase) * 0.18 * moving + (moving ? 0.15 : 0);
    this.swingVel += (target - this.swingAng) * 90 * dt;
    this.swingVel *= Math.exp(-7 * dt);
    this.swingAng += this.swingVel * dt;
    for (const s of p.swing) {
      const a = s.base + this.swingAng * s.amount;
      if (s.axis === 'x') s.obj.rotation.x = a;
      else s.obj.rotation.z = Math.sin(this.phase) * s.amount * moving;
    }

    // Blink every few seconds.
    this.blink -= dt;
    const closed = this.blink < 0.12;
    if (this.blink < 0) this.blink = 2 + Math.random() * 3.5;
    for (const e of p.eyes) e.scale.y = closed ? 0.15 : 1;
  }
}
