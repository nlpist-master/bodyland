import * as THREE from 'three';
import * as P from '../world/Props.js';
import { toon } from '../world/Materials.js';
import { sortGame } from '../minigames/SortGame.js';
import { use, missing, take, parts, flag } from './helpers.js';

// Building Factory: collect planks and bolts, run the crane to lower a
// steel beam over the ravine, lay the planks one by one, cross the new
// bridge and help Shriron at the sorting belt.

const BRIDGE = { x: 0, z: 12 };
const SLOTS = [9, 11, 13, 15];
const CONSOLE = { x: -3.6, z: 1 };

export function setup(ctx, zone) {
  const { game } = ctx;
  const crane = zone.crane;

  ctx.pickups.addCoins(ctx, 'construction', [
    [0, 0, -22], [0, 0, -17], [0, 0, -12], [0, 0, -7], [-1, 0, -2],
    [6, 0.75, -17], [12, 0.75, -13.5], [13, 4.8, 3.2], [-7, 6, -1.2],
    [-4, 0, 21.5], [4, 0, 21.5], [0, 0, 19.5],
  ]);
  parts(ctx, [
    ['construction:plank0', 'plank', 15, 2.4, -0.6],
    ['construction:plank1', 'plank', -5, 6, -1.2],
    ['construction:plank2', 'plank', -8.4, 0, -9.6],
    ['construction:plank3', 'plank', 24, 0, -23],
    ['construction:bolt0', 'bolt', 10, 0.75, -13.5],
    ['construction:bolt1', 'bolt', 17, 1.2, -16.2],
  ]);

  // ---- Crane console ----
  P.box(ctx, { x: CONSOLE.x, z: CONSOLE.z, w: 0.9, d: 0.7, h: 1.1, color: 0x5d4a8a });
  const screen = new THREE.Mesh(P.GEO.box, toon(0x2fd6c3, { emissive: 0x2fd6c3, emissiveIntensity: 0.6 }));
  screen.scale.set(0.7, 0.05, 0.5);
  screen.position.set(CONSOLE.x, 1.13, CONSOLE.z);
  ctx.root.add(screen);

  const dx = BRIDGE.x - crane.x, dz = BRIDGE.z - crane.z;
  const reach = Math.hypot(dx, dz);
  const finalYaw = Math.atan2(-dz, dx);
  crane.beam.rotation.y = -finalYaw; // lines up with the ravine when it arrives
  const lowered = crane.top + 0.45 - 0.5;
  let busy = false;

  const placeBeam = () => {
    ctx.root.attach(crane.beam);
    crane.beam.position.set(BRIDGE.x, -0.45, BRIDGE.z);
    crane.beam.rotation.set(0, 0, 0);
    crane.setDrop(9);
  };
  if (flag(ctx, 'cCrane')) {
    crane.head.rotation.y = finalYaw;
    crane.hook.position.x = reach;
    placeBeam();
  }

  use(ctx, {
    x: CONSOLE.x, z: CONSOLE.z, radius: 1.9,
    label: 'להפעיל את המנוף',
    when: () => !busy && !flag(ctx, 'cCrane'),
    onUse: () => {
      busy = true;
      game.audio.play('machine');
      game.ui.toast('המנוף מסתובב...');
      const yaw0 = crane.head.rotation.y, r0 = crane.hook.position.x;
      ctx.tween(2.4, (k) => (crane.head.rotation.y = yaw0 + (finalYaw - yaw0) * k), () => {
        ctx.tween(1.4, (k) => (crane.hook.position.x = r0 + (reach - r0) * k), () => {
          game.audio.play('gate');
          ctx.tween(2.2, (k) => crane.setDrop(11 + (lowered - 11) * k), () => {
            placeBeam();
            game.audio.play('build');
            game.progress.setFlag('cCrane');
            game.ui.toast('הקורה במקום! עכשיו מניחים עליה את הקרשים.', 'good');
            busy = false;
          });
        });
      });
    },
  });

  // ---- Bridge planks ----
  const wood = toon(0xc48a5a);
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.35, depthWrite: false });
  const ghost = new THREE.Mesh(P.GEO.box, ghostMat);
  ghost.scale.set(3.4, 0.3, 1.9);
  ghost.visible = false;
  ctx.root.add(ghost);
  const placed = (i) => flag(ctx, 'cPlank' + i);
  const lay = (i) => {
    const plank = new THREE.Mesh(P.GEO.box, wood);
    plank.scale.set(3.4, 0.3, 1.96);
    plank.position.set(BRIDGE.x, -0.15, SLOTS[i]);
    plank.castShadow = plank.receiveShadow = true;
    ctx.root.add(plank);
    ctx.collision.addBox({ x: BRIDGE.x, z: SLOTS[i], w: 3.4, d: 2, minY: -0.3, maxY: 0 });
    for (const sx of [-1.6, 1.6]) P.cylinder(ctx, { x: sx, z: SLOTS[i], r: 0.08, h: 1, color: 0x8a5a3a, dynamic: true });
  };
  SLOTS.forEach((z, i) => {
    if (placed(i)) lay(i);
    use(ctx, {
      x: BRIDGE.x, z: z - 0.6, radius: 2,
      label: 'להניח קרש',
      when: () => flag(ctx, 'cCrane') && !placed(i) && (i === 0 || placed(i - 1)),
      onUse: () => {
        const need = i === 0 ? [['plank', 1], ['bolt', 2]] : [['plank', 1]];
        const miss = missing(game, need);
        if (miss) {
          game.audio.play('fail');
          game.ui.toast('חסר: ' + miss);
          return;
        }
        take(game, need);
        lay(i);
        game.audio.play('build');
        game.progress.setFlag('cPlank' + i);
        if (i === SLOTS.length - 1) {
          game.progress.setFlag('cBuilt');
          game.audio.play('secret');
          game.ui.toast('הגשר בנוי! אפשר לעבור לצד השני.', 'good');
        } else {
          game.ui.toast(`קרש ${i + 1} מתוך ${SLOTS.length}`);
        }
      },
    });
  });

  // ---- Sorting belt in front of the muscle factory ----
  P.box(ctx, { x: 0, z: 23.2, w: 4, d: 1.2, h: 0.9, color: 0x5d4a8a });
  P.box(ctx, { x: 0, z: 23.2, y: 0.9, w: 3.8, d: 1, h: 0.06, color: 0xffd23f, collide: false });
  P.sign(ctx, { x: 3.2, z: 22.2, text: 'פס המיון', bg: '#d9534f', rotY: Math.PI });
  use(ctx, {
    x: 0, z: 22.4, radius: 2,
    label: 'למיין מזונות בפס המיון',
    onUse: async () => {
      const ok = await sortGame(game);
      if (ok) {
        if (!flag(ctx, 'cSorted')) game.ui.toast('שרירון מתלהב: איזה מיון מושלם!', 'good');
        game.progress.setFlag('cSorted');
      }
    },
  });

  return {
    update(dt, t) {
      const next = SLOTS.findIndex((_, i) => !placed(i));
      ghost.visible = flag(ctx, 'cCrane') && next >= 0;
      if (ghost.visible) {
        ghost.position.set(BRIDGE.x, -0.15, SLOTS[next]);
        ghostMat.opacity = 0.25 + Math.sin(t * 4) * 0.12;
      }
    },
  };
}
