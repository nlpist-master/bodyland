import * as THREE from 'three';
import { canvasTexture } from '../world/Materials.js';

// Little bursts of sparkles and dust. A fixed pool of sprites: nothing is
// created while playing, so bursts never cause a stutter.
const POOL = 40;
const COLORS = { gold: 0xffd23f, white: 0xffffff, pink: 0xff5fa2, teal: 0x2fd6c3 };

export class Effects {
  constructor(scene) {
    const tex = canvasTexture(32, 32, (g, w) => {
      const c = w / 2;
      const grad = g.createRadialGradient(c, c, 2, c, c, c);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, w);
    });
    this.mats = {};
    for (const k in COLORS) this.mats[k] = new THREE.SpriteMaterial({ map: tex, color: COLORS[k], transparent: true, depthWrite: false });
    this.bits = [];
    for (let i = 0; i < POOL; i++) {
      const s = new THREE.Sprite(this.mats.gold);
      s.visible = false;
      s.renderOrder = 4;
      scene.add(s);
      this.bits.push({ s, life: 0, vx: 0, vy: 0, vz: 0, size: 0, gravity: 0 });
    }
    this.next = 0;
  }

  /** n bits fly out from a point. */
  burst(x, y, z, { color = 'gold', n = 8, speed = 3, size = 0.28, gravity = 6, life = 0.55 } = {}) {
    for (let i = 0; i < n; i++) {
      const b = this.bits[this.next];
      this.next = (this.next + 1) % POOL;
      const a = Math.random() * Math.PI * 2;
      const up = Math.random();
      b.vx = Math.sin(a) * speed * (1 - up * 0.5);
      b.vz = Math.cos(a) * speed * (1 - up * 0.5);
      b.vy = up * speed;
      b.life = b.max = life * (0.7 + Math.random() * 0.3);
      b.size = size;
      b.gravity = gravity;
      b.s.material = this.mats[color];
      b.s.position.set(x, y, z);
      b.s.visible = true;
    }
  }

  dust(x, y, z, n = 6) {
    this.burst(x, y + 0.08, z, { color: 'white', n, speed: 1.8, size: 0.4, gravity: 1, life: 0.4 });
  }

  update(dt) {
    for (const b of this.bits) {
      if (b.life <= 0) continue;
      b.life -= dt;
      if (b.life <= 0) {
        b.s.visible = false;
        continue;
      }
      b.vy -= b.gravity * dt;
      b.s.position.x += b.vx * dt;
      b.s.position.y += b.vy * dt;
      b.s.position.z += b.vz * dt;
      b.s.scale.setScalar(b.size * (b.life / b.max));
    }
  }
}
