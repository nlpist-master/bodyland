import * as THREE from 'three';
import * as P from '../Props.js';
import * as S from '../Structures.js';
import { toon, cellTexture, canvasTexture } from '../Materials.js';
import { ZONE_INFO } from '../../data/zones.js';

// The Water Kingdom: a river with bridges and lily pads, a waterfall, a
// big dam holding back a reservoir, leaking pipes and a water tower.
// Fixing pipes and opening the dam are stage C missions.

const SPAWN = { x: 0, y: 0, z: -28, yaw: 0 };
const RIVER = { z0: -4, z1: 6 };

function river(ctx) {
  const tex = cellTexture('#9fd6c8', '#8cc9bb', 17);
  P.floor(ctx, { x0: -40, x1: 40, z0: -42, z1: RIVER.z0, texture: tex, tile: 7 });
  P.floor(ctx, { x0: -40, x1: 40, z0: RIVER.z1, z1: 40, texture: tex, tile: 7 });
  tex.dispose();
  const bank = { color: 0x7fa6c0, collide: false, cast: false, y: -3, h: 2.98 };
  P.box(ctx, { ...bank, x: 0, z: RIVER.z0 + 0.25, w: 80, d: 0.5 });
  P.box(ctx, { ...bank, x: 0, z: RIVER.z1 - 0.25, w: 80, d: 0.5 });
  P.box(ctx, { x: 0, z: 1, y: -3.5, w: 80, d: 10, h: 0.5, color: 0x3f6f9a, collide: false, cast: false });
  ctx.collision.killY = -1.3;
  const water = S.water(ctx, { x0: -40, x1: 40, z0: RIVER.z0, z1: RIVER.z1, y: -0.6, color: 0x29a8e0, speed: 0.15 });

  // Main bridge.
  P.box(ctx, { x: 0, z: 1, y: -0.25, w: 3.4, d: 11.4, h: 0.35, color: 0xb07a4a });
  for (const x of [-1.6, 1.6]) S.fence(ctx, { x0: x, z0: RIVER.z0 - 0.6, x1: x, z1: RIVER.z1 + 0.6, h: 0.9, color: 0xffffff });
  // Pipe bridge (narrow!) and lily pads.
  S.pipe(ctx, { a: [16, -0.2, RIVER.z0 - 1], b: [16, -0.2, RIVER.z1 + 1], r: 0.5, color: 0xff9b54 });
  const pads = [];
  for (const [x, z] of [[-15, -3], [-16.4, -1.2], [-15, 0.6], [-16.2, 2.5], [-15.2, 4.4]]) {
    P.cylinder(ctx, { x, z, y: -0.7, r: 0.75, h: 0.3, color: 0x4cbf5a });
    const flower = new THREE.Mesh(P.GEO.sphere, toon(0xff8fb1));
    flower.scale.set(0.2, 0.12, 0.2);
    flower.position.set(x + 0.35, -0.35, z + 0.2);
    flower.userData.bake = true;
    ctx.root.add(flower);
    pads.push(flower);
  }
  // A little boat bobbing on the river.
  const boat = new THREE.Group();
  boat.position.set(8, -0.6, 1);
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.7, 0.6, 12, 1, false, 0, Math.PI), toon(0xff5d6c));
  hull.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  hull.scale.set(1, 2.2, 1);
  boat.add(hull);
  const mast = new THREE.Mesh(P.GEO.cyl, toon(0xffffff));
  mast.scale.set(0.05, 2, 0.05);
  mast.position.y = 1;
  const sail = new THREE.Mesh(new THREE.CircleGeometry(0.8, 3), toon(0xffd23f, { side: THREE.DoubleSide }));
  sail.position.set(0, 1.2, 0.3);
  sail.rotation.y = Math.PI / 2;
  boat.add(mast, sail);
  ctx.root.add(boat);
  return { water, boat };
}

