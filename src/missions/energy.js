import * as THREE from 'three';
import { ITEMS } from '../data/items.js';
import { toon } from '../world/Materials.js';
import { machineFeed } from '../minigames/MachineFeed.js';
import { use, missing, take, foods, parts, flag, board } from './helpers.js';

// Energy City: find three parts, repair the generator, feed it energy
// foods, and the whole city lights up. Then the train and the light race.

const GEN = { x: 0, z: 13.3 };
const PARTS = [['gear', 1], ['cable', 1], ['bulb', 1]];
// Train path, starting where the train stands (local +z is forward).
const TRACK = [[-28, -2], [-28, 8], [-24, 12], [24, 12], [28, 8], [28, -20], [24, -24], [-24, -24], [-28, -20], [-28, -2]];
const RACE = [[0, 1.3, -17], [-6, 1.3, -8], [-18, 1.3, -2], [-23.5, 2.05, 2], [-12, 1.3, 9], [0, 1.3, 6], [8, 1.3, -4], [11, 1.3, -15], [3, 1.3, -21]];

function feedCheck(ids) {
  if (ids.includes('candy')) {
    return { ok: false, consume: ['candy'], msg: 'פששש! הסוכרייה נתנה הבזק קצר של אנרגיה, והוא נגמר מהר. כדי שהגנרטור יעבוד לאורך זמן הוא צריך פחמימות: לחם, אורז, פסטה או תפוחי אדמה.' };
  }
  const wrong = ids.find((id) => !ITEMS[id].groups.includes('carbs'));
  if (wrong) {
    const d = ITEMS[wrong];
    return { ok: false, msg: `${d.icon} ${d.name}: מזון חשוב לגוף, אבל לא הדלק של הגנרטור הזה. חפשו מקורות פחמימות.` };
  }
  return { ok: true, msg: 'וווםםם! הגנרטור מסתובב. פחמימות הן דלק נהדר שנותן אנרגיה לאורך זמן!' };
}

/** Split the train into cars so each one follows the curves of the track. */
function makeCars(ctx, train) {
  const offsets = [0, -5.5, -10.5];
  const cars = offsets.map((o) => {
    const g = new THREE.Group();
    g.position.set(-28, 0, -2 + o);
    ctx.root.add(g);
    return g;
  });
  for (const child of [...train.group.children]) {
    const z = child.position.z;
    const k = z < -8 ? 2 : z < -3.3 ? 1 : 0;
    child.position.z -= offsets[k];
    cars[k].add(child);
  }
  // Path lengths for following the track.
  const seg = [];
  let total = 0;
  for (let i = 0; i < TRACK.length - 1; i++) {
    const len = Math.hypot(TRACK[i + 1][0] - TRACK[i][0], TRACK[i + 1][1] - TRACK[i][1]);
    seg.push(len);
    total += len;
  }
  const at = (s) => {
    s = ((s % total) + total) % total;
    for (let i = 0; i < seg.length; i++) {
      if (s <= seg[i]) {
        const [ax, az] = TRACK[i], [bx, bz] = TRACK[i + 1];
        const k = s / seg[i];
        return { x: ax + (bx - ax) * k, z: az + (bz - az) * k, yaw: Math.atan2(bx - ax, bz - az) };
      }
      s -= seg[i];
    }
    return { x: TRACK[0][0], z: TRACK[0][1], yaw: 0 };
  };
  return { cars, offsets, total, at };
}

