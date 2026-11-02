import * as THREE from 'three';
import { toon } from '../world/Materials.js';
import { Animator } from './Animator.js';

// Builds a cute, modestly dressed child out of simple shapes.
// Hierarchy:  root (feet) > body > hips > { torso > { head, arms }, legs }
// The character faces +Z. Total height is about 1.5 units.

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
const cap = (r, frac) => geo(`h${r}/${frac}`, () => new THREE.SphereGeometry(r, 22, 12, 0, Math.PI * 2, 0, Math.PI * frac));

function mesh(g, m, x = 0, y = 0, z = 0, parent) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = false; // characters use a blob shadow
  parent?.add(o);
  return o;
}

const HEAD_R = 0.3;

/** Point on the head surface at (x, y), pushed slightly outward. */
function onHead(x, y, out = 0.005) {
  const z = Math.sqrt(Math.max(0, HEAD_R * HEAD_R - x * x - y * y));
  return [x, y, z + out];
}

function buildFace(head, def) {
  const dark = toon(0x2b1d2e);
  const white = toon(0xffffff);
  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(...onHead(side * 0.11, 0.02, -0.01));
    const ball = mesh(sphere(0.055, 14, 10), dark, 0, 0, 0, eye);
    ball.scale.set(0.9, 1.15, 0.5);
    mesh(sphere(0.018, 8, 6), white, side * -0.012, 0.022, 0.025, eye);
    head.add(eye);
    eyes.push(eye);
    const cheek = mesh(sphere(0.045, 12, 8), toon(0xff9bb0), ...onHead(side * 0.17, -0.07, -0.012), head);
    cheek.scale.set(1, 0.6, 0.35);
    const brow = mesh(capsule(0.012, 0.05), toon(def.hair), ...onHead(side * 0.11, 0.105, 0.0), head);
    brow.rotation.z = Math.PI / 2 + side * 0.12;
  }
  const smile = mesh(geo('smile', () => new THREE.TorusGeometry(0.05, 0.013, 6, 14, Math.PI)), toon(0xb3365a), ...onHead(0, -0.075, -0.004), head);
  smile.rotation.z = Math.PI;
  const nose = mesh(sphere(0.022, 10, 8), toon(def.skin), ...onHead(0, -0.025, 0.006), head);
  nose.scale.set(1, 0.8, 0.7);
  return eyes;
}

function buildHair(head, def, swing) {
  const hair = toon(def.hair);
  const top = mesh(cap(0.318, def.hairStyle === 'short' ? 0.48 : 0.55), hair, 0, 0.0, -0.005, head);
  top.rotation.x = def.hairStyle === 'short' ? -0.32 : -0.42;

  if (def.hairStyle === 'short') {
    // Kippah hugs the top of the head, slightly back.
    const kippah = mesh(cap(0.328, 0.17), toon(def.kippah), 0, 0, 0, head);
    kippah.rotation.x = -0.5;
    // Small side curls (peyot).
    for (const side of [-1, 1]) {
      const curl = mesh(capsule(0.026, 0.1), hair, side * 0.285, -0.08, 0.04, head);
      curl.rotation.z = side * 0.15;
      swing.push({ obj: curl, amount: 0.25, axis: 'x', base: 0 });
    }
    return;
  }

  // Girls: soft back hair down to the neck and a little fringe.
  const back = mesh(sphere(0.3, 20, 14), hair, 0, -0.06, -0.07, head);
  back.scale.set(1.04, 1.05, 0.95);
  for (const [x, y] of [[-0.12, 0.2], [0, 0.225], [0.12, 0.2]]) {
    const fringe = mesh(sphere(0.085, 12, 8), hair, ...onHead(x, y, -0.045), head);
    fringe.scale.set(1.25, 0.65, 0.7);
  }
  const accent = toon(def.accent);

  if (def.hairStyle === 'braids') {
    for (const side of [-1, 1]) {
      const braid = new THREE.Group();
      braid.position.set(side * 0.23, -0.08, -0.1);
      head.add(braid);
      let y = 0;
      [0.075, 0.068, 0.06, 0.052].forEach((r) => {
        y -= r * 1.5;
        mesh(sphere(r, 12, 10), hair, 0, y, 0.02, braid);
      });
      const bowY = y - 0.07;
      for (const s of [-1, 1]) {
        const loop = mesh(sphere(0.045, 10, 8), accent, s * 0.045, bowY, 0.02, braid);
        loop.scale.set(1.2, 0.75, 0.6);
      }
      mesh(sphere(0.022, 8, 6), accent, 0, bowY, 0.03, braid);
      swing.push({ obj: braid, amount: 0.7, axis: 'x', base: 0.15, side });
    }
    // Hair band
    const band = mesh(geo('band', () => new THREE.TorusGeometry(0.326, 0.024, 6, 28, Math.PI)), accent, 0, 0, 0, head);
    band.rotation.x = -0.3;
  } else {
    // Ponytail with a big bow.
    const tail = new THREE.Group();
    tail.position.set(0, 0.12, -0.27);
    head.add(tail);
    mesh(geo('scrunchie', () => new THREE.TorusGeometry(0.06, 0.03, 8, 14)), accent, 0, 0, 0, tail);
    [[0.085, -0.06, -0.06], [0.08, -0.16, -0.1], [0.07, -0.26, -0.11], [0.055, -0.35, -0.09]].forEach(([r, y, z]) => {
      mesh(sphere(r, 12, 10), hair, 0, y, z, tail);
    });
    for (const s of [-1, 1]) {
      const loop = mesh(sphere(0.07, 12, 8), accent, s * 0.08, 0.05, 0.02, tail);
      loop.scale.set(1.3, 0.8, 0.5);
      loop.rotation.z = s * 0.4;
    }
    swing.push({ obj: tail, amount: 0.6, axis: 'x', base: 0.1 });
  }
}