function waterfall(ctx) {
  // Cliff at the west end of the river with water pouring down into it.
  P.box(ctx, { x: -35, z: 1, w: 8, d: 16, h: 9, color: 0x8e9fb8 });
  for (const [x, z, s, h] of [[-31, -7, 3, 5], [-31, 9, 3, 6], [-34, 10, 4, 9], [-34, -8, 4, 8]]) S.rock(ctx, { x, z, s, h, color: 0x9eb0c8 });
  const tex = canvasTexture(64, 128, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#bff1ff';
    g.lineWidth = 4;
    for (let x = 4; x < w; x += 9) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + 2, h);
      g.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 9.6), new THREE.MeshToonMaterial({ color: 0x5fd0ff, map: tex, transparent: true, opacity: 0.9 }));
  fall.position.set(-30.9, 4.2, 1);
  fall.rotation.y = Math.PI / 2;
  ctx.root.add(fall);
  const foam = [];
  for (let i = 0; i < 8; i++) {
    const f = new THREE.Mesh(P.GEO.sphere, toon(0xffffff));
    f.scale.setScalar(0.5 + (i % 3) * 0.2);
    f.position.set(-30.2 + (i % 2) * 0.6, -0.5, -3 + i * 1.1);
    ctx.root.add(f);
    foam.push(f);
  }
  P.sign(ctx, { x: -24, z: -6.4, text: 'מפל', bg: '#1e88e5', rotY: Math.PI / 2 + 0.6 });
  return { tex, foam };
}

function dam(ctx) {
  const top = 6;
  // The dam wall, a reservoir behind it and three closed floodgates.
  P.box(ctx, { x: 0, z: 27, w: 48, d: 2, h: top, color: 0xa7b4c8 });
  for (const [x, z, w, d] of [[-24.5, 33, 1, 13], [24.5, 33, 1, 13], [0, 39, 50, 1]]) P.box(ctx, { x, z, w, d, h: top + 0.6, color: 0xa7b4c8 });
  ctx.collision.addBox({ x: 0, z: 33, w: 48, d: 10, minY: 0, maxY: top - 1 }); // reservoir is deep and solid below the surface
  const res = S.water(ctx, { x0: -24, x1: 24, z0: 28, z1: 38.5, y: top - 0.6, color: 0x29a8e0, speed: 0.02 });
  S.fence(ctx, { x0: -24, z0: 27.9, x1: 24, z1: 27.9, y: top, h: 0.9, color: 0xffffff });
  const gates = [];
  for (const x of [-9, 0, 9]) {
    const gate = P.box(ctx, { x, z: 25.85, w: 3.4, d: 0.3, h: 4.2, color: 0x4f7fa8, dynamic: true });
    for (let i = 0; i < 3; i++) P.box(ctx, { x, z: 25.68, y: 0.8 + i * 1.3, w: 3.4, d: 0.06, h: 0.15, color: 0xffd23f, collide: false, dynamic: true });
    P.box(ctx, { x, z: 16, y: -0.98, w: 3, d: 18, h: 1, color: 0x9eb0c8, collide: false, cast: false });
    gates.push(gate);
  }
  P.stairs(ctx, { x: 22, z: 26 - 12, steps: 20, stepH: 0.3, depth: 0.6, w: 2.4, colors: [0xc8d2e0, 0xa7b4c8] });
  P.sign(ctx, { x: -14, z: 23.4, text: 'הסכר', bg: '#1e88e5', rotY: Math.PI });
  return { res, gates };
}

function pipes(ctx) {
  const blue = 0x4fc3f7, steel = 0x8da2b8;
  const drips = [];
  S.pipe(ctx, { a: [10, 0.5, -12], b: [30, 0.5, -12], r: 0.5, color: blue });
  S.pipe(ctx, { a: [10, 0.5, -20], b: [17.5, 0.5, -20], r: 0.5, color: blue });
  S.pipe(ctx, { a: [19.5, 0.5, -20], b: [30, 0.5, -20], r: 0.5, color: blue });
  S.pipe(ctx, { a: [10, 0, -12], b: [10, 3.5, -12], r: 0.5, color: steel });
  S.pipe(ctx, { a: [30, 0, -20], b: [30, 3.5, -20], r: 0.5, color: steel });
  for (const [x, z] of [[10, -12], [30, -20]]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.09, 8, 18), toon(0xff5d6c));
    wheel.position.set(x, 3.7, z);
    wheel.rotation.x = Math.PI / 2;
    ctx.root.add(wheel);
  }
  // The broken gap: water leaking out (fixed in stage C).
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Mesh(P.GEO.sphere, toon(0x4fc3f7, { emissive: 0x1e88e5, emissiveIntensity: 0.2 }));
    d.scale.set(0.12, 0.18, 0.12);
    ctx.root.add(d);
    drips.push({ d, phase: i / 6 });
  }
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1.4, 20), toon(0x4fc3f7));
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(18.5, 0.02, -20);
  ctx.root.add(puddle);
  P.sign(ctx, { x: 8, z: -16, text: 'צינורות', bg: '#1e88e5', rotY: -Math.PI / 2 - 0.4 });
  return { drips, puddle };
}

