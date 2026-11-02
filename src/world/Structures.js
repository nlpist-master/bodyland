import * as THREE from 'three';
import * as P from './Props.js';
import { toon, canvasTexture, labelTexture } from './Materials.js';

// Bigger reusable pieces for zones: portals, houses, rooms you can walk
// into, lamps, trees, fences, water, rails and pipes. Like Props, every
// piece adds its own colliders.

/** Converts local (lx, lz) around (x, z, rotY) to world [x, z]. */
export function frame(x, z, rotY = 0) {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
}

/** A mesh that stays still forever (merged by Bake.js). */
export function part(parent, geo, mat, x = 0, y = 0, z = 0, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  m.userData.bake = true;
  parent.add(m);
  return m;
}

const geoCache = new Map();
function cached(key, make) {
  let g = geoCache.get(key);
  if (!g) {
    g = make();
    g.userData.shared = true;
    geoCache.set(key, g);
  }
  return g;
}

let swirlTex = null;
function swirlTexture() {
  if (!swirlTex) {
    swirlTex = canvasTexture(128, 128, (g, w, h) => {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) {
        g.strokeStyle = `rgba(160,140,255,${0.25 + (i % 3) * 0.2})`;
        g.lineWidth = 6 + (i % 4) * 3;
        g.beginPath();
        for (let x = -10; x <= w + 10; x += 4) {
          const y = (i / 9) * h + Math.sin((x / w) * Math.PI * 2 + i) * 10;
          x === -10 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }
    });
    swirlTex.wrapS = swirlTex.wrapT = THREE.RepeatWrapping;
    swirlTex.userData.shared = true;
  }
  return swirlTex;
}

function archShape(halfW, straight) {
  const s = new THREE.Shape();
  s.moveTo(-halfW, 0);
  s.lineTo(halfW, 0);
  s.lineTo(halfW, straight);
  s.absarc(0, straight, halfW, 0, Math.PI, false);
  s.lineTo(-halfW, 0);
  return s;
}

/**
 * Glowing gate to another zone. Faces local +z. Walking into it calls onEnter.
 * Returns { group, update(t) }.
 */
export function portal(ctx, { x, z, rotY = 0, color = 0x9b7bff, label, bg = '#7e57c2', to, onEnter }) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  ctx.root.add(g);
  const L = frame(x, z, rotY);
  const stone = toon(color);
  const trim = toon(0xffffff);

  part(g, P.GEO.box, toon(0xf3e9ff), 0, 0.075, 0).scale.set(4.6, 0.15, 2.4);
  for (const side of [-1, 1]) {
    part(g, P.GEO.cyl, stone, side * 1.65, 1.8, 0).scale.set(0.38, 3.6, 0.38);
    part(g, P.GEO.sphere, trim, side * 1.65, 0.25, 0).scale.set(0.5, 0.3, 0.5);
    const [wx, wz] = L(side * 1.65, 0);
    ctx.collision.addCylinder({ x: wx, z: wz, r: 0.4, minY: 0, maxY: 5.4 });
  }
  const arch = part(g, cached('portalArch', () => new THREE.TorusGeometry(1.65, 0.36, 10, 30, Math.PI)), stone, 0, 3.6, 0);
  arch.scale.z = 1.05;
  part(g, P.GEO.sphere, toon(0xffd23f, { emissive: 0xffb300, emissiveIntensity: 0.6 }), 0, 5.3, 0).scale.setScalar(0.32);

  const tex = swirlTexture().clone();
  tex.userData = {}; // the clone belongs to this zone and is freed with it
  tex.repeat.set(0.45, 0.3);
  tex.needsUpdate = true;
  const film = new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthWrite: false });
  const disk = new THREE.Mesh(cached('portalDisk', () => new THREE.ShapeGeometry(archShape(1.28, 3.6), 16)), film);
  disk.position.y = 0.15;
  g.add(disk);

  if (label) {
    const ltex = labelTexture(label, { bg });
    const lmat = new THREE.MeshBasicMaterial({ map: ltex, transparent: true });
    for (const back of [0, 1]) {
      const board = new THREE.Mesh(cached('portalBoard', () => new THREE.PlaneGeometry(3.4, 1.06)), lmat);
      board.position.set(0, 6.25, back ? -0.05 : 0.05);
      board.rotation.y = back * Math.PI;
      g.add(board);
    }
  }

  // Thin wall in the opening: keeps the camera out of the swirl. Walking
  // into it still reaches the trigger, which is wider than the wall.
  ctx.collision.addBox({ x, z, w: 2.6, d: 0.2, rotY, minY: 0, maxY: 5 });
  ctx.interactions.addTrigger({ x, z, r: 1.05, minY: -1, maxY: 3, onEnter });
  ctx.portals?.push({ x, z, to });
  ctx.markers?.push({ x, z, color: '#b39dff' });
  return {
    group: g,
    update(t) {
      tex.offset.y = -t * 0.35;
      tex.offset.x = Math.sin(t * 0.7) * 0.1;
      film.opacity = 0.8 + Math.sin(t * 3) * 0.08;
    },
  };
}

