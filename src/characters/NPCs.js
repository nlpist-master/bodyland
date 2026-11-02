import * as THREE from 'three';
import { toon } from '../world/Materials.js';
import { compactRig } from '../world/Bake.js';

// The companions of BIOVERSE, built from simple shapes like the players.
// Every builder returns { root, parts, height, float } where parts has
// body, head, armL, armR (and optionally legL, legR) for NPCAnimator.
// All characters face +Z.

const geoCache = new Map();
function geo(key, make) {
  let g = geoCache.get(key);
  if (!g) {
    g = make();
    g.userData.shared = true;
    geoCache.set(key, g);
  }
  return g;
}
const sphere = (r, ws = 18, hs = 14) => geo(`s${r}/${ws}/${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
const capsule = (r, l) => geo(`c${r}/${l}`, () => new THREE.CapsuleGeometry(r, l, 4, 12));
const cone = (r, h, s = 20) => geo(`k${r}/${h}/${s}`, () => new THREE.ConeGeometry(r, h, s));
const cyl = (rt, rb, h, s = 20) => geo(`y${rt}/${rb}/${h}/${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
const torus = (r, t, arc = Math.PI * 2) => geo(`t${r}/${t}/${arc}`, () => new THREE.TorusGeometry(r, t, 8, 24, arc));
const dome = (r, frac) => geo(`d${r}/${frac}`, () => new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI * frac));

function mesh(g, m, x = 0, y = 0, z = 0, parent) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  parent?.add(o);
  return o;
}

function group(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent?.add(g);
  return g;
}

/** Big friendly eyes, a smile and cheeks on a face plane at z. Returns the eyes. */
function face(parent, { y = 0, z, spread = 0.11, size = 0.055, smileY = -0.08, smileR = 0.05, cheeks = 0xff9bb0, brows, browY = 0.1 }) {
  const dark = toon(0x2b1d2e), white = toon(0xffffff);
  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = group(parent, side * spread, y, z);
    mesh(sphere(size, 14, 10), dark, 0, 0, 0, eye).scale.set(0.9, 1.15, 0.5);
    mesh(sphere(size * 0.33, 8, 6), white, side * -size * 0.2, size * 0.4, size * 0.45, eye);
    eyes.push(eye);
    if (cheeks) mesh(sphere(size * 0.8, 12, 8), toon(cheeks), side * (spread + size * 1.1), y - size * 1.4, z - 0.01, parent).scale.set(1, 0.6, 0.35);
    if (brows) {
      const b = mesh(capsule(size * 0.22, size * 0.9), toon(brows), side * spread, y + browY, z, parent);
      b.rotation.z = Math.PI / 2 + side * 0.15;
    }
  }
  const smile = mesh(torus(smileR, smileR * 0.26, Math.PI), toon(0xb3365a), 0, y + smileY, z, parent);
  smile.rotation.z = Math.PI;
  return eyes;
}

/** Arm hanging from a shoulder pivot. */
function arm(parent, side, { x, y, z = 0, sleeve, hand, r = 0.06, len = 0.2, handR = 0.07 }) {
  const a = group(parent, side * x, y, z);
  mesh(capsule(r, len), sleeve, 0, -(len / 2 + r), 0, a);
  mesh(sphere(handR, 12, 10), hand, 0, -(len + r * 2 + handR * 0.4), 0, a);
  return a;
}

function legs(parent, { x = 0.1, y, color, shoe, r = 0.07, len = 0.18 }) {
  const out = [];
  for (const side of [1, -1]) {
    const leg = group(parent, side * x, y, 0);
    mesh(capsule(r, len), toon(color), 0, -(len / 2 + r), 0, leg);
    mesh(sphere(r * 1.25, 12, 10), toon(shoe), 0, -(len + r * 1.6), r * 0.6, leg).scale.set(1, 0.6, 1.4);
    out.push(leg);
  }
  return out;
}

