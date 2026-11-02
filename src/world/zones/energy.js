import * as THREE from 'three';
import * as P from '../Props.js';
import * as S from '../Structures.js';
import { toon, cellTexture } from '../Materials.js';
import { ZONE_INFO } from '../../data/zones.js';

// Energy City: a city of power plants, rails and factories that went dark
// because its power station stopped. (Fixing it is a stage C mission.)

const SPAWN = { x: 0, y: 0, z: -28, yaw: 0 };

function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** Moving parts (train, gauge needle) are plain meshes that never get baked. */
function dyn(parent, geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

function skyline(ctx, rand) {
  const lit = toon(0xffd76a, { emissive: 0xffb300, emissiveIntensity: 0.45 });
  const dark = toon(0x3a3060);
  const colors = [0x4a3f7a, 0x55468a, 0x3f3570, 0x5d4a8a];
  const place = (x, z, rotY, w) => {
    const h = 6 + rand() * 9;
    P.box(ctx, { x, z, w, d: 5, h, rotY, color: colors[Math.floor(rand() * 4)] });
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    ctx.root.add(g);
    for (let y = 1.6; y < h - 1; y += 2) {
      for (let i = -1; i <= 1; i++) {
        S.part(g, P.GEO.box, rand() < 0.25 ? lit : dark, i * (w / 3.4), y, 2.53, { cast: false }).scale.set(0.9, 1.1, 0.06);
      }
    }
  };
  for (let x = -33; x <= 33; x += 6) place(x, 36, Math.PI, 5.6);
  for (let z = -30; z <= 30; z += 6) {
    place(-36, z, Math.PI / 2, 5.6);
    place(36, z, -Math.PI / 2, 5.6);
  }
  for (let x = -33; x <= 33; x += 6) if (Math.abs(x) > 5) place(x, -38, 0, 5.6);
}

function train(ctx) {
  const g = new THREE.Group();
  g.position.set(-28, 0, -2);
  ctx.root.add(g);
  const red = toon(0xff5d6c), navy = toon(0x2a1b4d), gold = toon(0xffd23f), wheel = toon(0x3c3c50);
  const body = dyn(g, P.GEO.box, navy, 0, 1.0, 1);
  body.scale.set(2, 1.0, 4.6);
  const boiler = dyn(g, P.GEO.cyl, red, 0, 1.9, 1.6);
  boiler.scale.set(0.8, 3, 0.8);
  boiler.rotation.x = Math.PI / 2;
  dyn(g, P.GEO.box, red, 0, 2.3, -0.9).scale.set(2, 2.4, 1.6);
  dyn(g, P.GEO.box, gold, 0, 3.6, -0.9).scale.set(2.3, 0.2, 1.9);
  dyn(g, P.GEO.cyl, navy, 0, 3.0, 2.6).scale.set(0.28, 1.2, 0.28);
  const lamp = dyn(g, P.GEO.sphere, toon(0xfff3b0, { emissive: 0xfff3b0, emissiveIntensity: 0 }), 0, 1.9, 3.15);
  lamp.scale.setScalar(0.3);
  for (const z of [-0.8, 0.8, 2.3]) {
    for (const side of [-1, 1]) {
      const w = dyn(g, P.GEO.cyl, wheel, side * 1.0, 0.45, z);
      w.scale.set(0.45, 0.2, 0.45);
      w.rotation.z = Math.PI / 2;
    }
  }
  const colliders = [ctx.collision.addBox({ x: -28, z: -1.2, w: 2.2, d: 5, minY: 0, maxY: 3.6 })];
  // Two wagons loaded with grain sacks.
  const sack = toon(0xf2c98a);
  [-5.5, -10.5].forEach((z, i) => {
    dyn(g, P.GEO.box, i ? toon(0x2fd6c3) : toon(0xffb300), 0, 1.1, z).scale.set(2, 1.2, 4);
    for (const [sx, sz] of [[-0.45, -1], [0.45, -1], [0, 0], [-0.45, 1], [0.45, 1]]) {
      dyn(g, P.GEO.sphere, sack, sx, 1.9, z + sz).scale.set(0.45, 0.35, 0.55);
    }
    for (const wz of [-1.3, 1.3]) {
      for (const side of [-1, 1]) {
        const w = dyn(g, P.GEO.cyl, wheel, side * 1.0, 0.4, z + wz);
        w.scale.set(0.4, 0.2, 0.4);
        w.rotation.z = Math.PI / 2;
      }
    }
    colliders.push(ctx.collision.addBox({ x: -28, z: -2 + z, w: 2.2, d: 4.2, minY: 0, maxY: 2.3 }));
  });
  return { group: g, lamp, colliders };
}

function powerStation(ctx) {
  const root = ctx.root;
  P.box(ctx, { x: 0, z: 25, w: 18, d: 9, h: 7, color: 0x5d4a8a });
  P.box(ctx, { x: 0, z: 25, y: 7, w: 18.6, d: 9.6, h: 0.5, color: 0x7e57c2 });
  P.box(ctx, { x: 0, z: 20.45, w: 3, d: 0.2, h: 3.4, color: 0x2a1b4d, collide: false });
  const win = toon(0x3a3060);
  for (const x of [-6, -3.2, 3.2, 6]) P.box(ctx, { x, z: 20.45, y: 3.6, w: 1.8, d: 0.15, h: 2, color: 0x3a3060, collide: false, mat: win });
  // Striped chimneys with warning lights.
  const lights = [];
  for (const x of [-6, 6]) {
    for (let i = 0; i < 7; i++) P.cylinder(ctx, { x, z: 26.5, y: 7.5 + i * 1.6, r: 1.2 - i * 0.04, h: 1.6, color: i % 2 ? 0xffffff : 0xff5d6c, collide: i === 0 });
    const l = new THREE.Mesh(P.GEO.sphere, toon(0xff3b3b, { emissive: 0xff0000, emissiveIntensity: 1 }));
    l.scale.setScalar(0.35);
    l.position.set(x, 18.9, 26.5);
    root.add(l);
    lights.push(l);
  }
  // A giant light bulb on the roof: dark until the station works again.
  const bulb = new THREE.Mesh(P.GEO.sphere, toon(0xfff3b0, { emissive: 0xffd23f, emissiveIntensity: 0 }));
  bulb.scale.setScalar(1.6);
  bulb.position.set(0, 9.7, 23.5);
  root.add(bulb);
  P.cylinder(ctx, { x: 0, z: 23.5, y: 7.5, r: 0.8, h: 1.1, color: 0x9e9eb8, collide: false });

  // Generator in front of the station, with three hoppers waiting for fuel.
  P.box(ctx, { x: 0, z: 15.5, w: 7, d: 3.4, h: 1, color: 0x4a3f7a });
  const drum = new THREE.Mesh(P.GEO.cyl, toon(0x9e9eb8));
  drum.scale.set(1.3, 5, 1.3);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(0, 2.3, 15.5);
  drum.castShadow = true;
  drum.userData.bake = true;
  root.add(drum);
  ctx.collision.addBox({ x: 0, z: 15.5, w: 5, d: 2.6, minY: 1, maxY: 3.6 });
  [[-1.6, 0xffd23f], [0, 0xff9b54], [1.6, 0xd9a05b]].forEach(([x, c]) => {
    const hop = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.2, 16, 1, true), toon(c, { side: THREE.DoubleSide }));
    hop.rotation.x = Math.PI;
    hop.position.set(x, 4.0, 15.5);
    hop.userData.bake = true;
    root.add(hop);
  });
  for (const side of [-1, 1]) S.pipe(ctx, { a: [side * 2.5, 2.3, 15.5], b: [side * 2.5, 2.3, 20.4], r: 0.25, color: 0xffb300 });
  // Big gauge on the station wall. The needle rests at zero for now.
  const gauge = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32), toon(0xffffff));
  gauge.position.set(0, 5.2, 20.38);
  gauge.rotation.y = Math.PI;
  root.add(gauge);
  const needle = new THREE.Mesh(P.GEO.box, toon(0xff3b3b));
  needle.scale.set(0.08, 0.9, 0.05);
  const pivot = new THREE.Group();
  pivot.position.set(0, 5.2, 20.32);
  needle.position.y = 0.4;
  pivot.add(needle);
  root.add(pivot);
  return { lights, bulb, needlePivot: pivot };
}

