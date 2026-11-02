import * as THREE from 'three';
import * as P from '../Props.js';
import * as S from '../Structures.js';
import { toon, cellTexture, canvasTexture } from '../Materials.js';
import { ZONE_INFO } from '../../data/zones.js';

// The City of Life: life outside the body. A home with a kitchen, a grocery
// shop, a school and a playground, all open to walk into. Shopping, cooking
// and packing a school bag are stage C/D missions.

const SPAWN = { x: 0, y: 0, z: -28, yaw: 0 };

function roads(ctx) {
  const asphalt = 0x6a6a80;
  P.box(ctx, { x: 0, z: -16, y: -0.98, w: 80, d: 6, h: 1, color: asphalt, collide: false, cast: false });
  P.box(ctx, { x: 0, z: 3.5, y: -0.98, w: 6, d: 33, h: 1, color: asphalt, collide: false, cast: false });
  const g = new THREE.Group();
  ctx.root.add(g);
  const paint = toon(0xffffff);
  for (let x = -36; x <= 36; x += 4) if (Math.abs(x) > 3) S.part(g, P.GEO.box, paint, x, 0.03, -16, { cast: false }).scale.set(2, 0.02, 0.25);
  for (let z = -11; z <= 18; z += 4) S.part(g, P.GEO.box, paint, 0, 0.03, z, { cast: false }).scale.set(0.25, 0.02, 2);
  // Zebra crossing where the path from the portal meets the road.
  for (let i = 0; i < 6; i++) S.part(g, P.GEO.box, paint, -2.5 + i, 0.03, -16, { cast: false }).scale.set(0.5, 0.02, 5);
  for (const x of [-30, -20, -10, 10, 20, 30]) S.lamp(ctx, { x, z: -19.6 });
  for (const z of [-6, 6, 16]) for (const x of [-3.8, 3.8]) S.lamp(ctx, { x, z });
}

function home(ctx) {
  const x = -14, z = -4;
  const g = S.room(ctx, { x, z, rotY: Math.PI, w: 10, d: 8, h: 3.2, wall: 0xfff1d6, roof: 0xff7b54, floor: 0xf2d9b8 });
  // Furniture in local space (door is local +z, the back wall is local -z).
  const local = S.frame(x, z, Math.PI);
  const furn = (lx, lz, w, d, h, color, y = 0, collide = true) => {
    const [wx, wz] = local(lx, lz);
    P.box(ctx, { x: wx, z: wz, y, w, d, h, rotY: Math.PI, color, collide });
  };
  furn(-2.5, -3.3, 4.6, 0.9, 1, 0xffffff); // kitchen counter
  furn(-2.5, -3.3, 4.6, 0.95, 0.08, 0x8a5a3a, 1);
  furn(1.2, -3.3, 1.2, 0.9, 1, 0x5d4a8a); // stove
  for (const dx of [-0.25, 0.25]) for (const dz of [-0.2, 0.2]) furn(1.2 + dx, -3.3 + dz, 0.3, 0.3, 0.03, 0x2a1b4d, 1, false);
  furn(3.9, -3.2, 1.2, 1, 2.4, 0xe8f6ff); // fridge
  furn(3.9, -2.68, 0.06, 0.06, 0.6, 0x8d8da8, 1.3, false);
  furn(0, 0.5, 2.6, 1.6, 0.8, 0xb07a4a); // table
  for (const [cx, cz] of [[-1.6, 0.5], [1.6, 0.5], [0, -0.7], [0, 1.7]]) furn(cx, cz, 0.6, 0.6, 0.5, 0xff9b54, 0, false);
  const rug = S.part(g, P.GEO.cyl, toon(0xff8fb1), 0, 0.03, 0.5, { cast: false });
  rug.scale.set(2.2, 0.02, 1.6);
  // Fruit bowl on the table.
  for (const [i, c] of [0xff4d4d, 0xffd23f, 0xff9b2f].entries()) S.part(g, P.GEO.sphere, toon(c), -0.2 + i * 0.2, 0.9, 0.5).scale.setScalar(0.12);
  const [sx, sz] = local(-3.5, 5.2);
  P.sign(ctx, { x: sx, z: sz, text: 'הבית', bg: '#e0603a', rotY: Math.PI });
}

