import * as THREE from 'three';
import * as P from '../Props.js';
import * as S from '../Structures.js';
import { toon, cellTexture, canvasTexture } from '../Materials.js';
import { ZONE_INFO } from '../../data/zones.js';

// The Building Factory: a huge construction site with a tower crane,
// conveyor belts, scaffolding to climb and a ravine whose bridge broke.
// Running the crane and rebuilding the bridge happen in missions/construction.js.

const SPAWN = { x: 0, y: 0, z: -28, yaw: 0 };
const RAVINE = { z0: 6, z1: 18 };

function stripes(a, b) {
  const tex = canvasTexture(64, 64, (g, w, h) => {
    g.fillStyle = a;
    g.fillRect(0, 0, w, h);
    g.fillStyle = b;
    for (let i = -1; i < 3; i++) {
      g.beginPath();
      g.moveTo(i * 32, 0);
      g.lineTo(i * 32 + 16, 0);
      g.lineTo(i * 32 + 48, h);
      g.lineTo(i * 32 + 32, h);
      g.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function ground(ctx) {
  const tex = cellTexture('#f2c98a', '#e3b574', 9);
  P.floor(ctx, { x0: -40, x1: 40, z0: -42, z1: RAVINE.z0, texture: tex, tile: 7 });
  P.floor(ctx, { x0: -40, x1: 40, z0: RAVINE.z1, z1: 40, texture: tex, tile: 7 });
  tex.dispose();
  // Ravine walls and a deep floor far below.
  const wall = { color: 0xc48a5a, collide: false, cast: false, y: -8, h: 7.98 };
  P.box(ctx, { ...wall, x: 0, z: RAVINE.z0 + 0.25, w: 80, d: 0.5 });
  P.box(ctx, { ...wall, x: 0, z: RAVINE.z1 - 0.25, w: 80, d: 0.5 });
  P.box(ctx, { x: 0, z: (RAVINE.z0 + RAVINE.z1) / 2, y: -9, w: 80, d: 12, h: 1, color: 0x8a5a3a, collide: false, cast: false });
  ctx.collision.killY = -4;
}

function brokenBridge(ctx) {
  const wood = 0xb07a4a, dark = 0x8a5a3a;
  // Two stubs reaching out over the ravine, the middle is missing.
  P.box(ctx, { x: 0, z: RAVINE.z0 + 0.75, y: -0.3, w: 3.4, d: 2.5, h: 0.3, color: wood });
  P.box(ctx, { x: 0, z: RAVINE.z1 - 0.75, y: -0.3, w: 3.4, d: 2.5, h: 0.3, color: wood });
  for (const z of [RAVINE.z0, RAVINE.z0 + 2, RAVINE.z1 - 2, RAVINE.z1]) {
    for (const x of [-1.6, 1.6]) P.cylinder(ctx, { x, z, r: 0.14, h: 1.3, color: dark });
  }
  // A couple of planks dangling down.
  const g = new THREE.Group();
  ctx.root.add(g);
  [[-0.6, RAVINE.z0 + 2.3, 0.9], [0.7, RAVINE.z1 - 2.3, -1.1]].forEach(([x, z, tilt]) => {
    const plank = S.part(g, P.GEO.box, toon(wood), x, -1.1, z);
    plank.scale.set(0.9, 0.12, 2);
    plank.rotation.x = tilt;
  });
  // Safety barriers along the edge, open at the bridge.
  for (const [x0, x1] of [[-34, -3], [3, 34]]) S.fence(ctx, { x0, z0: RAVINE.z0 - 0.5, x1, z1: RAVINE.z0 - 0.5, h: 0.9, color: 0xff7b54 });
  P.sign(ctx, { x: -3.6, z: 3.8, text: 'הגשר שבור!', bg: '#e0603a', rotY: Math.PI - 0.3 });
}

function towerCrane(ctx) {
  const x = -6, z = 1, top = 16;
  const steel = toon(0xffc107);
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  ctx.root.add(g);
  for (const [dx, dz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) S.part(g, P.GEO.box, steel, dx, top / 2, dz).scale.set(0.22, top, 0.22);
  for (let y = 1; y < top; y += 2) {
    S.part(g, P.GEO.box, steel, 0, y, -0.7).scale.set(1.5, 0.12, 0.12);
    S.part(g, P.GEO.box, steel, 0, y, 0.7).scale.set(1.5, 0.12, 0.12);
    S.part(g, P.GEO.box, steel, -0.7, y, 0).scale.set(0.12, 0.12, 1.5);
    S.part(g, P.GEO.box, steel, 0.7, y, 0).scale.set(0.12, 0.12, 1.5);
  }
  ctx.collision.addBox({ x, z, w: 1.6, d: 1.6, minY: 0, maxY: top + 1 });
  P.box(ctx, { x, z, w: 3, d: 3, h: 0.6, color: 0x8d8da8 });

  // Rotating top: jib, counter-jib, cabin, and a trolley carrying the new bridge beam.
  const head = new THREE.Group();
  head.position.set(x, top, z);
  ctx.root.add(head);
  const add = (geo, mat, px, py, pz, sx, sy, sz) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(px, py, pz);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    head.add(m);
    return m;
  };
  add(P.GEO.box, steel, 6, 0.4, 0, 15, 0.6, 0.9);
  add(P.GEO.box, steel, -3, 0.4, 0, 5, 0.6, 0.9);
  add(P.GEO.box, toon(0x8d8da8), -4.8, -0.3, 0, 1.6, 1.4, 1.4);
  add(P.GEO.box, toon(0x4fc3f7), 0, -0.6, 1.2, 1.6, 1.4, 1.4);
  const hook = new THREE.Group();
  hook.position.x = 7;
  head.add(hook);
  const cable = new THREE.Mesh(P.GEO.cyl, toon(0x2a1b4d));
  const block = new THREE.Mesh(P.GEO.box, toon(0x8d8da8));
  block.scale.set(0.6, 0.3, 0.3);
  const beam = new THREE.Group();
  const steelBeam = new THREE.Mesh(P.GEO.box, toon(0xff7b54));
  steelBeam.scale.set(1, 0.3, 8.2);
  steelBeam.castShadow = true;
  beam.add(steelBeam);
  for (const bz of [-2.5, 2.5]) {
    const strap = new THREE.Mesh(P.GEO.cyl, toon(0x2a1b4d));
    strap.scale.set(0.03, 0.6, 0.03);
    strap.position.set(0, 0.45, bz * 0.2);
    strap.rotation.x = bz > 0 ? -1.1 : 1.1;
    beam.add(strap);
  }
  hook.add(cable, block, beam);
  // drop = cable length below the jib.
  const setDrop = (drop) => {
    cable.scale.set(0.04, drop, 0.04);
    cable.position.y = -drop / 2;
    block.position.y = -drop;
    if (beam.parent === hook) beam.position.y = -drop - 0.5; // until it is set down
  };
  setDrop(11);
  head.rotation.y = 0.6;

  // Lookout platform on the mast, reached by a ladder.
  P.box(ctx, { x, z: z - 1.8, y: 5.8, w: 3, d: 2, h: 0.2, color: 0x8d8da8 });
  P.ladder(ctx, { x, z: z - 3.1, height: 6, color: 0xffc107 });
  S.fence(ctx, { x0: x - 1.5, z0: z - 2.8, x1: x - 0.7, z1: z - 2.8, y: 6, h: 0.8, color: 0xff7b54 });
  S.fence(ctx, { x0: x + 0.7, z0: z - 2.8, x1: x + 1.5, z1: z - 2.8, y: 6, h: 0.8, color: 0xff7b54 });
  P.sign(ctx, { x: x + 2.8, z: z - 3.6, text: 'מנוף', bg: '#e0a800', rotY: Math.PI + 0.4 });
  return { head, hook, beam, setDrop, top, x, z };
}

function conveyors(ctx) {
  const tex = stripes('#5d4a8a', '#7e6ab0');
  tex.repeat.set(4, 1);
  const beltMat = new THREE.MeshToonMaterial({ color: 0xffffff, map: tex });
  for (const z of [-17, -13.5]) {
    P.box(ctx, { x: 8, z, w: 10, d: 1.6, h: 0.75, color: 0x8d8da8 });
    const belt = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.4), beltMat);
    belt.rotation.x = -Math.PI / 2;
    belt.position.set(8, 0.77, z);
    ctx.root.add(belt);
    for (const x of [3, 13]) {
      const roller = new THREE.Mesh(P.GEO.cyl, toon(0xffc107));
      roller.scale.set(0.4, 1.7, 0.4);
      roller.rotation.x = Math.PI / 2;
      roller.position.set(x, 0.55, z);
      roller.userData.bake = true;
      ctx.root.add(roller);
    }
  }
  // Hopper at the start of the belts.
  const hop = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.6, 1.4, 16, 1, true), toon(0xff7b54, { side: THREE.DoubleSide }));
  hop.position.set(2, 2.1, -15.25);
  hop.userData.bake = true;
  ctx.root.add(hop);
  P.box(ctx, { x: 2, z: -15.25, w: 1.4, d: 1.4, h: 1.4, color: 0x5d4a8a });
  P.sign(ctx, { x: 8, z: -19.6, text: 'מסועים', bg: '#7e57c2', rotY: Math.PI });
  return tex;
}

