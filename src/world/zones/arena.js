import * as THREE from 'three';
import * as P from '../Props.js';
import { toon, cellTexture } from '../Materials.js';

// Professor Pipetin's training arena: a playground for every movement
// skill (stairs, ramp, ladder, jumps over a pit, bounce pad, tunnel) and a
// first taste of exploring: a lever up high opens a secret room below.

const SPAWN = { x: 0, y: 0, z: -8, yaw: 0 };
const faceSpawn = (x, z) => Math.atan2(SPAWN.x - x, SPAWN.z - z);

export function build(ctx) {
  const { root, collision, interactions, audio, game, save } = ctx;
  ctx.setEnv(P.environment(ctx, { skyTop: '#b9a6ff', skyBottom: '#ffd6e8', hemiSky: 0xfff4fb, hemiGround: 0xff9fc0 }));
  collision.killY = -6;

  // ---- Ground with a pit (x -6..6, z 10..26) ----
  const tex = cellTexture('#ffb9cc', '#ff8fb1');
  P.floor(ctx, { x0: -30, x1: 30, z0: -30, z1: 10, texture: tex });
  P.floor(ctx, { x0: -30, x1: -6, z0: 10, z1: 30, texture: tex });
  P.floor(ctx, { x0: 6, x1: 30, z0: 10, z1: 30, texture: tex });
  P.floor(ctx, { x0: -6, x1: 6, z0: 26, z1: 30, texture: tex });
  tex.dispose();

  const pitWall = { color: 0xd9467a, collide: false, cast: false, y: -5, h: 4.98 };
  P.box(ctx, { ...pitWall, x: -6.25, z: 18, w: 0.5, d: 16 });
  P.box(ctx, { ...pitWall, x: 6.25, z: 18, w: 0.5, d: 16 });
  P.box(ctx, { ...pitWall, x: 0, z: 9.75, w: 12, d: 0.5 });
  P.box(ctx, { ...pitWall, x: 0, z: 26.25, w: 12, d: 0.5 });
  const goo = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), toon(0xffc94a, { emissive: 0xff8a2a, emissiveIntensity: 0.55 }));
  goo.rotation.x = -Math.PI / 2;
  goo.position.set(0, -3.2, 18);
  root.add(goo);

  // ---- Perimeter walls with soft bumps on top ----
  const wallColor = 0xff7aa8;
  P.box(ctx, { x: 0, z: -30.5, w: 62, d: 1, h: 2.2, color: wallColor });
  P.box(ctx, { x: 0, z: 30.5, w: 62, d: 1, h: 2.2, color: wallColor });
  P.box(ctx, { x: -30.5, z: 0, w: 1, d: 62, h: 2.2, color: wallColor });
  P.box(ctx, { x: 30.5, z: 0, w: 1, d: 62, h: 2.2, color: wallColor });
  const bumpSpots = [];
  for (let i = -29; i <= 29; i += 2.9) bumpSpots.push([i, -30.5], [i, 30.5], [-30.5, i], [30.5, i]);
  const bumps = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.4, 0.5, 3, 8), toon(0xffa3c4), bumpSpots.length);
  const m4 = new THREE.Matrix4();
  bumpSpots.forEach(([x, z], i) => bumps.setMatrixAt(i, m4.makeTranslation(x, 2.55, z)));
  root.add(bumps);

  // ---- Slalom pillars on the way to the pit ----
  [[1.8, 1], [-1.8, 3.4], [1.8, 5.8], [-1.8, 8.2]].forEach(([x, z], i) => {
    P.cylinder(ctx, { x, z, r: 0.55, h: 2.6, color: i % 2 ? 0xffd23f : 0xff5d6c });
  });

  // ---- Jumping course over the pit, ending on a goal platform ----
  const plats = [
    [0, 12.6, 0.5, 2.4, 0x2fd6c3],
    [2.6, 16, 1.1, 2.2, 0xffd23f],
    [-0.6, 19.4, 0.8, 2.4, 0x9b7bff],
    [1.2, 23, 1.3, 2.8, 0xff5fa2],
  ];
  for (const [x, z, top, size, color] of plats) {
    P.box(ctx, { x, z, y: top - 0.6, w: size, d: size, h: 0.6, color });
    P.cylinder(ctx, { x, z, y: -3.4, r: 0.35, h: top - 0.6 + 3.4, color: 0xd9467a, collide: false });
  }
  P.cylinder(ctx, { x: 2.3, z: 24, y: 1.3, r: 0.06, h: 2.2, color: 0xffffff, collide: false });
  const flag = new THREE.Mesh(P.GEO.box, toon(0xffd23f));
  flag.scale.set(0.9, 0.55, 0.05);
  flag.position.set(-0.45, 0.42, 0);
  const flagPivot = new THREE.Group();
  flagPivot.position.set(2.3, 3.2, 24);
  flagPivot.add(flag);
  root.add(flagPivot);
  interactions.addTrigger({
    x: 1.2, z: 23, r: 1.4, minY: 1.2, once: true,
    onEnter: () => {
      audio.play('success');
      game.player.celebrate();
      game.ui.toast('כל הכבוד! עברת את מסלול הקפיצות!', 'good');
      game.progress.setFlag('arenaJumps');
    },
  });

  // ---- Stairs up to a purple deck ----
  P.box(ctx, { x: -16, z: -4, w: 6, d: 8, h: 1.8, color: 0x9b7bff });
  P.stairs(ctx, { x: -9.4, z: -4, rotY: -Math.PI / 2, steps: 6 });

  // ---- Ramp and ladder up to a blue deck ----
  P.box(ctx, { x: 16, z: -6, w: 6, d: 6, h: 2.5, color: 0x4fc3f7 });
  P.ramp(ctx, { x: 16, z: 1, w: 4, d: 8, y0: 2.5, y1: 0, color: 0xffd23f });
  P.ladder(ctx, { x: 16, z: -9.3, height: 2.5 });

  // ---- Tunnel ----
  P.box(ctx, { x: -8, z: -19.25, w: 8, d: 0.5, h: 2.4, color: 0x7e57c2 });
  P.box(ctx, { x: -8, z: -22.75, w: 8, d: 0.5, h: 2.4, color: 0x7e57c2 });
  P.box(ctx, { x: -8, z: -21, y: 2.4, w: 8.4, d: 4.4, h: 0.5, color: 0x9575cd });

  // ---- Bounce pad up to a high platform with a lever ----
  P.cylinder(ctx, { x: 8, z: -17.2, r: 1.1, h: 0.35, color: 0x2fd6c3, tag: 'bounce' });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.09, 8, 28), toon(0xffd23f));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(8, 0.37, -17.2);
  root.add(ring);
  P.cylinder(ctx, { x: 8, z: -21.5, r: 0.5, h: 3.6, color: 0xb39ddb });
  P.box(ctx, { x: 8, z: -21.5, y: 3.6, w: 4.2, d: 4.2, h: 0.6, color: 0x9b7bff });

  P.box(ctx, { x: 8, z: -22.7, y: 4.2, w: 0.6, d: 0.5, h: 0.3, color: 0x5d4a8a });
  const handle = new THREE.Group();
  handle.position.set(8, 4.45, -22.7);
  const stick = new THREE.Mesh(P.GEO.cyl, toon(0xdddddd));
  stick.scale.set(0.05, 0.7, 0.05);
  stick.position.y = 0.35;
  const knob = new THREE.Mesh(P.GEO.sphere, toon(0xff5d6c));
  knob.scale.setScalar(0.13);
  knob.position.y = 0.72;
  handle.add(stick, knob);
  root.add(handle);

  // ---- Secret room, closed by a golden gate ----
  const roomColor = 0x8e6cf0;
  P.box(ctx, { x: -18, z: 23.25, w: 6.5, d: 0.5, h: 2.6, color: roomColor });
  P.box(ctx, { x: -21.25, z: 20, w: 0.5, d: 6.5, h: 2.6, color: roomColor });
  P.box(ctx, { x: -14.75, z: 20, w: 0.5, d: 6.5, h: 2.6, color: roomColor });
  P.box(ctx, { x: -20.25, z: 16.75, w: 2.5, d: 0.5, h: 2.6, color: roomColor });
  P.box(ctx, { x: -15.75, z: 16.75, w: 2.5, d: 0.5, h: 2.6, color: roomColor });
  P.box(ctx, { x: -18, z: 20, y: 2.6, w: 7, d: 7, h: 0.4, color: 0xb39ddb });
  const gate = P.box(ctx, { x: -18, z: 16.75, w: 2, d: 0.35, h: 2.6, color: 0xffd23f });

  const crystalMat = toon(0x8ff7ea, { emissive: 0x2fd6c3, emissiveIntensity: 0.8 });
  const crystals = [];
  [[-19.6, 21.8, 1.1], [-18, 22.2, 1.5], [-16.4, 21.8, 1.0]].forEach(([x, z, h]) => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.3, h, 6), crystalMat);
    c.position.set(x, h / 2, z);
    root.add(c);
    crystals.push(c);
  });

  const openGate = (instant) => {
    handle.rotation.x = 0.7;
    collision.remove(gate.collider);
    if (instant) {
      gate.mesh.position.y = -1.3;
      return;
    }
    ctx.tween(1.2, (k) => (gate.mesh.position.y = 1.3 - k * 2.6));
  };

  handle.rotation.x = -0.7;
  if (save.flags.arenaGate) {
    openGate(true);
  } else {
    interactions.add({
      position: new THREE.Vector3(8, 4.2, -22.4),
      radius: 1.7,
      label: 'למשוך בידית',
      once: true,
      onInteract: () => {
        audio.play('lever');
        ctx.tween(0.35, (k) => (handle.rotation.x = -0.7 + k * 1.4), () => {
          audio.play('gate');
          openGate(false);
          game.ui.toast('שמעת את זה? משהו נפתח למטה...');
          game.progress.setFlag('arenaGate');
        });
      },
    });
  }
  interactions.addTrigger({
    x: -18, z: 20.4, r: 1.7, once: true,
    onEnter: () => {
      const first = !save.flags.arenaSecret;
      audio.play('secret');
      game.player.celebrate();
      game.ui.toast(first ? 'גילית חדר סודי!' : 'ברוכים השבים לחדר הסודי!', 'secret');
      game.progress.setFlag('arenaSecret');
    },
  });

  // ---- Signs ----
  const signs = [
    [4.2, 8.6, 'מסלול קפיצות'],
    [-8.6, -0.8, 'מדרגות', '#9b7bff'],
    [13.4, -10.6, 'סולם', '#3a8fd9'],
    [13.4, 5.6, 'רמפה', '#e0a800'],
    [10.6, -14.6, 'טרמפולינה', '#17a596'],
    [-3, -17.6, 'מנהרה', '#7e57c2'],
    [-21.5, 14.6, 'שער נעול... איפה הידית?', '#d93a7d'],
  ];
  for (const [x, z, text, bg] of signs) P.sign(ctx, { x, z, text, bg, rotY: faceSpawn(x, z) });

  const cells = P.floatingCells(ctx, {});

  return {
    title: 'זירת האימונים',
    spawn: SPAWN,
    update(dt, t) {
      cells.update(t);
      crystalMat.emissiveIntensity = 0.6 + Math.sin(t * 2.5) * 0.3;
      flagPivot.rotation.y = Math.sin(t * 2) * 0.25;
      ring.scale.setScalar(1 + Math.sin(t * 5) * 0.04);
    },
  };
}