function shop(ctx) {
  const x = 14, z = -4;
  S.room(ctx, { x, z, rotY: Math.PI, w: 10, d: 8, h: 3.4, wall: 0xd6f5e3, roof: 0x2fd6c3, floor: 0xf0f0f0 });
  const local = S.frame(x, z, Math.PI);
  // Striped awning over the door.
  const tex = canvasTexture(64, 16, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#ffffff' : '#ff5d6c';
      g.fillRect((i * w) / 8, 0, w / 8, h);
    }
  });
  const [ax, az] = local(0, 4.6);
  const awning = new THREE.Mesh(P.GEO.box, new THREE.MeshToonMaterial({ map: tex }));
  awning.scale.set(5, 0.15, 1.6);
  awning.position.set(ax, 3, az);
  awning.rotation.set(-0.35, Math.PI, 0);
  ctx.root.add(awning);
  // Shelves full of colorful products.
  const products = [0xff4d4d, 0xffd23f, 0x4cbf5a, 0x4fc3f7, 0xff9b2f, 0x9b59b6, 0xffffff, 0xd9a05b];
  let k = 0;
  for (const lz of [-3.3, -0.8]) {
    const [shx, shz] = local(-1, lz);
    P.box(ctx, { x: shx, z: shz, w: 6, d: 0.8, h: 2.2, rotY: Math.PI, color: 0xb07a4a });
    const g = new THREE.Group();
    g.position.set(shx, 0, shz);
    g.rotation.y = Math.PI;
    ctx.root.add(g);
    for (const y of [0.75, 1.45, 2.25]) {
      for (let i = 0; i < 9; i++) {
        const side = lz > -2 ? [-1, 1] : [1];
        for (const s of side) {
          const prod = S.part(g, P.GEO.box, toon(products[k++ % products.length]), -2.6 + i * 0.65, y, s * 0.42);
          prod.scale.set(0.45, 0.45 + ((i + k) % 3) * 0.12, 0.25);
        }
      }
    }
  }
  // Fruit crates and the counter with a register.
  for (const [i, c] of [0xff4d4d, 0xffd23f, 0x4cbf5a].entries()) {
    const [cx, cz] = local(3.6, -2.4 + i * 1.3);
    P.box(ctx, { x: cx, z: cz, w: 1.1, d: 1.1, h: 0.6, color: 0x8a5a3a });
    for (let j = 0; j < 4; j++) {
      const f = new THREE.Mesh(P.GEO.sphere, toon(c));
      f.scale.setScalar(0.22);
      f.position.set(cx + (j % 2) * 0.4 - 0.2, 0.75, cz + Math.floor(j / 2) * 0.4 - 0.2);
      f.userData.bake = true;
      ctx.root.add(f);
    }
  }
  const [kx, kz] = local(-3.2, 2.4);
  P.box(ctx, { x: kx, z: kz, w: 2.6, d: 1, h: 1.1, rotY: Math.PI, color: 0xff7b54 });
  P.box(ctx, { x: kx, z: kz, y: 1.1, w: 0.6, d: 0.5, h: 0.35, rotY: Math.PI, color: 0x5d4a8a, collide: false });
  const [sx, sz] = local(3.4, 5.4);
  P.sign(ctx, { x: sx, z: sz, text: 'מכולת', bg: '#17a596', rotY: Math.PI });
}

function clockTexture() {
  return canvasTexture(128, 128, (g, w) => {
    const c = w / 2;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(c, c, c - 4, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = '#2a1b4d';
    g.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillStyle = '#2a1b4d';
      g.fillRect(c + Math.sin(a) * 48 - 3, c - Math.cos(a) * 48 - 3, 6, 6);
    }
    const hand = (a, len, width) => {
      g.lineWidth = width;
      g.beginPath();
      g.moveTo(c, c);
      g.lineTo(c + Math.sin(a) * len, c - Math.cos(a) * len);
      g.stroke();
    };
    hand((4 / 12) * Math.PI * 2, 30, 8); // 16:00 - the end of a long school day
    hand(0, 44, 5);
  });
}

