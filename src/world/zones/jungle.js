import * as THREE from 'three';
import * as P from '../Props.js';
import * as S from '../Structures.js';
import { toon, cellTexture } from '../Materials.js';
import { ZONE_INFO } from '../../data/zones.js';
import { FRUIT, thing } from '../Fruit.js';

// The Jungle of Colors: giant fruit and vegetables, a stream with stepping
// stones, bouncy mushrooms up to a tree platform, a hedge garden behind
// three colored gates, the fiber station, and a secret cave behind vines.

const SPAWN = { x: 0, y: 0, z: -28, yaw: 0 };
const STREAM = { z0: -3, z1: 3 };

function jungleTree(ctx, x, z, s = 1) {
  P.cylinder(ctx, { x, z, r: 0.4 * s, h: 6 * s, color: 0x8a5a3a });
  const add = thing(ctx, x, z, 0, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const leaf = add(P.GEO.lowSphere, i % 2 ? 0x2e9e3e : 0x43b552, Math.sin(a) * 1.6 * s, 6 * s, Math.cos(a) * 1.6 * s, 1.9 * s, 0.25 * s, 0.7 * s);
    leaf.rotation.y = a + Math.PI / 2;
    leaf.rotation.z = 0.35;
  }
  add(P.GEO.sphere, 0x8a5a3a, 0, 6 * s, 0, 0.6 * s);
}

function stream(ctx) {
  const tex = cellTexture('#8ad97a', '#74c766', 13);
  P.floor(ctx, { x0: -40, x1: 40, z0: -42, z1: STREAM.z0, texture: tex, tile: 7 });
  P.floor(ctx, { x0: -40, x1: 40, z0: STREAM.z1, z1: 40, texture: tex, tile: 7 });
  tex.dispose();
  const bank = { color: 0x8a6a4a, collide: false, cast: false, y: -2.5, h: 2.48 };
  P.box(ctx, { ...bank, x: 0, z: STREAM.z0 + 0.25, w: 80, d: 0.5 });
  P.box(ctx, { ...bank, x: 0, z: STREAM.z1 - 0.25, w: 80, d: 0.5 });
  P.box(ctx, { x: 0, z: 0, y: -3, w: 80, d: 6, h: 0.5, color: 0x5a7a9a, collide: false, cast: false });
  const water = S.water(ctx, { x0: -40, x1: 40, z0: STREAM.z0, z1: STREAM.z1, y: -0.45, color: 0x4fc3f7, speed: 0.12 });
  ctx.collision.killY = -1.1;
  // Wooden bridge on the main path.
  P.box(ctx, { x: 0, z: 0, y: -0.2, w: 3, d: 7.4, h: 0.3, color: 0xb07a4a });
  S.fence(ctx, { x0: -1.4, z0: -3.6, x1: -1.4, z1: 3.6, h: 0.9, color: 0x8a5a3a });
  S.fence(ctx, { x0: 1.4, z0: -3.6, x1: 1.4, z1: 3.6, h: 0.9, color: 0x8a5a3a });
  // Stepping stones to the west, a fallen log to the east.
  for (const [x, z] of [[-14, -2.2], [-13, -0.6], [-14.2, 1.1], [-13.2, 2.6]]) P.cylinder(ctx, { x, z, y: -2.5, r: 0.6, h: 2.6, color: 0xb0a6c0 });
  const log = new THREE.Mesh(P.GEO.cyl, toon(0x8a5a3a));
  log.scale.set(0.5, 8, 0.5);
  log.rotation.x = Math.PI / 2;
  log.position.set(14, -0.35, 0);
  log.userData.bake = true;
  ctx.root.add(log);
  ctx.collision.addBox({ x: 14, z: 0, w: 0.9, d: 8, minY: -1, maxY: 0.12 });
  return water;
}

