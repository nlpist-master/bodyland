import * as THREE from 'three';
import { ITEMS } from '../data/items.js';
import { toon, canvasTexture } from '../world/Materials.js';

// Things lying around a zone that the player collects by touching them:
// items (shown as a floating picture over a glowing ring) and coins.
// Pickups with a `key` are one-time (saved). Without a key they are
// renewable and come back next time the zone is loaded.

const iconCache = new Map();
/** Sprite material showing an item's picture (emoji drawn on a canvas). */
export function iconMaterial(id) {
  let m = iconCache.get(id);
  if (!m) {
    const tex = canvasTexture(128, 128, (g, w, h) => {
      const grad = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
      grad.addColorStop(0, 'rgba(255,255,255,0.95)');
      grad.addColorStop(0.55, 'rgba(255,255,255,0.75)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.font = '78px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(ITEMS[id].icon, w / 2, h / 2 + 6);
    });
    tex.userData.shared = true;
    m = new THREE.SpriteMaterial({ map: tex, depthWrite: false });
    m.userData.shared = true;
    iconCache.set(id, m);
  }
  return m;
}

let ringGeo = null;
let coinGeo = null;

export class Pickups {
  constructor(game) {
    this.game = game;
    this.items = [];
    this.coins = null;
  }

  clear() {
    this.items.length = 0;
    this.coins = null;
  }

  /** { key?, item, x, y, z, quiet?, onPick? } */
  add(ctx, o) {
    if (o.key && this.game.progress.data.picked[o.key]) return null;
    if (!ringGeo) {
      ringGeo = new THREE.TorusGeometry(0.42, 0.05, 6, 24);
      ringGeo.userData.shared = true;
    }
    const g = new THREE.Group();
    g.position.set(o.x, o.y ?? 0, o.z);
    const sprite = new THREE.Sprite(iconMaterial(o.item));
    sprite.scale.setScalar(0.95);
    sprite.position.y = 0.85;
    const ring = new THREE.Mesh(ringGeo, toon(0xffd23f, { emissive: 0xffb300, emissiveIntensity: 0.7 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.06;
    g.add(sprite, ring);
    ctx.root.add(g);
    const p = { ...o, y: o.y ?? 0, group: g, sprite, phase: Math.random() * 6, taken: false };
    this.items.push(p);
    return p;
  }

  /** A batch of one-time coins: list of [x, y, z]; keys are prefix + index. */
  addCoins(ctx, prefix, list) {
    if (!coinGeo) {
      coinGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 20);
      coinGeo.rotateX(Math.PI / 2);
      coinGeo.userData.shared = true;
    }
    const picked = this.game.progress.data.picked;
    const coins = list.map(([x, y, z], i) => ({ key: `${prefix}:c${i}`, x, y: y + 0.9, z, taken: !!picked[`${prefix}:c${i}`] }));
    const mesh = new THREE.InstancedMesh(coinGeo, toon(0xffd23f, { emissive: 0xffa000, emissiveIntensity: 0.35 }), coins.length);
    ctx.root.add(mesh);
    this.coins = { mesh, list: coins, m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1), p: new THREE.Vector3(), zero: new THREE.Vector3() };
  }

  _take(p) {
    const { inventory, audio, ui } = this.game;
    p.taken = true;
    p.group.removeFromParent();
    if (p.key) this.game.progress.data.picked[p.key] = true;
    inventory.add(p.item);
    audio.play('pickup');
    this.game.effects.burst(p.x, p.y + 0.85, p.z, { n: 8 });
    this.game.player.char.animator.land(2);
    const def = ITEMS[p.item];
    if (!p.quiet) ui.toast(`בתיק: ${def.icon} ${def.name}`, 'small');
    p.onPick?.(p);
  }

  update(dt, t) {
    const pos = this.game.player.pos;
    for (const p of this.items) {
      if (p.taken) continue;
      p.sprite.position.y = 0.85 + Math.sin(t * 2.5 + p.phase) * 0.12;
      p.group.rotation.y = t;
      const dx = pos.x - p.x, dz = pos.z - p.z, dy = pos.y - p.y;
      if (dx * dx + dz * dz < 1.0 && dy > -0.6 && dy < 1.6) this._take(p);
    }
    const c = this.coins;
    if (!c) return;
    c.q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, t * 3);
    const reach = this.game.progress.data.upgrades.magnet ? 9 : 0.9;
    for (let i = 0; i < c.list.length; i++) {
      const k = c.list[i];
      if (!k.taken) {
        const dx = pos.x - k.x, dz = pos.z - k.z, dy = pos.y + 0.9 - k.y;
        if (dx * dx + dz * dz < reach && Math.abs(dy) < 1.4) {
          k.taken = true;
          this.game.effects.burst(k.x, k.y, k.z, { n: 5, speed: 2 });
          this.game.progress.data.picked[k.key] = true;
          this.game.inventory.addCoins(1);
          this.game.audio.play('coin');
        }
      }
      c.p.set(k.x, k.y + Math.sin(t * 3 + i) * 0.08, k.z);
      c.mesh.setMatrixAt(i, c.m.compose(c.p, c.q, k.taken ? c.zero : c.s));
    }
    c.mesh.instanceMatrix.needsUpdate = true;
  }

  /** Nearest uncollected pickup of one of these items (for the minimap). */
  nearest(itemIds) {
    const pos = this.game.player.pos;
    let best = null, bestD = Infinity;
    for (const p of this.items) {
      if (p.taken || !itemIds.includes(p.item)) continue;
      const d = Math.hypot(p.x - pos.x, p.z - pos.z);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }
}