// ---------------------------------------------------------------- Pipetin
function pipetin() {
  const root = new THREE.Group();
  const body = group(root);
  const skin = toon(0xf6c9a8), coat = toon(0xffffff), beard = toon(0xf4f4f8);
  const [legL, legR] = legs(body, { y: 0.3, color: 0x3c4a7a, shoe: 0x5a3a2a, len: 0.12 });
  const torso = group(body, 0, 0.3, 0);
  mesh(cyl(0.2, 0.34, 0.55), coat, 0, 0.22, 0, torso);
  mesh(sphere(0.2, 16, 12), coat, 0, 0.48, 0, torso).scale.set(1, 0.6, 1);
  for (let i = 0; i < 3; i++) mesh(sphere(0.022, 8, 6), toon(0x7e57c2), 0, 0.38 - i * 0.12, 0.24 + i * 0.025, torso);
  mesh(cyl(0.09, 0.09, 0.03, 12), toon(0x4fc3f7), -0.16, 0.36, 0.17, torso).rotation.x = Math.PI / 2; // pocket badge
  const armL = arm(torso, 1, { x: 0.23, y: 0.5, sleeve: coat, hand: skin });
  const armR = arm(torso, -1, { x: 0.23, y: 0.5, sleeve: coat, hand: skin });
  // The famous pipette.
  const pip = group(armR, 0, -0.36, 0.05);
  mesh(cyl(0.02, 0.012, 0.32, 8), toon(0xbff1ff, { emissive: 0x4fc3f7, emissiveIntensity: 0.25 }), 0, -0.1, 0, pip);
  mesh(sphere(0.045, 10, 8), toon(0xff5d6c), 0, 0.08, 0, pip);
  pip.rotation.x = 0.4;

  const head = group(torso, 0, 0.58, 0);
  const hi = group(head, 0, 0.24, 0);
  mesh(sphere(0.26, 22, 16), skin, 0, 0, 0, hi);
  mesh(sphere(0.075, 12, 10), toon(0xff9f8a), 0, -0.03, 0.26, hi); // round nose
  const eyes = face(hi, { y: 0.04, z: 0.22, spread: 0.1, size: 0.045, smileY: -0.12, smileR: 0.045, cheeks: 0xff9bb0, brows: 0xf4f4f8, browY: 0.08 });
  for (const side of [-1, 1]) {
    const lens = mesh(torus(0.065, 0.012), toon(0x4a3a6a), side * 0.1, 0.04, 0.245, hi);
    lens.scale.z = 0.5;
  }
  mesh(capsule(0.012, 0.06), toon(0x4a3a6a), 0, 0.045, 0.255, hi).rotation.z = Math.PI / 2;
  // Fluffy beard and moustache.
  [[0, -0.2, 0.14, 0.15], [-0.12, -0.14, 0.15, 0.1], [0.12, -0.14, 0.15, 0.1], [0, -0.32, 0.1, 0.11], [-0.08, -0.27, 0.13, 0.1], [0.08, -0.27, 0.13, 0.1]].forEach(([x, y, z, r]) => {
    mesh(sphere(r, 12, 10), beard, x, y, z, hi);
  });
  for (const side of [-1, 1]) mesh(sphere(0.06, 10, 8), beard, side * 0.06, -0.09, 0.24, hi).scale.set(1.3, 0.6, 0.7);
  // Tall gnome hat with a little star.
  const hat = group(hi, 0, 0.1, -0.02);
  hat.rotation.x = -0.12;
  mesh(torus(0.25, 0.05), toon(0x3949ab), 0, 0, 0, hat).rotation.x = Math.PI / 2;
  mesh(cone(0.27, 0.7, 20), toon(0x5c6bc0), 0, 0.33, 0, hat);
  const tip = mesh(sphere(0.06, 10, 8), toon(0xffd23f, { emissive: 0xffb300, emissiveIntensity: 0.5 }), 0, 0.7, 0, hat);
  tip.scale.set(1, 1, 0.6);
  return { root, parts: { body, head, armL, armR, legL, legR, eyes }, height: 1.8 };
}