function mixer(ctx) {
  P.box(ctx, { x: 17, z: -15, w: 2.4, d: 3.6, h: 1.2, color: 0x5d4a8a });
  const drum = new THREE.Group();
  drum.position.set(17, 2.6, -15);
  drum.rotation.x = 0.35;
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.2, 2.8, 18), toon(0xff7b54));
  shell.rotation.x = Math.PI / 2;
  shell.castShadow = true;
  drum.add(shell);
  for (let i = 0; i < 3; i++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.85 + i * 0.13, 0.06, 6, 20), toon(0xffffff));
    band.position.z = 0.8 - i * 0.8;
    drum.add(band);
  }
  ctx.root.add(drum);
  return drum;
}

function scaffolding(ctx) {
  const x = 15, z = 1.5, w = 8, d = 6;
  const pole = 0x8d8da8;
  for (const dx of [-w / 2, 0, w / 2]) for (const dz of [-d / 2, d / 2]) P.cylinder(ctx, { x: x + dx, z: z + dz, r: 0.1, h: 6.8, color: pole });
  // Level 1: full deck. Level 2: north half, reached from level 1.
  P.box(ctx, { x, z, y: 2.2, w: w + 0.2, d: d + 0.2, h: 0.2, color: 0xb07a4a });
  P.box(ctx, { x, z: z + d / 4, y: 4.6, w: w + 0.2, d: d / 2 + 0.1, h: 0.2, color: 0xb07a4a });
  P.box(ctx, { x, z, y: 2.4, w: w, d: 0.3, h: 2.2, color: 0xd9534f });
  P.ladder(ctx, { x: x - 2, z: z - d / 2 - 0.3, height: 2.4, color: 0xffc107 });
  P.ladder(ctx, { x: x + 2, z: z - 0.45, y: 2.4, height: 2.4, color: 0xffc107 });
  // Half-built brick walls on the ground floor.
  P.box(ctx, { x: x - w / 2 + 0.2, z, w: 0.3, d: d - 1, h: 1.2, color: 0xd9534f });
  P.box(ctx, { x: x + 1, z: z + d / 2 - 0.2, w: 5, d: 0.3, h: 0.9, color: 0xe86a5f });
  // Railings on the top deck.
  S.fence(ctx, { x0: x - w / 2, z0: z + d / 2, x1: x + w / 2, z1: z + d / 2, y: 4.8, h: 0.8, color: 0xff7b54 });
  // Golden helmet waiting at the very top.
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xffd23f, { emissive: 0xffb300, emissiveIntensity: 0.5 }));
  helmet.position.set(x - 2.5, 5.1, z + 2);
  ctx.root.add(helmet);
  ctx.interactions.addTrigger({
    x: x - 2.5, z: z + 2, r: 1.4, minY: 4.5, once: true,
    onEnter: () => {
      ctx.audio.play('secret');
      ctx.game.player.celebrate();
      const first = !ctx.save.flags.buildTop;
      ctx.game.ui.toast(first ? 'טיפסת עד הפסגה! מצאת קסדת זהב!' : 'הקסדה המוזהבת עדיין כאן!', 'secret');
      ctx.game.progress.setFlag('buildTop');
    },
  });
  P.sign(ctx, { x: x - 5.4, z: z - 4.6, text: 'פיגומים', bg: '#e0603a', rotY: Math.PI + 0.6 });
  return helmet;
}