function factories(ctx) {
  // Factory with a saw-tooth roof and a fan.
  P.box(ctx, { x: 18, z: -8, w: 9, d: 7, h: 4.5, color: 0x6a5aa0 });
  for (let i = 0; i < 3; i++) {
    const tooth = new THREE.Mesh(P.GEO.box, toon(0x8f84d6));
    tooth.scale.set(3, 0.3, 7.2);
    tooth.position.set(14.8 + i * 3, 5.1, -8);
    tooth.rotation.z = 0.45;
    tooth.userData.bake = true;
    ctx.root.add(tooth);
  }
  P.cylinder(ctx, { x: 21.5, z: -5.5, y: 4.5, r: 0.5, h: 4, color: 0x9e9eb8, collide: false });
  const fan = new THREE.Group();
  fan.position.set(13.45, 2.6, -8);
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(P.GEO.box, toon(0xffd23f));
    blade.scale.set(0.08, 1.4, 0.3);
    blade.position.y = 0.6;
    const arm = new THREE.Group();
    arm.rotation.x = (i / 3) * Math.PI * 2;
    arm.add(blade);
    fan.add(arm);
  }
  ctx.root.add(fan);
  P.sign(ctx, { x: 12.6, z: -12.6, text: 'מפעל', bg: '#7e57c2', rotY: -2.4 });

  // Flat-roof factory with a crate staircase up to a secret on the roof.
  P.box(ctx, { x: 18, z: 4, w: 9, d: 6, h: 4, color: 0x55468a });
  P.box(ctx, { x: 18, z: 4, y: 4, w: 9.4, d: 6.4, h: 0.25, color: 0x7e57c2 });
  const crate = 0xb07a4a;
  P.box(ctx, { x: 11.4, z: 0.2, w: 1.4, d: 1.4, h: 1.2, color: crate });
  P.box(ctx, { x: 11.4, z: 1.9, w: 1.4, d: 1.4, h: 2.4, color: 0xc48a5a });
  P.box(ctx, { x: 12.7, z: 3.6, w: 1.4, d: 1.4, h: 3.6, color: crate });
  const battery = new THREE.Group();
  battery.position.set(19.5, 4.25, 5);
  const cell = new THREE.Mesh(P.GEO.cyl, toon(0x2fd6c3, { emissive: 0x2fd6c3, emissiveIntensity: 0.5 }));
  cell.scale.set(0.35, 0.9, 0.35);
  cell.position.y = 0.45;
  const cap = new THREE.Mesh(P.GEO.cyl, toon(0xffd23f));
  cap.scale.set(0.15, 0.15, 0.15);
  cap.position.y = 0.98;
  battery.add(cell, cap);
  ctx.root.add(battery);
  ctx.interactions.addTrigger({
    x: 19.5, z: 5, r: 1.6, minY: 3.8, once: true,
    onEnter: () => {
      ctx.audio.play('secret');
      ctx.game.player.celebrate();
      const first = !ctx.save.flags.energyRoof;
      ctx.game.ui.toast(first ? 'מצאת סוללה סודית על הגג!' : 'הסוללה הסודית עדיין כאן!', 'secret');
      ctx.game.progress.setFlag('energyRoof');
    },
  });
  return { fan, battery };
}