// ---------------------------------------------------------------- Mochi (brain)
function mochi() {
  const root = new THREE.Group();
  const body = group(root);
  const pink = toon(0xffa6c9), fold = toon(0xe0558f);
  const [legL, legR] = legs(body, { y: 0.45, color: 0xf47fae, shoe: 0x5d4a8a, len: 0.2, r: 0.065 });
  const head = group(body, 0, 0.48, 0);
  const brain = group(head, 0, 0.42, 0);
  mesh(sphere(0.48, 24, 18), pink, 0, 0, 0, brain).scale.set(1.12, 0.86, 0.95);
  // Folds: a few curvy arcs and the middle line.
  [[0.22, 0.3, 0.2, 0.5], [-0.22, 0.3, 0.2, -0.5], [0.42, 0.12, 0.12, 1.2], [-0.42, 0.12, 0.12, -1.2], [0.2, 0.36, -0.2, 0.3], [-0.2, 0.36, -0.2, -0.3]].forEach(([x, y, z, rz]) => {
    const f = mesh(torus(0.12, 0.03, Math.PI), fold, x, y, z, brain);
    f.rotation.set(-0.6, 0, rz);
  });
  mesh(capsule(0.02, 0.6), fold, 0, 0.38, -0.02, brain).rotation.x = Math.PI / 2;
  const eyes = face(brain, { y: -0.02, z: 0.42, spread: 0.13, size: 0.065, smileY: -0.14, smileR: 0.06, cheeks: 0xff7aa8, brows: 0x8a3a6a, browY: 0.12 });
  for (const side of [-1, 1]) mesh(torus(0.085, 0.014), toon(0x2a1b4d), side * 0.13, -0.02, 0.44, brain).scale.z = 0.5;
  // A slightly too proud little crown.
  const crown = group(brain, 0.12, 0.4, 0.02);
  crown.rotation.z = -0.25;
  const gold = toon(0xffd23f, { emissive: 0xffb300, emissiveIntensity: 0.3 });
  mesh(cyl(0.12, 0.12, 0.08, 16), gold, 0, 0, 0, crown);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    mesh(cone(0.035, 0.09, 6), gold, Math.sin(a) * 0.1, 0.08, Math.cos(a) * 0.1, crown);
  }
  // Bow tie.
  for (const side of [-1, 1]) mesh(cone(0.07, 0.12, 4), toon(0x2fd6c3), side * 0.06, 0.02, 0.32, head).rotation.z = side * Math.PI / 2;
  const armL = arm(head, 1, { x: 0.5, y: 0.3, sleeve: pink, hand: fold, r: 0.05, len: 0.18 });
  const armR = arm(head, -1, { x: 0.5, y: 0.3, sleeve: pink, hand: fold, r: 0.05, len: 0.18 });
  return { root, parts: { body, head, armL, armR, legL, legR, eyes }, height: 1.75 };
}

// ---------------------------------------------------------------- Shriron (muscle)
function shriron() {
  const root = new THREE.Group();
  const body = group(root);
  const red = toon(0xff6f61), fiber = toon(0xffa596), skin = toon(0xff6f61);
  const [legL, legR] = legs(body, { y: 0.42, x: 0.15, color: 0x3c4a7a, shoe: 0x8a5a2a, r: 0.09, len: 0.16 });
  const torso = group(body, 0, 0.42, 0);
  mesh(capsule(0.36, 0.38), red, 0, 0.42, 0, torso).scale.set(1.15, 1, 0.9);
  for (const x of [-0.16, 0, 0.16]) mesh(capsule(0.025, 0.14), fiber, x, 0.27, 0.36, torso).scale.z = 0.6;
  const belt = mesh(torus(0.37, 0.05), toon(0x8a5a2a), 0, 0.12, 0, torso);
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(1.12, 0.92, 1);
  mesh(capsule(0.03, 0.14), toon(0x8d8da8), 0.25, 0.04, 0.26, torso); // hammer handle
  mesh(capsule(0.04, 0.1), toon(0x5d4a8a), 0.25, 0.14, 0.26, torso).rotation.z = Math.PI / 2;
  const head = group(torso, 0, 0.62, 0);
  const eyes = face(head, { y: 0.06, z: 0.33, spread: 0.12, size: 0.06, smileY: -0.12, smileR: 0.07, cheeks: 0xffc1b3, brows: 0x5a2a2a, browY: 0.11 });
  const hat = group(head, 0, 0.18, 0);
  mesh(dome(0.32, 0.5), toon(0xffd23f), 0, 0, 0, hat).scale.set(1.08, 0.75, 1);
  mesh(cyl(0.38, 0.38, 0.04, 22), toon(0xffc107), 0, 0, 0.04, hat);
  mesh(capsule(0.03, 0.4), toon(0xffe57f), 0, 0.2, 0, hat).rotation.x = Math.PI / 2;
  const armOf = (side) => {
    const a = group(torso, side * 0.48, 0.62, 0);
    mesh(sphere(0.17, 14, 10), red, 0, -0.05, 0, a);
    mesh(sphere(0.15, 14, 10), red, 0, -0.25, 0.02, a).scale.set(1, 1.1, 1);
    mesh(capsule(0.09, 0.14), red, 0, -0.42, 0, a);
    mesh(sphere(0.12, 12, 10), skin, 0, -0.58, 0, a);
    mesh(torus(0.1, 0.03), toon(0xffffff), 0, -0.48, 0, a).rotation.x = Math.PI / 2; // wristband
    return a;
  };
  return { root, parts: { body, head: torso, armL: armOf(1), armR: armOf(-1), legL, legR, eyes, face: head }, height: 1.75 };
}