function roofGeometry(w, d, rise) {
  const hw = w / 2, hd = d / 2;
  const v = [
    -hw, 0, hd, hw, 0, hd, 0, rise, hd, // front gable
    hw, 0, -hd, -hw, 0, -hd, 0, rise, -hd, // back gable
    -hw, 0, hd, 0, rise, hd, 0, rise, -hd, -hw, 0, hd, 0, rise, -hd, -hw, 0, -hd, // left slope
    hw, 0, hd, hw, 0, -hd, 0, rise, -hd, hw, 0, hd, 0, rise, -hd, 0, rise, hd, // right slope
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((v.length / 3) * 2).fill(0), 2));
  g.computeVertexNormals();
  return g;
}

/** Closed house with a gable roof, a door and windows on its front (+z). */
export function house(ctx, { x, z, rotY = 0, w = 5, d = 4, h = 3, wall = 0xfff1d6, roof = 0xff7b54, door = 0x8a5a44, windows = 2 }) {
  P.box(ctx, { x, z, w, d, h, rotY, color: wall });
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  ctx.root.add(g);
  part(g, roofGeometry(w + 0.6, d + 0.6, Math.min(w, d) * 0.45), toon(roof), 0, h, 0);
  part(g, P.GEO.box, toon(door), 0, 0.9, d / 2 + 0.03).scale.set(0.95, 1.8, 0.08);
  part(g, P.GEO.sphere, toon(0xffd23f), 0.3, 0.9, d / 2 + 0.09).scale.setScalar(0.06);
  const glass = toon(0x9fe3ff, { emissive: 0x3a8fd9, emissiveIntensity: 0.15 });
  for (let i = 0; i < windows; i++) {
    const wx = (i % 2 ? 1 : -1) * w * 0.3;
    part(g, P.GEO.box, toon(0xffffff), wx, h * 0.55, d / 2 + 0.02).scale.set(1.0, 0.9, 0.06);
    part(g, P.GEO.box, glass, wx, h * 0.55, d / 2 + 0.05).scale.set(0.8, 0.7, 0.04);
  }
  return g;
}

/**
 * Hollow room the player can walk into. Door gap on local +z.
 * Returns the group so callers can add furniture in local space.
 */
