import * as THREE from 'three';
import * as P from '../world/Props.js';
import * as S from '../world/Structures.js';
import { toon } from '../world/Materials.js';
import { pipePuzzle } from '../minigames/PipePuzzle.js';
import { use, parts, foods, flag, board, station } from './helpers.js';

// Water Kingdom: find the wrench on the water tower, fix the leaking pipe,
// open three valves on the dam so water flows again, then a drop race.

const VALVES = [-9, 0, 9];
const DROPS = [
  [-6, 0, -7], [6, 0, -8], [-12, 0, -10], [12, 0, -9], [0, 0.1, -2.5], [0, 0.1, 4.5],
  [-8, 0, 9], [8, 0, 10], [-14, 0, 12], [14, 0, 13], [16, 0.3, 1], [-20, 0, -12],
];

export function setup(ctx, zone) {
  const { game } = ctx;

  ctx.pickups.addCoins(ctx, 'water', [
    [0, 0.1, -2], [0, 0.1, 1], [0, 0.1, 4], [16, 0.3, -2], [16, 0.3, 3],
    [-15, 6, 27], [15, 6, 27], [-4.5, 6, 27], [-15.4, 6.25, -18.9],
    [-16.4, -0.4, -1.2], [-16.2, -0.4, 2.5], [22, 0, -28],
  ]);
  parts(ctx, [['water:wrench', 'wrench', -18, 6.25, -20.7]]);
  foods(ctx, [['fish', 10, 0, -6.5], ['yogurt', -10, 0, 10], ['orange', 24, 0, 18]]);

  // ---- The leaking pipe ----
  const fixPipe = () => {
    S.pipe(ctx, { a: [17.4, 0.5, -20], b: [19.6, 0.5, -20], r: 0.52, color: 0x2fd6c3, dynamic: true });
    zone.leak.puddle.visible = false;
    for (const d of zone.leak.drips) d.d.visible = false;
  };
  if (flag(ctx, 'wPipe')) fixPipe();
  station(ctx, { x: -2, z: -17, text: 'תחנת ציוד', bg: '#1e88e5', color: 0x4fc3f7 });
  board(ctx, { x: -2, z: -16.2, radius: 2.2, label: 'לארוז ציוד למסע', quest: 'hotDay', name: 'hot', flagName: 'wHot' });

  use(ctx, {
    x: 18.5, z: -21.2, radius: 2,
    label: 'לתקן את הצינור',
    when: () => !flag(ctx, 'wPipe'),
    onUse: async () => {
      if (!game.inventory.count('wrench')) {
        game.audio.play('fail');
        game.ui.toast('צריך מפתח ברגים! אולי הוא למעלה על מגדל המים?');
        return;
      }
      if (await pipePuzzle(game)) {
        fixPipe();
        game.progress.setFlag('wPipe');
        game.audio.play('build');
        game.ui.toast('הצינור תוקן! המים לא דולפים יותר.', 'good');
      }
    },
  });

  // ---- Valves on top of the dam open the floodgates ----
  const spills = [];
  const openGate = (i, instant) => {
    const gate = zone.gates[i];
    ctx.collision.remove(gate.collider);
    const spill = S.water(ctx, { x0: VALVES[i] - 1.4, x1: VALVES[i] + 1.4, z0: 6.5, z1: 25.6, y: 0.05, color: 0x29a8e0, speed: 0.6 });
    spill.mesh.visible = instant;
    spills.push(spill);
    if (instant) {
      gate.mesh.position.y = 2.1 + 4;
      return;
    }
    game.audio.play('gate');
    ctx.tween(1.6, (k) => (gate.mesh.position.y = 2.1 + k * 4), () => (spill.mesh.visible = true));
  };
  VALVES.forEach((x, i) => {
    P.cylinder(ctx, { x, z: 27.4, y: 6, r: 0.12, h: 0.9, color: 0x8da2b8 });
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 8, 18), toon(0xff5d6c));
    wheel.position.set(x, 7, 27.4);
    ctx.root.add(wheel);
    const name = 'wValve' + i;
    if (flag(ctx, name)) {
      openGate(i, true);
      wheel.rotation.z = 2;
    }
    use(ctx, {
      x, y: 6, z: 27, radius: 1.8,
      label: 'לפתוח את השסתום',
      when: () => !flag(ctx, name),
      onUse: () => {
        game.audio.play('lever');
        ctx.tween(1, (k) => (wheel.rotation.z = k * 6));
        openGate(i, false);
        game.progress.setFlag(name);
        const n = VALVES.filter((_, j) => flag(ctx, 'wValve' + j)).length;
        game.ui.toast(n === 3 ? 'כל השערים בסכר פתוחים! המים זורמים!' : `שסתום ${n} מתוך 3 נפתח`, 'good');
      },
    });
  });

  // ---- Drop race ----
  const pad = game.challenge.pad(ctx, {
    x: -3, z: -8, label: 'להתחיל: טיפות לכולם',
    enabled: () => game.quests.isDone('pipes'),
    start: () => {
      const spawned = [];
      const hit = game.challenge.collect({
        title: 'טיפות לכולם', count: DROPS.length, seconds: 50,
        onWin: () => {
          game.audio.play('secret');
          game.player.celebrate(2);
          game.ui.toast('אספתם את כל הטיפות! טיפטיפ מתרגשת!!!', 'good');
          game.progress.setFlag('wDrops');
        },
        cleanup: () => {
          for (const p of spawned) if (!p.taken) {
            p.taken = true;
            p.group.removeFromParent();
          }
        },
      });
      for (const [x, y, z] of DROPS) spawned.push(ctx.pickups.add(ctx, { item: 'drop', x, y, z, quiet: true, onPick: hit }));
    },
  });

  return {
    update(dt, t) {
      pad.update(t);
      for (const s of spills) s.update(t);
    },
  };
}