function school(ctx) {
  const x = 0, z = 26;
  const g = S.room(ctx, { x, z, rotY: Math.PI, w: 20, d: 9, h: 5, wall: 0xffe9a8, roof: 0xff9b54, floor: 0xe8e0f0, doorW: 3, flatRoof: true });
  const local = S.frame(x, z, Math.PI);
  // Desks facing a board.
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const [dx, dz] = local(-5.4 + c * 3.6, -1.6 + r * 2.4);
      P.box(ctx, { x: dx, z: dz, w: 1.4, d: 0.8, h: 0.75, rotY: Math.PI, color: 0x8a5a3a });
      const [cx, cz] = local(-5.4 + c * 3.6, -0.8 + r * 2.4);
      P.box(ctx, { x: cx, z: cz, w: 0.6, d: 0.6, h: 0.45, rotY: Math.PI, color: 0x4fc3f7, collide: false });
    }
  }
  const board = S.part(g, P.GEO.box, toon(0x2f6f4f), 0, 2.2, -4.25);
  board.scale.set(6, 1.8, 0.08);
  // Clock above the door, flag pole, windows.
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshBasicMaterial({ map: clockTexture() }));
  const [clx, clz] = local(0, 4.56);
  clock.position.set(clx, 3.9, clz);
  clock.rotation.y = Math.PI;
  ctx.root.add(clock);
  const glass = toon(0x9fe3ff, { emissive: 0x3a8fd9, emissiveIntensity: 0.15 });
  for (const lx of [-7.5, -4.5, 4.5, 7.5]) S.part(g, P.GEO.box, glass, lx, 2.6, 4.53).scale.set(1.8, 1.4, 0.06);
  P.cylinder(ctx, { x: 12.5, z: 20, r: 0.08, h: 7, color: 0xdddddd });
  const flag = new THREE.Mesh(P.GEO.box, toon(0x4fc3f7));
  flag.scale.set(1.6, 1, 0.04);
  const pivot = new THREE.Group();
  pivot.position.set(12.5, 6.4, 20);
  flag.position.x = -0.8;
  pivot.add(flag);
  ctx.root.add(pivot);
  P.sign(ctx, { x: -6, z: 20.2, text: 'בית ספר', bg: '#e08a00', rotY: Math.PI });
  return pivot;
}

function playground(ctx) {
  const cx = -20, cz = 14;
  const sand = new THREE.Mesh(new THREE.CircleGeometry(9, 32), toon(0xf2d9a0));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(cx, 0.015, cz);
  sand.receiveShadow = true;
  ctx.root.add(sand);
  // Slide: ladder up, ramp down.
  P.box(ctx, { x: cx - 3, z: cz - 3, w: 1.6, d: 1.6, h: 2, color: 0xff5fa2 });
  P.ladder(ctx, { x: cx - 3, z: cz - 4.1, height: 2, color: 0xffd23f });
  P.ramp(ctx, { x: cx - 3, z: cz - 0.2, w: 1.2, d: 4, y0: 2, y1: 0.05, color: 0x4fc3f7 });
  // Swings.
  const frame = 0xff7b54;
  for (const dx of [-2, 2]) P.cylinder(ctx, { x: cx + 3 + dx, z: cz - 3, r: 0.12, h: 3, color: frame });
  P.box(ctx, { x: cx + 3, z: cz - 3, y: 3, w: 4.4, d: 0.2, h: 0.2, color: frame, collide: false });
  const swings = [];
  for (const dx of [-1, 1]) {
    const s = new THREE.Group();
    s.position.set(cx + 3 + dx, 3, cz - 3);
    for (const rx of [-0.3, 0.3]) {
      const rope = new THREE.Mesh(P.GEO.cyl, toon(0x8a5a3a));
      rope.scale.set(0.02, 2.4, 0.02);
      rope.position.set(rx, -1.2, 0);
      s.add(rope);
    }
    const seat = new THREE.Mesh(P.GEO.box, toon(0xffd23f));
    seat.scale.set(0.8, 0.08, 0.4);
    seat.position.y = -2.4;
    s.add(seat);
    ctx.root.add(s);
    swings.push(s);
  }
  // Seesaw and a merry-go-round.
  P.box(ctx, { x: cx + 4, z: cz + 3, w: 0.4, d: 0.4, h: 0.5, color: 0x5d4a8a });
  const plank = new THREE.Mesh(P.GEO.box, toon(0x4cbf5a));
  plank.scale.set(4, 0.12, 0.45);
  plank.position.set(cx + 4, 0.58, cz + 3);
  ctx.root.add(plank);
  const carousel = new THREE.Group();
  carousel.position.set(cx - 4, 0, cz + 4);
  const disk = new THREE.Mesh(P.GEO.cyl, toon(0xff9b54));
  disk.scale.set(1.6, 0.25, 1.6);
  disk.position.y = 0.25;
  carousel.add(disk);
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(P.GEO.cyl, toon(0xffd23f));
    bar.scale.set(0.05, 1, 0.05);
    bar.position.set(Math.sin((i * Math.PI) / 2) * 1.1, 0.9, Math.cos((i * Math.PI) / 2) * 1.1);
    carousel.add(bar);
  }
  ctx.root.add(carousel);
  ctx.collision.addCylinder({ x: cx - 4, z: cz + 4, r: 1.6, minY: 0, maxY: 0.37 });
  for (let i = 0; i < 14; i++) {
    const a0 = (i / 14) * Math.PI * 2, a1 = ((i + 1) / 14) * Math.PI * 2;
    if (i === 10 || i === 3) continue; // two openings
    S.fence(ctx, { x0: cx + Math.sin(a0) * 9.4, z0: cz + Math.cos(a0) * 9.4, x1: cx + Math.sin(a1) * 9.4, z1: cz + Math.cos(a1) * 9.4, h: 0.8, color: 0xffffff });
  }
  P.sign(ctx, { x: cx + 9.5, z: cz - 6.2, text: 'גן משחקים', bg: '#d93a7d', rotY: Math.PI / 2 + 0.6 });
  return { swings, plank, carousel };
}