export function setup(ctx, zone) {
  const { game } = ctx;
  const env = game.world.env;

  // ---- Coins and things to find ----
  ctx.pickups.addCoins(ctx, 'energy', [
    [0, 0, -18], [0, 0, -12], [0, 0, -6], [0, 0, 0], [0, 0, 6],
    [-24.2, 0.75, -4], [-24.2, 0.75, 1], [17, 4.25, 6], [19, 4.25, 2.5],
    [15, 5, -19.5], [-14, 0, -20], [9, 0, -24],
  ]);
  parts(ctx, [
    ['energy:gear', 'gear', 13.3, 5, -20.8],
    ['energy:cable', 'cable', -24.2, 0.75, 3.6],
    ['energy:bulb', 'bulb', 16, 4.25, 3],
  ]);
  foods(ctx, [
    ['bread', -17.8, 0, 22.8], ['rice', -13.3, 0, 22.8], ['bread', -10, 0, 20.5],
    ['pasta', -24.2, 0.75, -6.5], ['rice', -24.2, 0.75, -1.5], ['potato', -10, 0, -15],
    ['candy', 16, 0, -12.8], ['candy', -6, 0, -18], ['egg', 7, 0, -7],
  ]);

  // ---- The generator ----
  const lampMat = zone.lamps[0].material;
  const powerOn = (instant) => {
    lampMat.emissiveIntensity = 0.95;
    zone.station.bulb.material.emissiveIntensity = 1;
    zone.train.lamp.material.emissiveIntensity = 1;
    env.hemi.intensity = 1.9;
    env.sun.intensity = 1.6;
    if (!instant) {
      game.audio.play('secret');
      game.player.celebrate(2);
      game.ui.toast('העיר מוארת! כל הכבוד!', 'good');
    }
  };
  lampMat.emissiveIntensity = 0;
  zone.station.bulb.material.emissiveIntensity = 0;
  zone.train.lamp.material.emissiveIntensity = 0;
  if (flag(ctx, 'ePower')) powerOn(true);

  const gen = use(ctx, {
    x: GEN.x, z: GEN.z, radius: 2.6,
    label: 'להתקין חלקים בגנרטור',
    when: () => !flag(ctx, 'ePower'),
    onUse: async () => {
      if (!flag(ctx, 'eRepaired')) {
        const miss = missing(game, PARTS);
        if (miss) {
          game.audio.play('fail');
          game.ui.toast('חסרים חלקים: ' + miss);
          return;
        }
        take(game, PARTS);
        game.audio.play('build');
        game.progress.setFlag('eRepaired');
        game.ui.toast('הגנרטור תוקן! עכשיו הוא צריך דלק טוב.', 'good');
        gen.label = 'להזין את הגנרטור';
        return;
      }
      const ok = await machineFeed(game, {
        title: 'הגנרטור של תחנת הכוח',
        intro: 'הכניסו לגנרטור שלושה מזונות שיתנו לו אנרגיה לאורך זמן.',
        check: feedCheck,
      });
      if (ok) {
        game.progress.setFlag('ePower');
        powerOn(false);
      }
    },
  });
  if (flag(ctx, 'eRepaired')) gen.label = 'להזין את הגנרטור';

  // ---- Train ----
  const track = makeCars(ctx, zone.train);
  let trainS = -1;
  const lever = new THREE.Group();
  lever.position.set(-23, 0.75, -8.6);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8), toon(0xdddddd));
  stick.position.y = 0.4;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), toon(0xff5d6c));
  knob.position.y = 0.8;
  lever.add(stick, knob);
  lever.rotation.x = -0.5;
  ctx.root.add(lever);
  use(ctx, {
    x: -23, y: 0.75, z: -8.6, radius: 1.8,
    label: 'להפעיל את הרכבת',
    when: () => trainS < 0 && !game.quests.step('fuel'),
    onUse: () => {
      if (!flag(ctx, 'ePower')) {
        game.audio.play('fail');
        game.ui.toast('אין חשמל! קודם צריך להדליק את תחנת הכוח.');
        return;
      }
      lever.rotation.x = 0.5;
      game.audio.play('lever');
      setTimeout(() => game.audio.play('machine'), 200);
      for (const c of zone.train.colliders) ctx.collision.remove(c);
      trainS = 0;
    },
  });

  board(ctx, { x: -23, y: 0.75, z: -8.6, radius: 2, label: 'לתכנן דלק למסע', quest: 'fuel', name: 'fuel', flagName: 'eFuel' });

  // ---- Light race ----
  const pad = game.challenge.pad(ctx, {
    x: -3, z: -24, label: 'להתחיל את מרוץ האורות',
    enabled: () => flag(ctx, 'ePower'),
    start: () => game.challenge.rings(ctx, {
      title: 'מרוץ האורות', rings: RACE, seconds: 45,
      onWin: () => {
        game.audio.play('secret');
        game.player.celebrate(2);
        game.ui.toast(flag(ctx, 'eRace') ? 'שוב הצלחתם! איזה מהירים!' : 'עברתם את כל הטבעות בזמן!', 'good');
        game.progress.setFlag('eRace');
      },
    }),
  });

  return {
    update(dt, t) {
      pad.update(t);
      if (flag(ctx, 'ePower')) zone.station.needlePivot.rotation.z = -0.9 + Math.sin(t * 2) * 0.08;
      if (trainS >= 0) {
        trainS += dt * 7;
        const done = trainS >= track.total;
        const s = done ? track.total : trainS;
        track.cars.forEach((car, i) => {
          const p = track.at(s + track.offsets[i]);
          car.position.set(p.x, 0, p.z);
          car.rotation.y = p.yaw;
        });
        if (done) {
          trainS = -1;
          lever.rotation.x = -0.5;
          for (const c of zone.train.colliders) ctx.collision.restore(c);
          game.audio.play('success');
          game.ui.toast(flag(ctx, 'eTrain') ? 'הרכבת סיימה עוד סיבוב!' : 'הרכבת חזרה לנסוע! כל העיר שמחה.', 'good');
          game.progress.setFlag('eTrain');
        }
      }
    },
  };
}