export function build(ctx) {
  const { root, game, npcs } = ctx;
  const env = P.environment(ctx, {
    skyTop: '#140d33', skyBottom: '#4a2f7a', hemiSky: 0x9a8fe0, hemiGround: 0x3a2a5a, hemi: 1.25, sun: 1.1, fogNear: 35, fogFar: 100,
  });
  env.sun.color.set(0xb8b0ff);
  ctx.setEnv(env);
  const rand = seeded(42);

  const tex = cellTexture('#4d4370', '#433a63', 5);
  P.floor(ctx, { x0: -40, x1: 40, z0: -42, z1: 40, texture: tex, tile: 8 });
  tex.dispose();
  P.box(ctx, { x: 0, z: -11, y: -0.98, w: 6, d: 38, h: 1, color: 0x3a3156, cast: false, collide: false });
  const moon = new THREE.Mesh(P.GEO.sphere, new THREE.MeshBasicMaterial({ color: 0xfff6d6, fog: false }));
  moon.scale.setScalar(9);
  moon.position.set(-70, 80, 120);
  root.add(moon);

  skyline(ctx, rand);
  const station = powerStation(ctx);
  const fac = factories(ctx);
  const tr = train(ctx);

  // ---- Rails around the city and the train station ----
  S.rails(ctx, [[-24, -24], [24, -24], [28, -20], [28, 8], [24, 12], [-24, 12], [-28, 8], [-28, -20]], { closed: true });
  P.box(ctx, { x: -24.2, z: -2, w: 4.4, d: 16, h: 0.75, color: 0x9e8fb2 });
  P.box(ctx, { x: -26.3, z: -2, y: 0.75, w: 0.2, d: 16, h: 0.02, color: 0xffd23f, collide: false });
  P.stairs(ctx, { x: -20.2, z: -2, rotY: -Math.PI / 2, steps: 3, stepH: 0.25, depth: 0.6, w: 3, colors: [0xb3a6c9, 0x9e8fb2] });
  for (const z of [-8, 4]) for (const x of [-25.8, -22.6]) P.cylinder(ctx, { x, z, y: 0.75, r: 0.12, h: 2.6, color: 0xffd23f });
  P.box(ctx, { x: -24.2, z: -2, y: 3.35, w: 4.8, d: 14, h: 0.3, color: 0xff5d6c });
  P.sign(ctx, { x: -21.2, z: 6.8, text: 'תחנת רכבת', bg: '#e0603a', rotY: 2.6 });

  // ---- Main street with lamps that are switched off ----
  const lamps = [];
  for (let z = -22; z <= 8; z += 7.5) {
    for (const x of [-4, 4]) lamps.push(S.lamp(ctx, { x, z, color: 0x3a3060, on: false }));
  }
  const guide = [];
  const dotMat = toon(0x2fd6c3, { emissive: 0x2fd6c3, emissiveIntensity: 0.8 });
  for (let z = -24; z <= 12; z += 3) {
    const d = new THREE.Mesh(P.GEO.cyl, dotMat);
    d.scale.set(0.18, 0.03, 0.18);
    d.position.set(0, 0.03, z);
    root.add(d);
    guide.push(d);
  }

  // ---- Grain silos: bread, rice and pasta start here ----
  for (const [i, x] of [-20, -15.5, -11].entries()) {
    P.cylinder(ctx, { x, z: 26, r: 1.9, h: 7, color: i === 1 ? 0xf2c98a : 0xe8b878 });
    for (const y of [2, 4.5]) P.cylinder(ctx, { x, z: 26, y, r: 1.95, h: 0.25, color: 0xd9a05b, collide: false });
    const top = new THREE.Mesh(new THREE.SphereGeometry(1.9, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xff9b54));
    top.position.set(x, 7, 26);
    top.userData.bake = true;
    root.add(top);
  }
  P.sign(ctx, { x: -15.5, z: 21.6, text: 'מחסן דגנים', bg: '#e08a00', rotY: Math.PI });

  // ---- Battery tower with a ladder and a view ----
  P.box(ctx, { x: 14, z: -20, w: 3, d: 3, h: 5, color: 0x2fd6c3 });
  for (const y of [1.2, 2.6, 4]) P.box(ctx, { x: 14, z: -20, y, w: 3.1, d: 3.1, h: 0.25, color: 0xffd23f, collide: false });
  P.cylinder(ctx, { x: 14, z: -20, y: 5, r: 0.6, h: 0.5, color: 0xffd23f });
  P.ladder(ctx, { x: 14, z: -21.8, height: 5, color: 0xffd23f });
  P.sign(ctx, { x: 10.6, z: -22.6, text: 'מגדל הסוללה', bg: '#17a596', rotY: -2.3 });

  // ---- Power pylons and cables ----
  for (const x of [-12, 12]) {
    P.box(ctx, { x, z: 16, w: 0.6, d: 0.6, h: 10, color: 0x8d8da8 });
    P.box(ctx, { x, z: 16, y: 8.5, w: 4, d: 0.3, h: 0.3, color: 0x8d8da8, collide: false });
    for (const s of [-1, 1]) S.pipe(ctx, { a: [x + s * 1.8, 8.8, 16], b: [Math.sign(x) * 8.5 + s * 0.4, 6.5, 20.5], r: 0.05, color: 0x2a1b4d, collide: false });
  }

  // ---- A small park ----
  for (const [x, z] of [[-14, -14], [-10, -18], [-17, -8], [8, -12], [-9, 4]]) S.tree(ctx, { x, z, s: 1.1, leaf: 0x3f8a6a, leaf2: 0x4fa57a });
  S.bench(ctx, { x: -12, z: -11, rotY: 0.8, color: 0xff9b54 });
  P.sign(ctx, { x: -5, z: 13.6, text: 'תחנת הכוח', bg: '#e08a00', rotY: Math.PI + 0.3 });

  // ---- Way home and our guide ----
  P.box(ctx, { x: 0, z: -37.5, w: 18, d: 1, h: 2.2, color: 0x4a3f7a });
  const portal = S.portal(ctx, { x: 0, z: -33, rotY: 0, color: 0x9b7bff, label: 'מרכז העולם', to: 'hub', onEnter: () => game.travel('hub') });
  npcs.add(ctx, { id: 'pipetin', x: 3.2, z: -23, rotY: Math.PI + 0.5, zone: 'energy' });

  return {
    title: ZONE_INFO.energy.title,
    spawn: SPAWN,
    spawns: { hub: SPAWN },
    bake: true,
    lamps,
    train: tr,
    station,
    update(dt, t) {
      portal.update(t);
      const on = Math.sin(t * 3) > 0.3;
      for (const l of station.lights) l.material.emissiveIntensity = on ? 1 : 0.15;
      station.needlePivot.rotation.z = 1.2 + Math.sin(t * 9) * 0.04; // stuck at zero, twitching
      fac.fan.rotation.x = t * 0.4;
      fac.battery.rotation.y = t * 1.5;
      fac.battery.position.y = 4.35 + Math.sin(t * 2.5) * 0.1;
      dotMat.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.3;
    },
  };
}