function yardDecor(ctx) {
  // Brick piles and cones.
  const brick = [0xd9534f, 0xe86a5f];
  for (const [bx, bz] of [[-6, -18], [-24, -14], [24, -26], [-26, 2]]) {
    for (let i = 0; i < 9; i++) {
      P.box(ctx, { x: bx + (i % 3) * 0.62, z: bz, y: Math.floor(i / 3) * 0.32, w: 0.6, d: 1.1, h: 0.3, color: brick[i % 2], collide: false });
    }
    ctx.collision.addBox({ x: bx + 0.62, z: bz, w: 1.9, d: 1.2, minY: 0, maxY: 0.96 });
  }
  const coneG = new THREE.ConeGeometry(0.3, 0.8, 12);
  for (const [cx, cz] of [[-3, -24], [3.2, -12], [-3, -6], [6, 2], [-8, 3], [22, -6], [-30, -20]]) {
    const c = new THREE.Mesh(coneG, toon(0xff7b54));
    c.position.set(cx, 0.4, cz);
    c.castShadow = true;
    c.userData.bake = true;
    ctx.root.add(c);
    ctx.collision.addCylinder({ x: cx, z: cz, r: 0.3, minY: 0, maxY: 0.8 });
  }
  // Materials shed with three empty bins (they get filled in stage C).
  const shed = { x: -6, z: -8 };
  for (const [dx, dz] of [[-3.5, -2], [3.5, -2], [-3.5, 2], [3.5, 2]]) P.cylinder(ctx, { x: shed.x + dx, z: shed.z + dz, r: 0.15, h: 3.2, color: 0x8d8da8 });
  P.box(ctx, { x: shed.x, z: shed.z, y: 3.2, w: 8, d: 5, h: 0.25, color: 0xff7b54 });
  [[0xffd23f, -2.4], [0xffffff, 0], [0xd9534f, 2.4]].forEach(([c, dx]) => {
    P.box(ctx, { x: shed.x + dx, z: shed.z + 0.8, w: 1.8, d: 1.6, h: 0.9, color: c });
  });
  P.sign(ctx, { x: shed.x - 4.6, z: shed.z - 3, text: 'מחסן חומרים', bg: '#e0a800', rotY: Math.PI + 0.5 });

  // Site boundary: striped walls.
  const tex = stripes('#ff7b54', '#ffffff');
  tex.repeat.set(10, 1);
  const wallMat = new THREE.MeshToonMaterial({ map: tex });
  for (const [x, z, w, d] of [[0, 37, 80, 1], [-38, -2, 1, 80], [38, -2, 1, 80], [-21, -38.5, 34, 1], [21, -38.5, 34, 1], [0, -38, 8, 1]]) {
    P.box(ctx, { x, z, w, d, h: 2.4, mat: wallMat });
  }

  // Across the ravine: Shriron's muscle factory.
  P.box(ctx, { x: 0, z: 29, w: 18, d: 9, h: 8, color: 0xff6f61 });
  P.box(ctx, { x: 0, z: 29, y: 8, w: 18.6, d: 9.6, h: 0.5, color: 0xd9534f });
  P.box(ctx, { x: 0, z: 24.45, w: 4, d: 0.2, h: 4.5, color: 0x5d4a8a, collide: false });
  for (const sx of [-6, 6]) {
    P.cylinder(ctx, { x: sx, z: 24.6, y: 5.5, r: 0.9, h: 0.25, color: 0xffffff, collide: false });
  }
  for (const [x, z] of [[-14, 24], [14, 24], [-24, 30], [24, 30], [-28, 22], [28, 22]]) S.tree(ctx, { x, z, s: 1.2, leaf: 0x6fcf4a, leaf2: 0x4cbf5a });
  P.sign(ctx, { x: 6.5, z: 21, text: 'מפעל השרירים', bg: '#d9534f', rotY: Math.PI });
}

export function build(ctx) {
  const { game, npcs } = ctx;
  ctx.setEnv(P.environment(ctx, { skyTop: '#ffb86b', skyBottom: '#fff0d1', hemiSky: 0xfff6e0, hemiGround: 0xe3b574, fogNear: 50, fogFar: 130 }));
  ground(ctx);
  brokenBridge(ctx);
  const crane = towerCrane(ctx);
  const beltTex = conveyors(ctx);
  const drum = mixer(ctx);
  const helmet = scaffolding(ctx);
  yardDecor(ctx);

  const portal = S.portal(ctx, { x: 0, z: -33, rotY: 0, color: 0x9b7bff, label: 'מרכז העולם', to: 'hub', onEnter: () => game.travel('hub') });
  npcs.add(ctx, { id: 'shriron', x: 3.4, z: -23, rotY: Math.PI + 0.5, zone: 'construction' });

  return {
    title: ZONE_INFO.construction.title,
    spawn: SPAWN,
    spawns: { hub: SPAWN },
    bake: true,
    crane,
    update(dt, t) {
      portal.update(t);
      beltTex.offset.x = -t * 0.6;
      drum.rotation.z = t * 1.2;
      helmet.rotation.y = t * 1.5;

    },
  };
}