function waterTower(ctx) {
  const x = -18, z = -18;
  for (const [dx, dz] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) P.cylinder(ctx, { x: x + dx, z: z + dz, r: 0.2, h: 6, color: 0x8da2b8 });
  P.cylinder(ctx, { x, z, y: 6, r: 3, h: 0.25, color: 0x8da2b8 });
  P.cylinder(ctx, { x, z, y: 6.25, r: 2.2, h: 3.6, color: 0x4fc3f7 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.4, 20), toon(0x1e88e5));
  roof.position.set(x, 10.55, z);
  roof.userData.bake = true;
  ctx.root.add(roof);
  P.ladder(ctx, { x, z: z - 3.3, height: 6.25, color: 0xffd23f });
  P.sign(ctx, { x: x + 4.2, z: z - 3, text: 'מגדל המים', bg: '#1e88e5', rotY: Math.PI + 0.5 });
  ctx.interactions.addTrigger({
    x, z: z - 2.6, r: 1.2, minY: 6, once: true,
    onEnter: () => {
      ctx.audio.play('secret');
      ctx.game.player.celebrate();
      const first = !ctx.save.flags.waterTower;
      ctx.game.ui.toast(first ? 'טיפסת על מגדל המים! איזה נוף!' : 'שוב על מגדל המים!', 'secret');
      ctx.game.progress.setFlag('waterTower');
    },
  });
}

export function build(ctx) {
  const { game, npcs } = ctx;
  ctx.setEnv(P.environment(ctx, { skyTop: '#3fb6ff', skyBottom: '#d9f4ff', hemiSky: 0xf0fbff, hemiGround: 0x7fc0b0, fogNear: 50, fogFar: 130 }));
  const riv = river(ctx);
  const fall = waterfall(ctx);
  const d = dam(ctx);
  const leak = pipes(ctx);
  waterTower(ctx);

  // Border: low stone walls and round rocks.
  for (const [x, z, w, dd] of [[-38.5, -18, 1, 44], [38.5, 0, 1, 80], [-21, -38.5, 34, 1], [21, -38.5, 34, 1], [0, -38, 8, 1]]) {
    P.box(ctx, { x, z, w, d: dd, h: 2, color: 0xa7b4c8 });
  }
  for (const [x, z, s] of [[-30, 22, 3], [-26, 30, 3.5], [30, 14, 3], [32, -28, 3], [-32, -30, 3.2]]) S.rock(ctx, { x, z, s, h: s * 1.2, color: 0x9eb0c8 });
  for (const [x, z] of [[-8, -16], [6, -26], [-26, 14], [12, 16], [-12, 18]]) S.tree(ctx, { x, z, leaf: 0x4fc3a0, leaf2: 0x6fd6b0 });
  const bubbles = P.floatingCells(ctx, { count: 30, radiusMin: 8, radiusMax: 40, yMin: 3, yMax: 12, color: 0xd6f6ff, seed: 5, size: [0.15, 0.45], flat: 1 });

  const portal = S.portal(ctx, { x: 0, z: -33, rotY: 0, color: 0x9b7bff, label: 'מרכז העולם', to: 'hub', onEnter: () => game.travel('hub') });
  npcs.add(ctx, { id: 'tiptip', x: 3.4, z: -23, rotY: Math.PI + 0.5, zone: 'water' });

  return {
    title: ZONE_INFO.water.title,
    spawn: SPAWN,
    spawns: { hub: SPAWN },
    bake: true,
    gates: d.gates,
    leak,
    update(dt, t) {
      portal.update(t);
      riv.water.update(t);
      d.res.update(t);
      bubbles.update(t * 0.5);
      fall.tex.offset.y = t * 1.4;
      for (let i = 0; i < fall.foam.length; i++) fall.foam[i].position.y = -0.5 + Math.abs(Math.sin(t * 3 + i)) * 0.35;
      riv.boat.position.y = -0.6 + Math.sin(t * 1.5) * 0.08;
      riv.boat.rotation.z = Math.sin(t * 1.1) * 0.06;
      for (const { d: drop, phase } of leak.drips) {
        const k = (t * 0.9 + phase) % 1;
        drop.position.set(18.5 + Math.sin(phase * 20) * 0.3, 0.6 - k * 0.6 + Math.sin(k * Math.PI) * 0.5, -20 + Math.cos(phase * 20) * 0.3);
      }
    },
  };
}