export function build(ctx) {
  const { game, npcs } = ctx;
  ctx.setEnv(P.environment(ctx, { skyTop: '#7fc8ff', skyBottom: '#fff3d6', hemiSky: 0xffffff, hemiGround: 0xbfe6a0, fogNear: 55, fogFar: 140 }));
  const tex = cellTexture('#a8e08a', '#94d376', 31);
  P.floor(ctx, { x0: -40, x1: 40, z0: -42, z1: 40, texture: tex, tile: 7 });
  tex.dispose();
  roads(ctx);
  home(ctx);
  shop(ctx);
  const flag = school(ctx);
  const play = playground(ctx);

  // Neighbours' houses, trees, benches and a bus stop.
  for (const [x, z, wall, roof] of [[-26, -26, 0xffe0f0, 0xd93a7d], [-14, -27, 0xe0f0ff, 0x3a8fd9], [14, -27, 0xfff1d6, 0x4cbf5a], [26, -26, 0xf0e0ff, 0x7e57c2], [27, 6, 0xffe9a8, 0xff7b54], [27, 16, 0xe0fff0, 0x2fd6c3]]) {
    S.house(ctx, { x, z, rotY: z < -20 ? 0 : -Math.PI / 2, wall, roof });
  }
  for (const [x, z] of [[-32, -10], [-24, 2], [-8, 10], [8, 10], [32, -8], [20, 26], [-20, 30], [-32, 26], [8, -32], [-8, -32]]) S.tree(ctx, { x, z, s: 1.1 });
  for (const [x, z, r] of [[-6, 14, Math.PI / 2], [6, 14, -Math.PI / 2], [9, -24, 0]]) S.bench(ctx, { x, z, rotY: r, color: 0x4fc3f7 });
  P.box(ctx, { x: -6, z: -21.2, w: 3.4, d: 0.15, h: 2.4, color: 0x9fe3ff, collide: true });
  P.box(ctx, { x: -6, z: -20.6, y: 2.4, w: 3.8, d: 1.4, h: 0.15, color: 0x2fd6c3, collide: false });
  P.sign(ctx, { x: -8.4, z: -21, text: 'תחנת אוטובוס', bg: '#17a596', rotY: 0.3 });

  // Border: a white fence with hedges.
  for (const [x0, z0, x1, z1] of [[-37, -37, -37, 37], [37, -37, 37, 37], [-37, 37, 37, 37], [-37, -37, -4, -37], [4, -37, 37, -37]]) S.fence(ctx, { x0, z0, x1, z1, h: 1.1, color: 0xffffff });
  for (const [x, z, w, d] of [[0, 38.5, 80, 1], [0, -39.5, 80, 1], [-38.5, 0, 1, 80], [38.5, 0, 1, 80]]) P.box(ctx, { x, z, w, d, h: 2.2, color: 0x6fcf4a });
  P.box(ctx, { x: 0, z: -37.5, w: 8, d: 1, h: 2.2, color: 0x6fcf4a });

  const portal = S.portal(ctx, { x: 0, z: -33, rotY: 0, color: 0x9b7bff, label: 'מרכז העולם', onEnter: () => game.travel('hub') });
  npcs.add(ctx, { id: 'pipetin', x: 3.4, z: -23, rotY: Math.PI + 0.5, zone: 'life' });
  npcs.add(ctx, { id: 'kibutzi', x: 9.6, z: -10.6, rotY: Math.PI, zone: 'life' });

  return {
    title: ZONE_INFO.life.title,
    spawn: SPAWN,
    spawns: { hub: SPAWN },
    bake: true,
    update(dt, t) {
      portal.update(t);
      flag.rotation.y = Math.sin(t * 2) * 0.25;
      play.swings[0].rotation.x = Math.sin(t * 1.6) * 0.5;
      play.swings[1].rotation.x = Math.sin(t * 1.6 + 2) * 0.35;
      play.plank.rotation.z = Math.sin(t * 1.2) * 0.25;
      play.carousel.rotation.y = t * 0.6;
    },
  };
}