// ---------------------------------------------------------------- Kibutzi (avocado)
function kibutzi() {
  const root = new THREE.Group();
  const body = group(root);
  const skinGreen = toon(0x3f7d32), flesh = toon(0xd4e88a), limb = toon(0x2f5f26);
  const [legL, legR] = legs(body, { y: 0.32, color: 0x2f5f26, shoe: 0xffb347, len: 0.12 });
  const head = group(body, 0, 0.32, 0);
  mesh(sphere(0.42, 24, 18), skinGreen, 0, 0.5, 0, head).scale.set(1, 1.3, 0.9);
  mesh(sphere(0.36, 24, 18), flesh, 0, 0.5, 0.24, head).scale.set(0.95, 1.25, 0.5);
  mesh(sphere(0.15, 16, 12), toon(0x8a5a3a), 0, 0.32, 0.36, head);
  mesh(sphere(0.04, 8, 6), toon(0xc48a5a), -0.05, 0.37, 0.5, head);
  const eyes = face(head, { y: 0.68, z: 0.43, spread: 0.11, size: 0.055, smileY: -0.1, smileR: 0.05, cheeks: 0xffa07a, brows: 0x2f5f26, browY: 0.09 });
  // Leaf sprout and a cosy scarf.
  for (const side of [-1, 1]) {
    const leaf = mesh(sphere(0.09, 10, 8), toon(0x6fcf4a), side * 0.07, 1.06, 0, head);
    leaf.scale.set(0.5, 1.4, 0.25);
    leaf.rotation.z = side * -0.6;
  }
  mesh(cyl(0.015, 0.015, 0.12, 6), limb, 0, 1.0, 0, head);
  const scarf = mesh(torus(0.3, 0.06), toon(0xff7b54), 0, 0.12, 0, head);
  scarf.rotation.x = Math.PI / 2;
  const armL = arm(head, 1, { x: 0.4, y: 0.45, sleeve: limb, hand: limb, r: 0.05, len: 0.2, handR: 0.065 });
  const armR = arm(head, -1, { x: 0.4, y: 0.45, sleeve: limb, hand: limb, r: 0.05, len: 0.2, handR: 0.065 });
  return { root, parts: { body, head, armL, armR, legL, legR, eyes }, height: 1.5 };
}

// ---------------------------------------------------------------- Tiptip (water drop)
function tiptip() {
  const root = new THREE.Group();
  const body = group(root);
  const blue = toon(0x4fc3f7, { emissive: 0x1e88e5, emissiveIntensity: 0.15 });
  const head = group(body, 0, 0.55, 0);
  mesh(sphere(0.42, 24, 18), blue, 0, 0.4, 0, head).scale.set(1, 0.95, 0.95);
  mesh(cone(0.3, 0.55, 22), blue, 0, 0.88, 0, head);
  mesh(sphere(0.1, 10, 8), toon(0xffffff), -0.2, 0.62, 0.3, head).scale.set(0.6, 1, 0.4); // shine
  const eyes = face(head, { y: 0.45, z: 0.38, spread: 0.13, size: 0.075, smileY: -0.15, smileR: 0.06, cheeks: 0x9fd8ff, brows: 0x1e3a8a, browY: 0.14 });
  // Eyelash-free but very expressive brows; a tiny captain hat for the ruler of the water kingdom.
  const hat = group(head, 0.04, 0.98, 0);
  hat.rotation.z = -0.2;
  mesh(cyl(0.13, 0.15, 0.1, 16), toon(0xffffff), 0, 0, 0, hat);
  mesh(cyl(0.155, 0.155, 0.035, 16), toon(0x1e3a8a), 0, -0.04, 0, hat);
  mesh(cyl(0.14, 0.14, 0.02, 16), toon(0x1e3a8a), 0, -0.045, 0.06, hat).scale.z = 0.6;
  const armL = arm(head, 1, { x: 0.42, y: 0.4, sleeve: blue, hand: blue, r: 0.045, len: 0.14, handR: 0.06 });
  const armR = arm(head, -1, { x: 0.42, y: 0.4, sleeve: blue, hand: blue, r: 0.045, len: 0.14, handR: 0.06 });
  return { root, parts: { body, head, armL, armR, eyes }, height: 1.6, float: true };
}

