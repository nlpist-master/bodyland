import * as THREE from 'three';
import * as P from './Props.js';
import * as S from './Structures.js';
import { toon } from './Materials.js';

// Giant fruit and vegetables built from simple shapes (used in the jungle,
// and later as big decorations elsewhere). Each adds its own collider.

/** A group of static parts at (x, 0, z) plus a round collider. */
export function thing(ctx, x, z, r, h) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  ctx.root.add(g);
  if (r) ctx.collision.addCylinder({ x, z, r, minY: 0, maxY: h });
  return (geo, color, px, py, pz, sx = 1, sy = sx, sz = sx, opts) => {
    const m = S.part(g, geo, toon(color, opts), px, py, pz);
    m.scale.set(sx, sy, sz);
    return m;
  };
}

export const FRUIT = {
  apple(ctx, x, z, s = 1.6) {
    const add = thing(ctx, x, z, s * 0.95, s * 2);
    add(P.GEO.sphere, 0xff4d4d, 0, s, 0, s, s * 0.92, s);
    add(P.GEO.cyl, 0x6b3e26, 0, s * 1.95, 0, 0.08 * s, 0.4 * s, 0.08 * s);
    add(P.GEO.sphere, 0x4cbf5a, 0.25 * s, s * 2.05, 0, 0.3 * s, 0.1 * s, 0.16 * s);
  },
  orange(ctx, x, z, s = 1.5) {
    const add = thing(ctx, x, z, s * 0.95, s * 2);
    add(P.GEO.sphere, 0xff9b2f, 0, s, 0, s);
    add(P.GEO.sphere, 0x4cbf5a, 0, s * 1.98, 0, 0.25 * s, 0.08 * s, 0.25 * s);
  },
  pear(ctx, x, z, s = 1.4) {
    const add = thing(ctx, x, z, s * 0.95, s * 2.6);
    add(P.GEO.sphere, 0xc6e04a, 0, s, 0, s, s * 0.95, s);
    add(P.GEO.sphere, 0xc6e04a, 0, s * 1.9, 0, s * 0.62);
    add(P.GEO.cyl, 0x6b3e26, 0, s * 2.6, 0, 0.07 * s, 0.35 * s, 0.07 * s);
  },
  strawberry(ctx, x, z, s = 1.4) {
    const add = thing(ctx, x, z, s * 0.9, s * 2.2);
    const body = new THREE.Mesh(new THREE.ConeGeometry(s, s * 1.8, 18), toon(0xff3b5c));
    body.rotation.x = Math.PI;
    body.position.set(x, s * 0.9 + 0.1, z);
    body.userData.bake = true;
    body.castShadow = true;
    ctx.root.add(body);
    add(P.GEO.sphere, 0xff3b5c, 0, s * 1.75, 0, s * 0.98, s * 0.4, s * 0.98);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      add(P.GEO.sphere, 0x4cbf5a, Math.sin(a) * s * 0.45, s * 2.05, Math.cos(a) * s * 0.45, s * 0.35, s * 0.08, s * 0.18);
    }
    for (let i = 0; i < 10; i++) {
      const a = i * 2.4, y = s * (0.6 + (i % 3) * 0.35);
      const r = s * (y / (s * 1.8));
      add(P.GEO.sphere, 0xfff3b0, Math.sin(a) * r, y, Math.cos(a) * r, 0.06 * s, 0.09 * s, 0.06 * s);
    }
  },
  watermelon(ctx, x, z, rotY = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    ctx.root.add(g);
    const half = (r, color) => {
      const m = S.part(g, new THREE.CylinderGeometry(r, r, 0.9, 24, 1, false, 0, Math.PI), toon(color), 0, 0, 0);
      m.rotation.z = Math.PI / 2;
      m.rotation.y = Math.PI / 2;
      return m;
    };
    half(2.2, 0x3f9a3f);
    half(2.0, 0xfff1d6).scale.y = 1.02;
    half(1.85, 0xff4d6d).scale.y = 1.04;
    for (let i = 0; i < 6; i++) {
      const a = (i / 5) * Math.PI;
      S.part(g, P.GEO.sphere, toon(0x2a1b2e), Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0.48).scale.set(0.08, 0.12, 0.05);
    }
    const [cx, cz] = S.frame(x, z, rotY)(0, 0);
    ctx.collision.addBox({ x: cx, z: cz, w: 4.4, d: 1, rotY, minY: 0, maxY: 2.2 });
  },
  grapes(ctx, x, z) {
    const add = thing(ctx, x, z, 1.1, 3.2);
    let i = 0;
    for (let row = 0; row < 4; row++) {
      const n = 4 - row;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + row;
        add(P.GEO.lowSphere, i++ % 2 ? 0x8e44ad : 0x9b59b6, Math.sin(a) * 0.25 * n, 2.6 - row * 0.55, Math.cos(a) * 0.25 * n, 0.42);
      }
    }
    add(P.GEO.cyl, 0x6b3e26, 0, 3.2, 0, 0.08, 0.6, 0.08);
    add(P.GEO.sphere, 0x4cbf5a, 0.4, 3.3, 0, 0.5, 0.1, 0.35);
    add(P.GEO.cyl, 0x6b3e26, 0, 0.6, 0, 0.12, 1.2, 0.12);
  },
  banana(ctx, x, z, rotY = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    ctx.root.add(g);
    for (let i = 0; i < 3; i++) {
      const b = S.part(g, new THREE.TorusGeometry(1.6, 0.32, 10, 20, Math.PI * 0.75), toon(0xffe14d), (i - 1) * 0.55, 1.9, 0);
      b.rotation.set(0, Math.PI / 2, Math.PI * 1.12);
    }
    ctx.collision.addCylinder({ x, z, r: 1.2, minY: 0, maxY: 1.6 });
  },
  carrots(ctx, x, z) {
    for (let i = 0; i < 5; i++) {
      const cx = x + (i % 3) * 1.4 - 1.4, cz = z + Math.floor(i / 3) * 1.6;
      const add = thing(ctx, cx, cz, 0.45, 1.6);
      add(P.GEO.sphere, 0xff8c2f, 0, 0.25, 0, 0.45, 0.35, 0.45);
      for (let k = 0; k < 3; k++) {
        const leaf = add(P.GEO.sphere, 0x4cbf5a, (k - 1) * 0.15, 0.9, 0, 0.1, 0.55, 0.1);
        leaf.rotation.z = (k - 1) * 0.4;
      }
    }
  },
  broccoli(ctx, x, z, s = 1.2) {
    const add = thing(ctx, x, z, 0.4 * s, 4 * s);
    add(P.GEO.cyl, 0x9ccc65, 0, 1.2 * s, 0, 0.35 * s, 2.4 * s, 0.35 * s);
    for (const [px, py, pz, r] of [[0, 3.1, 0, 1.1], [0.9, 2.7, 0.3, 0.8], [-0.9, 2.7, -0.2, 0.85], [0.2, 2.6, 0.9, 0.75], [-0.2, 2.6, -0.9, 0.75]]) {
      add(P.GEO.lowSphere, py > 3 ? 0x2e8b3a : 0x3fa34d, px * s, py * s, pz * s, r * s);
    }
  },
  eggplant(ctx, x, z) {
    const add = thing(ctx, x, z, 0.9, 3);
    add(P.GEO.sphere, 0x6a2c91, 0, 1.0, 0, 0.95, 1.1, 0.95);
    add(P.GEO.sphere, 0x6a2c91, 0, 2.0, 0, 0.6, 0.8, 0.6);
    add(P.GEO.sphere, 0x4cbf5a, 0, 2.7, 0, 0.45, 0.15, 0.45);
    add(P.GEO.cyl, 0x4cbf5a, 0, 3.0, 0, 0.08, 0.4, 0.08);
  },
};