function colorGates(ctx) {
  // Hedge garden (x 10..30, z 18..34) with three locked gates in its south wall.
  const hedge = 0x2e8b3a;
  const h = 2.8;
  P.box(ctx, { x: 20, z: 34, w: 20.6, d: 1.2, h, color: hedge });
  P.box(ctx, { x: 10, z: 26, w: 1.2, d: 16, h, color: hedge });
  P.box(ctx, { x: 30, z: 26, w: 1.2, d: 16, h, color: hedge });
  const gates = [[14, 0xff4d4d, 'circle'], [20, 0xffd23f, 'triangle'], [26, 0x9b59b6, 'square']];
  const wallX = [10, 12.5, 15.5, 18.5, 21.5, 24.5, 27.5, 30];
  for (let i = 0; i < wallX.length - 1; i += 2) {
    const x0 = wallX[i], x1 = wallX[i + 1];
    P.box(ctx, { x: (x0 + x1) / 2, z: 18, w: x1 - x0 + 0.01, d: 1.2, h, color: hedge });
  }
  const doors = [];
  for (const [x, color, shape] of gates) {
    const door = P.box(ctx, { x, z: 18, w: 3, d: 0.4, h: 2.6, color, dynamic: true });
    const g = new THREE.Group();
    g.position.set(x, 1.4, 17.75);
    ctx.root.add(g);
    const white = toon(0xffffff);
    let sym;
    if (shape === 'circle') sym = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), white);
    else if (shape === 'triangle') sym = new THREE.Mesh(new THREE.CircleGeometry(0.65, 3), white);
    else sym = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), white);
    sym.rotation.y = Math.PI;
    if (shape === 'triangle') sym.rotation.z = Math.PI / 2;
    g.add(sym);
    for (const side of [-1, 1]) P.cylinder(ctx, { x: x + side * 1.65, z: 18, r: 0.3, h: 3.2, color: 0xffd23f });
    doors.push({ door, symbol: g, color, shape });
  }
  P.sign(ctx, { x: 7.6, z: 15.4, text: 'שערי הצבעים', bg: '#2e9e3e', rotY: Math.PI + 0.3 });
  // Rare fruits inside the garden (collected in stage C).
  FRUIT.orange(ctx, 16, 28, 0.9);
  FRUIT.apple(ctx, 24, 29, 0.9);
  FRUIT.eggplant(ctx, 20, 24);
  return doors;
}

function treePlatform(ctx) {
  // Bouncy mushrooms launch you up to a leafy platform with a view over the hedge.
  const mush = (x, z, r, h, color) => {
    P.cylinder(ctx, { x, z, r: r * 0.35, h, color: 0xfff1d6 });
    // The collider top matches the top of the cap, so feet land on what you see.
    ctx.collision.addCylinder({ x, z, r: r * 0.85, minY: h, maxY: h + r * 0.45, tag: 'bounce' });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(color));
    cap.position.set(x, h, z);
    cap.scale.y = 0.45;
    cap.userData.bake = true;
    ctx.root.add(cap);
    for (let i = 0; i < 4; i++) {
      const a = i * 1.7;
      const dot = new THREE.Mesh(P.GEO.sphere, toon(0xffffff));
      dot.scale.setScalar(r * 0.14);
      dot.position.set(x + Math.sin(a) * r * 0.55, h + r * 0.36, z + Math.cos(a) * r * 0.55);
      dot.userData.bake = true;
      ctx.root.add(dot);
    }
  };
  mush(2.2, 17.3, 1.2, 0.5, 0xff5d6c);
  mush(-4, 17, 1.0, 0.4, 0xff9b2f);
  P.cylinder(ctx, { x: 3, z: 22, r: 0.7, h: 4.4, color: 0x8a5a3a });
  P.cylinder(ctx, { x: 3, z: 22, y: 4.4, r: 2.6, h: 0.35, color: 0x43b552 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leaf = new THREE.Mesh(P.GEO.sphere, toon(0x2e9e3e));
    leaf.scale.set(1.3, 0.2, 0.6);
    leaf.position.set(3 + Math.sin(a) * 2.4, 4.6, 22 + Math.cos(a) * 2.4);
    leaf.rotation.y = a + Math.PI / 2;
    leaf.userData.bake = true;
    ctx.root.add(leaf);
  }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), toon(0xffd23f, { emissive: 0xffb300, emissiveIntensity: 0.6 }));
  star.position.set(3, 5.5, 22);
  ctx.root.add(star);
  ctx.interactions.addTrigger({
    x: 3, z: 22, r: 2, minY: 4.3, once: true,
    onEnter: () => {
      ctx.audio.play('secret');
      ctx.game.player.celebrate();
      const first = !ctx.save.flags.jungleTree;
      ctx.game.ui.toast(first ? 'קפצת עד צמרת העץ! מכאן רואים את הגן הסודי.' : 'שוב בצמרת העץ!', 'secret');
      ctx.game.progress.setFlag('jungleTree');
    },
  });
  return star;
}

