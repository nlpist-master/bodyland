import * as THREE from 'three';
import { toon } from '../world/Materials.js';

// Timed challenges: pass through rings in order, or collect pickups,
// before the clock runs out. A start pad in the zone begins the run.
let ringGeo = null;

export class Challenge {
  constructor(game) {
    this.game = game;
    this.active = null;
    this.el = document.createElement('div');
    this.el.className = 'timer hidden';
    document.getElementById('ui').appendChild(this.el);
  }

  clear() {
    if (this.active) this._end(null);
  }

  /** A glowing pad that starts a challenge when used. */
  pad(ctx, { x, z, label, enabled = () => true, start }) {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 28), toon(0x2fd6c3, { emissive: 0x2fd6c3, emissiveIntensity: 0.5 }));
    pad.position.set(x, 0.06, z);
    ctx.root.add(pad);
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 4), toon(0xffd23f, { emissive: 0xffb300, emissiveIntensity: 0.5 }));
    flag.position.set(x, 1.6, z);
    flag.rotation.z = Math.PI;
    ctx.root.add(flag);
    const item = ctx.interactions.add({
      position: new THREE.Vector3(x, 0, z),
      radius: 1.8,
      label,
      onInteract: () => {
        if (!this.active) start();
      },
    });
    return {
      update: (t) => {
        const on = enabled() && !this.active;
        item.enabled = on;
        pad.visible = flag.visible = on;
        flag.position.y = 1.6 + Math.sin(t * 3) * 0.15;
        flag.rotation.y = t * 2;
      },
    };
  }

  /**
   * rings: [[x, y, z], ...] in order. seconds: time limit.
   * onWin / onFail are called at the end.
   */
  rings(ctx, { rings, seconds, title, onWin, onFail }) {
    if (!ringGeo) {
      ringGeo = new THREE.TorusGeometry(1.3, 0.14, 8, 28);
      ringGeo.userData.shared = true;
    }
    const meshes = rings.map(([x, y, z], i) => {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffd23f }));
      m.position.set(x, y, z);
      const next = rings[i + 1] || rings[i - 1];
      m.rotation.y = Math.atan2(next[0] - x, next[2] - z);
      ctx.root.add(m);
      return m;
    });
    this._begin({ kind: 'rings', ctx, rings, meshes, index: 0, seconds, title, onWin, onFail });
  }

  /** Collect `count` pickups (created by the caller) in time; call hit() per pickup. */
  collect({ count, seconds, title, onWin, onFail, cleanup }) {
    this._begin({ kind: 'collect', count, got: 0, seconds, title, onWin, onFail, cleanup });
    return () => {
      if (!this.active) return;
      this.active.got++;
      this.game.audio.play('tick');
      if (this.active.got >= this.active.count) this._end(true);
    };
  }

  _begin(c) {
    c.left = c.seconds;
    this.active = c;
    this.el.classList.remove('hidden');
    this.game.audio.play('quest');
    this.game.ui.toast(c.title + ': צאו לדרך!', 'quest');
    this._render();
  }

  _render() {
    const c = this.active;
    const s = Math.max(0, Math.ceil(c.left));
    const done = c.kind === 'rings' ? `${c.index}/${c.rings.length}` : `${c.got}/${c.count}`;
    this.el.textContent = `⏱ ${s}  ·  ${done}`;
    this.el.classList.toggle('hurry', c.left < 8);
  }

  _end(win) {
    const c = this.active;
    this.active = null;
    this.el.classList.add('hidden');
    if (c.meshes) for (const m of c.meshes) {
      m.removeFromParent();
      m.material.dispose();
    }
    c.cleanup?.();
    if (win === true) c.onWin?.();
    else if (win === false) {
      this.game.audio.play('fail');
      this.game.ui.toast('כמעט! הזמן נגמר. נסו שוב מנקודת הזינוק.');
      c.onFail?.();
    }
  }

  update(dt) {
    const c = this.active;
    if (!c) return;
    c.left -= dt;
    if (c.kind === 'rings') {
      const p = this.game.player.pos;
      const [x, y, z] = c.rings[c.index];
      c.meshes.forEach((m, i) => {
        m.material.color.set(i < c.index ? 0x4cbf5a : i === c.index ? 0xffd23f : 0xffffff);
        m.scale.setScalar(i === c.index ? 1 + Math.sin(c.left * 8) * 0.06 : 0.85);
      });
      if (Math.hypot(p.x - x, p.y + 0.8 - y, p.z - z) < 1.5) {
        c.index++;
        this.game.audio.play('tick');
        if (c.index >= c.rings.length) {
          this._end(true);
          return;
        }
      }
    }
    if (c.left <= 0) {
      this._end(false);
      return;
    }
    this._render();
  }
}