const BUILDERS = { pipetin, mochi, shriron, kibutzi, tiptip };

export function createNPC(id) {
  const npc = BUILDERS[id]();
  npc.root.name = 'npc:' + id;
  npc.root.traverse((o) => {
    if (o.isMesh) o.castShadow = false;
  });
  compactRig(npc.root);
  npc.animator = new NPCAnimator(npc.parts, npc.float);
  return npc;
}

// ---------------------------------------------------------------- animation
const KEYS = ['bodyY', 'bodyRotZ', 'headX', 'headY', 'headZ', 'armLX', 'armLZ', 'armRX', 'armRZ', 'legLX', 'legRX'];

/**
 * Procedural NPC animation. States: idle, wave, talk, excited, point, laugh.
 * lookYaw turns the head toward the player.
 */
export class NPCAnimator {
  constructor(parts, float = false) {
    this.p = parts;
    this.float = float;
    this.cur = {};
    this.tgt = {};
    for (const k of KEYS) this.cur[k] = this.tgt[k] = 0;
    this.time = Math.random() * 10;
    this.blink = 1 + Math.random() * 3;
    this.state = 'idle';
    this.stateTime = 0;
    this.lookYaw = 0;
  }

  play(state, seconds = 2) {
    this.state = state;
    this.stateTime = seconds;
  }

  update(dt) {
    const t = this.tgt;
    for (const k of KEYS) t[k] = 0;
    this.time += dt;
    this.stateTime -= dt;
    if (this.stateTime <= 0) this.state = 'idle';
    const time = this.time;
    const base = this.float ? 0.35 + Math.sin(time * 2) * 0.12 : 0;

    t.bodyY = base + Math.sin(time * 2.4) * 0.012;
    t.armLZ = 0.15 + Math.sin(time * 2.4) * 0.04;
    t.armRZ = -0.15 - Math.sin(time * 2.4) * 0.04;
    t.headY = this.lookYaw;
    t.headX = Math.sin(time * 0.8) * 0.04;

    switch (this.state) {
      case 'wave':
        t.armRZ = -2.6 + Math.sin(time * 10) * 0.35;
        t.headZ = 0.12;
        t.bodyY = base + Math.abs(Math.sin(time * 5)) * 0.04;
        break;
      case 'talk':
        t.headX = Math.sin(time * 7) * 0.08;
        t.armLZ = 0.5 + Math.sin(time * 4) * 0.3;
        t.armRZ = -0.5 - Math.sin(time * 4 + 1.5) * 0.3;
        t.armLX = -0.4;
        t.armRX = -0.4;
        break;
      case 'excited':
        t.bodyY = base + Math.abs(Math.sin(time * 9)) * 0.22;
        t.armLZ = 2.5;
        t.armRZ = -2.5;
        t.headX = -0.15;
        t.legLX = -Math.abs(Math.sin(time * 9)) * 0.4;
        t.legRX = -Math.abs(Math.sin(time * 9)) * 0.4;
        break;
      case 'point':
        t.armRX = -1.5;
        t.armRZ = -0.3;
        t.headX = -0.05;
        break;
      case 'laugh':
        t.bodyRotZ = Math.sin(time * 20) * 0.05;
        t.headX = -0.25 + Math.sin(time * 20) * 0.05;
        t.armLZ = 0.6;
        t.armRZ = -0.6;
        t.armLX = -0.8;
        t.armRX = -0.8;
        break;
    }

    const k = 1 - Math.exp(-10 * dt);
    const c = this.cur;
    for (const key of KEYS) c[key] += (t[key] - c[key]) * k;
    const p = this.p;
    p.body.position.y = c.bodyY;
    p.body.rotation.z = c.bodyRotZ;
    p.head.rotation.set(c.headX, c.headY, c.headZ);
    p.armL.rotation.set(c.armLX, 0, c.armLZ);
    p.armR.rotation.set(c.armRX, 0, c.armRZ);
    if (p.legL) {
      p.legL.rotation.x = c.legLX;
      p.legR.rotation.x = c.legRX;
    }

    this.blink -= dt;
    const closed = this.blink < 0.12;
    if (this.blink < 0) this.blink = 2 + Math.random() * 3;
    for (const e of p.eyes) e.scale.y = closed ? 0.15 : 1;
  }
}