function fiberStation(ctx) {
  const x = -18, z = 22;
  P.box(ctx, { x, z, w: 6, d: 4, h: 3.2, color: 0x6fbf73 });
  P.box(ctx, { x, z, y: 3.2, w: 6.4, d: 4.4, h: 0.3, color: 0x2e8b3a });
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.18, 8, 20), toon(0xffd23f));
  wheel.position.set(x + 3.3, 2, z);
  wheel.rotation.y = Math.PI / 2;
  ctx.root.add(wheel);
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(P.GEO.box, toon(0xffd23f));
    spoke.scale.set(0.1, 2.1, 0.1);
    spoke.rotation.z = (i / 4) * Math.PI;
    wheel.add(spoke);
  }
  S.pipe(ctx, { a: [x - 3, 1.5, z + 1], b: [x - 7, 1.5, z + 1], r: 0.35, color: 0x9ccc65 });
  S.pipe(ctx, { a: [x - 7, 0, z + 1], b: [x - 7, 3.5, z + 1], r: 0.35, color: 0x9ccc65 });
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.35, 1.2, 14, 1, true), toon(0x9ccc65, { side: THREE.DoubleSide }));
  funnel.position.set(x - 7, 4.1, z + 1);
  funnel.userData.bake = true;
  ctx.root.add(funnel);
  P.box(ctx, { x, z: z - 2.05, y: 0, w: 1.6, d: 0.1, h: 2.2, color: 0x2e5a2e, collide: false });
  P.sign(ctx, { x: x + 4.4, z: z - 3.4, text: 'תחנת הסיבים', bg: '#2e9e3e', rotY: Math.PI + 0.4 });
  return wheel;
}

function secretCave(ctx) {
  // A rocky room facing east, hidden behind hanging vines.
  const x = -27, z = 11, rot = Math.PI / 2;
  S.room(ctx, { x, z, rotY: rot, w: 6, d: 6, h: 3, wall: 0x8e7f9e, roof: 0x7a6b8a, floor: 0x6a5b7a, doorW: 2, flatRoof: true });
  for (const [dx, dz, s, h] of [[-1, -4.2, 3, 3.5], [2, -4.4, 2.6, 3], [-4, 0, 3, 3.8], [-1, 4.2, 3, 3.4], [2, 4.4, 2.4, 3], [0, 0, 3.6, 2.2]]) {
    const r = S.rock(ctx, { x: x + dx, z: z + dz, s, h, color: 0x9e8fb2, collide: false });
    if (dx === 0 && dz === 0) r.position.y = 3.6;
  }
  const vineMat = toon(0x3fa34d);
  for (let i = 0; i < 9; i++) {
    const v = new THREE.Mesh(P.GEO.cyl, vineMat);
    v.scale.set(0.06, 1.6 + (i % 3) * 0.6, 0.06);
    v.position.set(x + 3.25, 3 - v.scale.y / 2, z - 0.9 + i * 0.22);
    v.userData.bake = true;
    ctx.root.add(v);
    const leaf = new THREE.Mesh(P.GEO.sphere, vineMat);
    leaf.scale.set(0.12, 0.2, 0.08);
    leaf.position.set(x + 3.3, v.position.y - v.scale.y / 2, v.position.z);
    leaf.userData.bake = true;
    ctx.root.add(leaf);
  }
  const crystalMat = toon(0x8ff7ea, { emissive: 0x2fd6c3, emissiveIntensity: 0.9 });
  for (const [dx, dz, h] of [[-2, -1.5, 1.2], [-2.2, 0.6, 1.6], [-1.4, 2, 0.9], [-0.5, -2.2, 0.8]]) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.28, h, 6), crystalMat);
    c.position.set(x + dx, h / 2, z + dz);
    ctx.root.add(c);
  }
  ctx.interactions.addTrigger({
    x: x - 0.5, z, r: 2, maxY: 2.5, once: true,
    onEnter: () => {
      ctx.audio.play('secret');
      ctx.game.player.celebrate();
      const first = !ctx.save.flags.jungleCave;
      ctx.game.ui.toast(first ? 'גילית את המערה הסודית!' : 'ברוכים השבים למערה!', 'secret');
      ctx.game.progress.setFlag('jungleCave');
    },
  });
  return crystalMat;
}

function butterflies(ctx, n) {
  const list = [];
  const colors = [0xff5fa2, 0xffd23f, 0x4fc3f7, 0xff9b2f, 0x9b7bff];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group();
    const mat = toon(colors[i % colors.length], { side: THREE.DoubleSide });
    const wings = [];
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.22, 10), mat);
      w.position.x = side * 0.2;
      w.rotation.x = -Math.PI / 2;
      pivot.add(w);
      g.add(pivot);
      wings.push({ pivot, side });
    }
    ctx.root.add(g);
    list.push({ g, wings, cx: -20 + (i * 37) % 40, cz: -20 + (i * 23) % 30, r: 2 + (i % 3), speed: 0.5 + (i % 4) * 0.15, phase: i });
  }
  return (t) => {
    for (const b of list) {
      const a = t * b.speed + b.phase;
      b.g.position.set(b.cx + Math.cos(a) * b.r, 1.6 + Math.sin(t * 2 + b.phase) * 0.4, b.cz + Math.sin(a) * b.r);
      b.g.rotation.y = -a;
      const flap = Math.sin(t * 18 + b.phase) * 0.9;
      for (const w of b.wings) w.pivot.rotation.z = w.side * flap;
    }
  };
}

