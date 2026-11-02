import * as THREE from 'three';
import * as P from '../Props.js';
import * as S from '../Structures.js';
import { toon, cellTexture, canvasTexture } from '../Materials.js';
import { ZONE_INFO } from '../../data/zones.js';

// The heart of BIOVERSE: a round plaza with a beating heart fountain,
// Mochi's command center, and a ring of portals to every zone.

const SPAWN = { x: 0, y: 0, z: -6, yaw: 0 };
const RING = 18;
// Clockwise from the command center (north, +z).
const GATES = [
  ['energy', 51], ['construction', 103], ['jungle', 154], ['water', 206], ['life', 257], ['arena', 309],
];
const rad = (deg) => (deg * Math.PI) / 180;

/** Little landmark next to each portal so kids can tell the gates apart. */
function landmark(ctx, id, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  ctx.root.add(g);
  P.cylinder(ctx, { x, z, r: 0.7, h: 0.8, color: 0xf3e9ff });
  const at = (geo, color, px, py, pz, sx = 1, sy = sx, sz = sx) => S.part(g, geo, toon(color), px, py, pz).scale.set(sx, sy, sz);
  if (id === 'energy') {
    at(P.GEO.sphere, 0xd9a05b, 0, 1.15, 0, 0.6, 0.38, 0.4); // loaf of bread
    at(P.GEO.sphere, 0xf2c98a, 0, 1.3, 0, 0.45, 0.16, 0.3);
  } else if (id === 'construction') {
    at(P.GEO.box, 0xd9534f, -0.25, 0.95, 0, 0.45, 0.3, 0.6);
    at(P.GEO.box, 0xe86a5f, 0.25, 0.95, 0, 0.45, 0.3, 0.6);
    at(P.GEO.box, 0xd9534f, 0, 1.25, 0, 0.45, 0.3, 0.6);
  } else if (id === 'jungle') {
    at(P.GEO.sphere, 0xff4d4d, 0, 1.25, 0, 0.5);
    at(P.GEO.cyl, 0x6b3e26, 0, 1.8, 0, 0.04, 0.25, 0.04);
    at(P.GEO.sphere, 0x4cbf5a, 0.15, 1.85, 0, 0.18, 0.08, 0.1);
  } else if (id === 'water') {
    at(P.GEO.sphere, 0x4fc3f7, 0, 1.25, 0, 0.45);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.55, 18), toon(0x4fc3f7));
    tip.position.y = 1.72;
    tip.userData.bake = true;
    g.add(tip);
  } else if (id === 'life') {
    at(P.GEO.box, 0xfff1d6, 0, 1.15, 0, 0.7, 0.6, 0.6);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.5, 4), toon(0xff7b54));
    roof.position.y = 1.7;
    roof.rotation.y = Math.PI / 4;
    roof.userData.bake = true;
    g.add(roof);
  } else {
    at(P.GEO.cyl, 0x2fd6c3, 0, 0.9, 0, 0.55, 0.15, 0.55);
    at(P.GEO.sphere, 0xffd23f, 0, 1.35, 0, 0.25);
  }
}

/** Big screen in the command center with a map of all zones. */
function mapTexture() {
  return canvasTexture(512, 320, (g, w, h) => {
    g.fillStyle = '#1b1240';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2fd6c3';
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, h - 12);
    const cx = w / 2, cy = h / 2 + 6;
    g.fillStyle = '#ff5d6c';
    g.beginPath();
    g.arc(cx, cy, 22, 0, Math.PI * 2);
    g.fill();
    g.font = '700 22px Rubik, Arial';
    g.textAlign = 'center';
    g.direction = 'rtl';
    for (const [id, deg] of GATES) {
      const info = ZONE_INFO[id];
      const a = rad(deg);
      const x = cx - Math.sin(a) * 175, y = cy - Math.cos(a) * 105;
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(x, y);
      g.stroke();
      g.fillStyle = '#' + info.color.toString(16).padStart(6, '0');
      g.beginPath();
      g.arc(x, y, 14, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ffffff';
      g.fillText(info.short, x, y + 36 > h - 10 ? y - 22 : y + 36);
    }
  });
}