export function createCharacter(def) {
  const root = new THREE.Group();
  root.name = 'char:' + def.id;
  const body = new THREE.Group();
  root.add(body);
  const hips = new THREE.Group();
  hips.position.y = 0.5;
  body.add(hips);

  const skin = toon(def.skin);
  const shirt = toon(def.shirt);
  const shoes = toon(def.shoes);
  const girl = def.type === 'girl';
  const legMat = toon(girl ? def.legs : def.pants);
  const swing = [];

  // Legs (pivot at the hip, hang down).
  const legs = [];
  for (const side of [1, -1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.1, 0.02, 0);
    hips.add(leg);
    mesh(capsule(0.075, 0.3), legMat, 0, -0.23, 0, leg);
    const shoe = mesh(sphere(0.085, 14, 10), shoes, 0, -0.45, 0.04, leg);
    shoe.scale.set(1, 0.6, 1.4);
    legs.push(leg);
  }

  // Torso
  const torso = new THREE.Group();
  hips.add(torso);
  const chest = mesh(capsule(0.2, 0.16), shirt, 0, 0.22, 0, torso);
  chest.scale.set(1.05, 1, 0.85);
  const collar = mesh(geo('collar', () => new THREE.TorusGeometry(0.11, 0.035, 8, 18)), toon(def.collar), 0, 0.46, 0.0, torso);
  collar.rotation.x = Math.PI / 2;

  if (girl) {
    // Long, modest skirt reaching the ankles.
    const skirt = mesh(geo('skirt', () => new THREE.CylinderGeometry(0.2, 0.34, 0.44, 20)), toon(def.skirt), 0, -0.15, 0, hips);
    swing.push({ obj: skirt, amount: 0.12, axis: 'z', base: 0 });
    const hem = mesh(geo('hem', () => new THREE.TorusGeometry(0.33, 0.018, 6, 24)), toon(def.collar), 0, -0.37, 0, hips);
    hem.rotation.x = Math.PI / 2;
  } else {
    // Shirt buttons, a belt and tzitzit strings.
    for (let i = 0; i < 3; i++) mesh(sphere(0.018, 8, 6), toon(0x9db4d9), 0, 0.34 - i * 0.1, 0.172, torso);
    const belt = mesh(capsule(0.19, 0.02), toon(def.pants), 0, 0.0, 0, hips);
    belt.scale.set(1.05, 0.5, 0.85);
    const strings = toon(def.tzitzit);
    for (const side of [-1, 1]) {
      const group = new THREE.Group();
      group.position.set(side * 0.19, 0.02, 0.02);
      hips.add(group);
      for (const dz of [-0.025, 0.025]) mesh(capsule(0.009, 0.2), strings, 0, -0.11, dz, group);
      swing.push({ obj: group, amount: 0.4, axis: 'x', base: 0 });
    }
  }

  // Backpack for adventures.
  const bag = mesh(geo('bag', () => new THREE.CapsuleGeometry(0.13, 0.12, 4, 10)), toon(def.bag), 0, 0.24, -0.2, torso);
  bag.scale.set(1.15, 1, 0.6);
  mesh(sphere(0.07, 10, 8), toon(0xffffff), 0, 0.17, -0.29, torso).scale.set(1.3, 0.7, 0.4);

  // Arms (pivot at the shoulder, hang down). Long sleeves, hands only.
  const arms = [];
  for (const side of [1, -1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.26, 0.38, 0);
    torso.add(arm);
    mesh(capsule(0.065, 0.2), shirt, 0, -0.15, 0, arm);
    mesh(sphere(0.07, 12, 10), skin, 0, -0.32, 0, arm);
    arms.push(arm);
  }

  // Head
  const head = new THREE.Group();
  head.position.set(0, 0.46, 0);
  torso.add(head);
  const headInner = new THREE.Group();
  headInner.position.y = 0.27;
  head.add(headInner);
  mesh(sphere(HEAD_R, 26, 20), skin, 0, 0, 0, headInner);
  for (const side of [-1, 1]) mesh(sphere(0.06, 10, 8), skin, side * 0.29, -0.03, 0, headInner).scale.set(0.5, 1, 0.8);
  const eyes = buildFace(headInner, def);
  buildHair(headInner, def, swing);

  const parts = { root, body, hips, torso, head, armL: arms[0], armR: arms[1], legL: legs[0], legR: legs[1], eyes, swing };
  return { def, root, parts, animator: new Animator(parts) };
}