export function room(ctx, { x, z, rotY = 0, w = 8, d = 7, h = 3.2, wall = 0xfff1d6, roof = 0xff7b54, floor = 0xf2d9b8, doorW = 2.4, t = 0.4, flatRoof = false }) {
  const L = frame(x, z, rotY);
  const wallBox = (lx, lz, bw, bd, bh = h, y = 0) => {
    const [wx, wz] = L(lx, lz);
    P.box(ctx, { x: wx, z: wz, y, w: bw, d: bd, h: bh, rotY, color: wall });
  };
  wallBox(0, -d / 2 + t / 2, w, t);
  wallBox(-w / 2 + t / 2, 0, t, d);
  wallBox(w / 2 - t / 2, 0, t, d);
  const side = (w - doorW) / 2;
  wallBox(-w / 2 + side / 2, d / 2 - t / 2, side, t);
  wallBox(w / 2 - side / 2, d / 2 - t / 2, side, t);
  wallBox(0, d / 2 - t / 2, doorW, t, h - 2.6, 2.6);

  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  ctx.root.add(g);
  part(g, P.GEO.box, toon(floor), 0, 0.01, 0, { cast: false }).scale.set(w - 0.1, 0.02, d - 0.1);
  if (flatRoof) {
    P.box(ctx, { x, z, y: h, w: w + 0.4, d: d + 0.4, h: 0.35, rotY, color: roof });
  } else {
    P.box(ctx, { x, z, y: h, w: w + 0.2, d: d + 0.2, h: 0.2, rotY, color: wall });
    part(g, roofGeometry(w + 0.8, d + 0.8, Math.min(w, d) * 0.4), toon(roof), 0, h + 0.2, 0);
  }
  return g;
}

/** Street lamp. Returns the bulb so a zone can switch it on and off. */
export function lamp(ctx, { x, z, h = 3.4, color = 0x5d4a8a, light = 0xfff3b0, on = true }) {
  P.cylinder(ctx, { x, z, r: 0.09, h, color });
  P.cylinder(ctx, { x, z, r: 0.2, h: 0.25, color });
  const bulb = new THREE.Mesh(P.GEO.sphere, toon(light, { emissive: light, emissiveIntensity: on ? 0.9 : 0 }));
  bulb.scale.setScalar(0.3);
  bulb.position.set(x, h + 0.2, z);
  ctx.root.add(bulb);
  return bulb;
}

/** Round cartoon tree. */
export function tree(ctx, { x, z, s = 1, trunk = 0x9b6a4a, leaf = 0x4cbf5a, leaf2 }) {
  P.cylinder(ctx, { x, z, r: 0.22 * s, h: 2.2 * s, color: trunk });
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  ctx.root.add(g);
  const a = toon(leaf), b = toon(leaf2 ?? leaf);
  part(g, P.GEO.sphere, a, 0, 2.7 * s, 0).scale.setScalar(1.2 * s);
  part(g, P.GEO.lowSphere, b, 0.7 * s, 2.3 * s, 0.2 * s).scale.setScalar(0.8 * s);
  part(g, P.GEO.lowSphere, b, -0.6 * s, 2.4 * s, -0.3 * s).scale.setScalar(0.85 * s);
}

export function bench(ctx, { x, z, rotY = 0, color = 0xff9b54 }) {
  P.box(ctx, { x, z, w: 1.8, d: 0.5, h: 0.5, rotY, color });
  const [bx, bz] = frame(x, z, rotY)(0, -0.25);
  P.box(ctx, { x: bx, z: bz, y: 0.5, w: 1.8, d: 0.12, h: 0.5, rotY, color, collide: false });
}

/** Low fence from (x0,z0) to (x1,z1). */
export function fence(ctx, { x0, z0, x1, z1, h = 1, y = 0, color = 0xffffff }) {
  const dx = x1 - x0, dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const rotY = Math.atan2(dx, dz);
  const mat = toon(color);
  const g = new THREE.Group();
  ctx.root.add(g);
  const n = Math.max(1, Math.round(len / 1.2));
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    part(g, P.GEO.box, mat, x0 + dx * k, y + h / 2, z0 + dz * k).scale.set(0.14, h, 0.14);
  }
  for (const ry of [h * 0.4, h * 0.85]) {
    const rail = part(g, P.GEO.box, mat, (x0 + x1) / 2, y + ry, (z0 + z1) / 2);
    rail.scale.set(0.08, 0.1, len);
    rail.rotation.y = rotY;
  }
  ctx.collision.addBox({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: 0.3, d: len, rotY, minY: y, maxY: y + h });
}