export function build(ctx) {
  const { root, game, npcs } = ctx;
  ctx.setEnv(P.environment(ctx, { skyTop: '#9d7bff', skyBottom: '#ffd6e8', hemiSky: 0xfff4fb, hemiGround: 0xd7a6ff, fogNear: 50, fogFar: 130 }));

  // ---- Ground ----
  const tex = cellTexture('#e9c9ff', '#d7a6ff', 21);
  P.floor(ctx, { x0: -40, x1: 40, z0: -40, z1: 40, texture: tex, tile: 7 });
  tex.dispose();
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(RING + 3, 48), toon(0xf6e6ff));
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.012;
  plaza.receiveShadow = true;
  root.add(plaza);
  const ringLine = new THREE.Mesh(new THREE.RingGeometry(RING + 2.6, RING + 3.1, 64), toon(0xc9a0ff));
  ringLine.rotation.x = -Math.PI / 2;
  ringLine.position.y = 0.02;
  root.add(ringLine);

  // ---- Outer border: soft hills and a ring of trees ----
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const r = 35 + (i % 3);
    S.rock(ctx, { x: Math.sin(a) * r, z: Math.cos(a) * r, s: 3.2 + (i % 4) * 0.6, h: 3 + (i % 5), color: i % 2 ? 0xd7a6ff : 0xc49bf0 });
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2;
    if (Math.abs(Math.sin(a)) < 0.2 && Math.cos(a) > 0) continue; // keep the command center clear
    S.tree(ctx, { x: Math.sin(a) * 28, z: Math.cos(a) * 28, s: 1 + (i % 3) * 0.2, leaf: 0xff8fb1, leaf2: 0xffb3cc, trunk: 0x9b6a8a });
  }

  // ---- Portals with colored paths ----
  const portals = [];
  const spawns = {};
  for (const [id, deg] of GATES) {
    const a = rad(deg), sx = Math.sin(a), cz = Math.cos(a);
    const info = ZONE_INFO[id];
    portals.push(S.portal(ctx, {
      x: sx * RING, z: cz * RING, rotY: a + Math.PI, color: info.color, bg: info.bg, label: info.short,
      onEnter: () => game.travel(id),
    }));
    spawns[id] = { x: sx * (RING - 3.5), y: 0, z: cz * (RING - 3.5), yaw: a + Math.PI };
    const path = new THREE.Mesh(P.GEO.box, toon(info.color));
    path.scale.set(1.6, 0.03, RING - 7);
    path.position.set(sx * (RING / 2 + 1.5), 0.02, cz * (RING / 2 + 1.5));
    path.rotation.y = a;
    path.receiveShadow = true;
    path.userData.bake = true;
    root.add(path);
    const side = S.frame(sx * (RING - 1.2), cz * (RING - 1.2), a)(3.4, 0);
    landmark(ctx, id, side[0], side[1]);
    const lampAt = S.frame(sx * 9, cz * 9, a)(1.6, 0);
    S.lamp(ctx, { x: lampAt[0], z: lampAt[1], light: 0xfff3b0 });
  }

  // ---- Heart fountain in the middle ----
  P.cylinder(ctx, { x: 0, z: 4, r: 3.4, h: 0.6, color: 0xff8fb1 });
  P.cylinder(ctx, { x: 0, z: 4, r: 0.6, h: 1.6, color: 0xffd1e0 });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.05, 36), toon(0xff5d6c, { emissive: 0xff2d55, emissiveIntensity: 0.25 }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.55, 4);
  root.add(pool);
  const heart = new THREE.Group();
  heart.position.set(0, 2.9, 4);
  const heartMat = toon(0xff3b6b, { emissive: 0xff2d55, emissiveIntensity: 0.35 });
  for (const side of [-1, 1]) {
    const lobe = new THREE.Mesh(P.GEO.sphere, heartMat);
    lobe.scale.setScalar(0.55);
    lobe.position.set(side * 0.38, 0.25, 0);
    heart.add(lobe);
  }
  const point = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.2, 24), heartMat);
  point.rotation.z = Math.PI;
  point.position.y = -0.35;
  heart.add(point);
  root.add(heart);

  // ---- Mochi's command center (north) with a balcony ----
  const cc = { x: 0, z: 27 };
  P.cylinder(ctx, { x: cc.x, z: cc.z, r: 5.5, h: 3.6, color: 0xffb3d1 });
  P.stairs(ctx, { x: 0, z: cc.z - 5.5 - 7.2, steps: 12, stepH: 0.3, depth: 0.6, w: 2.4, colors: [0xffd1e0, 0xffb3d1] });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3.2, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xffa6c9));
  dome.position.set(cc.x, 3.6, cc.z + 0.8);
  dome.castShadow = true;
  dome.userData.bake = true;
  root.add(dome);
  ctx.collision.addCylinder({ x: cc.x, z: cc.z + 0.8, r: 3, minY: 3.6, maxY: 6.6 });
  // Railing around the roof, open above the stairs (which face the plaza, angle PI).
  for (let i = 0; i < 18; i++) {
    const a0 = (i / 18) * Math.PI * 2, a1 = ((i + 1) / 18) * Math.PI * 2;
    if (Math.abs((a0 + a1) / 2 - Math.PI) < 0.4) continue;
    S.fence(ctx, {
      x0: cc.x + Math.sin(a0) * 5.3, z0: cc.z + Math.cos(a0) * 5.3,
      x1: cc.x + Math.sin(a1) * 5.3, z1: cc.z + Math.cos(a1) * 5.3,
      y: 3.6, h: 0.8, color: 0xffffff,
    });
  }
  // Big screen with the world map, facing the plaza.
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshBasicMaterial({ map: mapTexture() }));
  screen.position.set(cc.x, 5.4, 24.35);
  screen.rotation.y = Math.PI;
  root.add(screen);
  P.box(ctx, { x: cc.x, z: 24.5, y: 3.95, w: 4.5, d: 0.2, h: 2.9, color: 0x2a1b4d });
  const antenna = new THREE.Group();
  antenna.position.set(cc.x, 6.8, cc.z + 0.8);
  const mast = new THREE.Mesh(P.GEO.cyl, toon(0xdddddd));
  mast.scale.set(0.08, 1.4, 0.08);
  mast.position.y = 0.7;
  const blink = new THREE.Mesh(P.GEO.sphere, toon(0x2fd6c3, { emissive: 0x2fd6c3, emissiveIntensity: 1 }));
  blink.scale.setScalar(0.22);
  blink.position.y = 1.5;
  antenna.add(mast, blink);
  root.add(antenna);
  P.sign(ctx, { x: 3.2, z: 19.4, text: 'מרכז הפיקוד', bg: '#d93a7d', rotY: Math.PI });

  // ---- Benches, lamps and floating cells ----
  for (const [x, z, r] of [[-6, -1, 0.6], [6, -1, -0.6], [-7, 9, 2.5], [7, 9, -2.5]]) S.bench(ctx, { x, z, rotY: r, color: 0xff9b54 });
  const cells = P.floatingCells(ctx, { count: 30, radiusMin: 24, radiusMax: 46, yMin: 10, yMax: 22 });

  // Blood-vessel arches overhead with cells flowing through them.
  const vesselMat = toon(0xff7a9a);
  const flows = [];
  for (const rotY of [0.5, 2.1]) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(31, 0.9, 10, 64, Math.PI), vesselMat);
    arch.rotation.y = rotY;
    arch.userData.bake = true;
    root.add(arch);
    for (const end of [-1, 1]) ctx.collision.addCylinder({ x: Math.cos(rotY) * 31 * end, z: -Math.sin(rotY) * 31 * end, r: 1, minY: 0, maxY: 3 });
    const flow = new THREE.InstancedMesh(P.GEO.sphere, toon(0xff3b5c), 10);
    root.add(flow);
    flows.push({ flow, rotY });
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3(0.7, 0.35, 0.7);

  // ---- Companions ----
  npcs.add(ctx, { id: 'pipetin', x: 2.6, z: -2.2, rotY: Math.PI + 0.6, zone: 'hub' });
  npcs.add(ctx, { id: 'mochi', x: -2.2, z: 19.8, rotY: Math.PI, zone: 'hub' });

  // Balcony lookout: reaching the top for the first time is a little discovery.
  ctx.interactions.addTrigger({
    x: cc.x, z: cc.z - 3.8, r: 2.2, minY: 3.3, once: true,
    onEnter: () => {
      if (ctx.save.flags.hubBalcony) return;
      ctx.audio.play('secret');
      game.ui.toast('איזה נוף! מכאן רואים את כל השערים.', 'secret');
      game.progress.setFlag('hubBalcony');
    },
  });

  return {
    title: ZONE_INFO.hub.title,
    spawn: SPAWN,
    spawns,
    bake: true,
    update(dt, t) {
      cells.update(t);
      for (const p of portals) p.update(t);
      const beat = 1 + Math.max(0, Math.sin(t * 6)) ** 8 * 0.18;
      heart.scale.setScalar(beat);
      heart.rotation.y = t * 0.6;
      blink.material.emissiveIntensity = 0.4 + (Math.sin(t * 4) > 0 ? 0.8 : 0);
      for (const { flow, rotY } of flows) {
        for (let i = 0; i < 10; i++) {
          const a = ((t * 0.08 + i / 10) % 1) * Math.PI;
          pv.set(Math.cos(a) * 31, Math.sin(a) * 31, 0).applyAxisAngle(THREE.Object3D.DEFAULT_UP, rotY);
          flow.setMatrixAt(i, m4.compose(pv, q, sv));
        }
        flow.instanceMatrix.needsUpdate = true;
      }
    },
  };
}