export function build(ctx) {
  const { game, npcs } = ctx;
  ctx.setEnv(P.environment(ctx, { skyTop: '#5fd8b0', skyBottom: '#eaffd8', hemiSky: 0xf2fff0, hemiGround: 0x74c766, fogNear: 45, fogFar: 120 }));
  const water = stream(ctx);

  // Paths of sand from the portal to the bridge and on to the gates.
  for (const [x, z, len, rot] of [[0, -18, 20, 0], [3, 8.5, 11, 0.5], [6.5, 15, 4, 1.2]]) {
    P.box(ctx, { x, z, y: -0.98, w: 2.4, d: len, h: 1, rotY: rot, color: 0xf2d9a0, collide: false, cast: false });
  }

  FRUIT.apple(ctx, -9, -20);
  FRUIT.orange(ctx, 10, -19);
  FRUIT.pear(ctx, -20, -10);
  FRUIT.strawberry(ctx, 20, -9);
  FRUIT.watermelon(ctx, -24, -25, 0.4);
  FRUIT.grapes(ctx, 25, -24);
  FRUIT.banana(ctx, 8, -9, 0.6);
  FRUIT.carrots(ctx, -7, -12);
  FRUIT.eggplant(ctx, -26, -8);
  FRUIT.apple(ctx, 22, 8, 1.2);
  FRUIT.orange(ctx, -10, 9, 1.2);
  for (const [x, z, s] of [[-16, -24, 1.3], [16, -26, 1.1], [26, -12, 1.4], [-30, -16, 1.2], [-12, 28, 1.3], [-4, 30, 1.1], [32, 6, 1.2]]) FRUIT.broccoli(ctx, x, z, s);

  // Jungle border: tall palms all around.
  for (let i = 0; i < 28; i++) {
    const t = i / 28;
    let x, z;
    if (t < 0.25) [x, z] = [-36 + t * 4 * 72, 36];
    else if (t < 0.5) [x, z] = [36, 36 - (t - 0.25) * 4 * 72];
    else if (t < 0.75) [x, z] = [36 - (t - 0.5) * 4 * 72, -37];
    else [x, z] = [-36, -36 + (t - 0.75) * 4 * 72];
    if (Math.abs(x) < 4 && z < 0) continue;
    jungleTree(ctx, x, z, 1 + (i % 3) * 0.15);
  }
  for (const [x, z, w, d] of [[0, 38.5, 80, 1], [0, -39.5, 80, 1], [-38.5, 0, 1, 80], [38.5, 0, 1, 80]]) P.box(ctx, { x, z, w, d, h: 3, color: 0x2e8b3a });
  P.box(ctx, { x: 0, z: -37.5, w: 8, d: 1, h: 2.4, color: 0x2e8b3a });

  const doors = colorGates(ctx);
  const star = treePlatform(ctx);
  const wheel = fiberStation(ctx);
  const crystals = secretCave(ctx);
  const flyAll = butterflies(ctx, 7);
  const pollen = P.floatingCells(ctx, { count: 30, radiusMin: 6, radiusMax: 36, yMin: 2, yMax: 9, color: 0xffe066, seed: 9, size: [0.08, 0.18], flat: 1 });

  const portal = S.portal(ctx, { x: 0, z: -33, rotY: 0, color: 0x9b7bff, label: 'מרכז העולם', to: 'hub', onEnter: () => game.travel('hub') });
  npcs.add(ctx, { id: 'kibutzi', x: 3.4, z: -23, rotY: Math.PI + 0.5, zone: 'jungle' });

  return {
    title: ZONE_INFO.jungle.title,
    spawn: SPAWN,
    spawns: { hub: SPAWN },
    bake: true,
    doors,
    wheel,
    update(dt, t) {
      portal.update(t);
      water.update(t);
      pollen.update(t * 0.6);
      flyAll(t);
      star.rotation.y = t * 1.6;
      star.position.y = 5.5 + Math.sin(t * 2) * 0.15;
      wheel.rotation.z = Math.sin(t * 0.8) * 0.05; // stuck
      crystals.emissiveIntensity = 0.6 + Math.sin(t * 2.5) * 0.3;
    },
  };
}