/** Animated water surface. Returns { mesh, update(t) }. */
export function water(ctx, { x0, x1, z0, z1, y = 0, color = 0x4fc3f7, light = '#bff1ff', speed = 0.05 }) {
  const tex = canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = light;
    g.lineWidth = 5;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      const y0 = (i + 0.5) * (h / 6);
      for (let x = 0; x <= w; x += 4) {
        const yy = y0 + Math.sin((x / w) * Math.PI * 4 + i) * 4;
        x === 0 ? g.moveTo(x, yy) : g.lineTo(x, yy);
      }
      g.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set((x1 - x0) / 5, (z1 - z0) / 5);
  const mat = new THREE.MeshToonMaterial({ color, map: tex, transparent: true, opacity: 0.9 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  mesh.receiveShadow = true;
  ctx.root.add(mesh);
  return {
    mesh,
    update(t) {
      tex.offset.set(Math.sin(t * 0.3) * 0.05, t * speed);
    },
  };
}

/** Train track through a list of [x, z] points. */
export function rails(ctx, points, { closed = false, color = 0x8d8da8, sleeper = 0x8a5a44, y = 0 } = {}) {
  const g = new THREE.Group();
  ctx.root.add(g);
  const railMat = toon(color), wood = toon(sleeper);
  const pts = closed ? [...points, points[0]] : points;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz);
    const rotY = Math.atan2(dx, dz);
    const L = frame((ax + bx) / 2, (az + bz) / 2, rotY);
    for (const side of [-0.55, 0.55]) {
      const [rx, rz] = L(side, 0);
      const r = part(g, P.GEO.box, railMat, rx, y + 0.12, rz, { cast: false });
      r.scale.set(0.12, 0.12, len + 0.12);
      r.rotation.y = rotY;
    }
    const n = Math.floor(len / 0.9);
    for (let k = 0; k < n; k++) {
      const [sx, sz] = L(0, -len / 2 + (k + 0.5) * (len / n));
      const s = part(g, P.GEO.box, wood, sx, y + 0.04, sz, { cast: false });
      s.scale.set(1.7, 0.08, 0.32);
      s.rotation.y = rotY;
    }
  }
}

const UP = new THREE.Vector3(0, 1, 0);
/** Pipe between two points. Horizontal pipes get a box collider. */
export function pipe(ctx, { a, b, r = 0.35, color = 0x4fc3f7, collide = true, dynamic = false }) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const dir = B.clone().sub(A);
  const len = dir.length();
  const m = new THREE.Mesh(P.GEO.cyl, toon(color));
  m.scale.set(r, len, r);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  m.castShadow = true;
  m.receiveShadow = true;
  m.userData.bake = !dynamic;
  ctx.root.add(m);
  if (collide) {
    if (Math.abs(dir.y) > 0.9) {
      ctx.collision.addCylinder({ x: m.position.x, z: m.position.z, r, minY: Math.min(A.y, B.y), maxY: Math.max(A.y, B.y) });
    } else if (Math.abs(dir.y) < 0.05) {
      ctx.collision.addBox({ x: m.position.x, z: m.position.z, w: r * 2, d: len, rotY: Math.atan2(dir.x, dir.z), minY: A.y - r, maxY: A.y + r });
    }
  }
  return m;
}

/** Chunky rock (also used for cliffs and cave walls). */
export function rock(ctx, { x, z, s = 1, h, color = 0x9e8fb2, collide = true }) {
  const m = new THREE.Mesh(cached('rock', () => new THREE.DodecahedronGeometry(1, 0)), toon(color));
  const height = h ?? s;
  m.scale.set(s, height, s * 0.9);
  m.position.set(x, height * 0.55, z);
  m.rotation.y = (x * 7.1 + z * 3.3) % 6.28;
  m.castShadow = m.receiveShadow = true;
  m.userData.bake = true;
  ctx.root.add(m);
  if (collide) ctx.collision.addCylinder({ x, z, r: s * 0.85, minY: 0, maxY: height * 1.4 });
  return m;
}
