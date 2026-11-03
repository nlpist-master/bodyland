import * as THREE from 'three';
import { ITEMS } from '../data/items.js';
import { BOARDS } from '../data/boards.js';
import { planBoard } from '../minigames/PlanBoard.js';
import * as P from '../world/Props.js';

// Small shared pieces for zone missions.

/** Interaction that is only shown while when() is true. */
export function use(ctx, { x, y = 0, z, radius = 2.2, label, when, onUse }) {
  return ctx.interactions.add({ position: new THREE.Vector3(x, y, z), radius, label, when, onInteract: onUse });
}

/** Items still missing from a list of [id, count]. Returns a readable string or ''. */
export function missing(game, need) {
  const out = [];
  for (const [id, n] of need) {
    const have = game.inventory.count(id);
    if (have < n) out.push(`${ITEMS[id].icon} ${ITEMS[id].name}${n - have > 1 ? ' ×' + (n - have) : ''}`);
  }
  return out.join(', ');
}

export function take(game, need) {
  for (const [id, n] of need) game.inventory.remove(id, n);
}

/** Renewable food pickups: [[item, x, y, z], ...]. */
export function foods(ctx, list) {
  for (const [item, x, y, z] of list) ctx.pickups.add(ctx, { item, x, y, z });
}

/** One-time pickups: [[key, item, x, y, z], ...]. */
export function parts(ctx, list) {
  for (const [key, item, x, y, z] of list) ctx.pickups.add(ctx, { key, item, x, y, z });
}

export const flag = (ctx, name) => !!ctx.save.flags[name];

/** A thinking challenge at a spot in the world, open while its mission step is. */
export function board(ctx, { x, y = 0, z, radius = 2.2, label, quest, name, flagName, onDone }) {
  const { game } = ctx;
  return use(ctx, {
    x, y, z, radius, label,
    when: () => game.quests.step(quest)?.flag === flagName,
    onUse: async () => {
      if (!(await planBoard(game, BOARDS[name]))) return;
      game.progress.setFlag(flagName);
      onDone?.();
    },
  });
}

/** A small table with a sign: where a thinking challenge happens. */
export function station(ctx, { x, z, rotY = 0, color = 0x7e57c2, text, bg = '#7e57c2' }) {
  P.box(ctx, { x, z, w: 1.6, d: 0.9, h: 0.9, rotY, color });
  P.box(ctx, { x, z, y: 0.9, w: 1.8, d: 1.1, h: 0.08, rotY, color: 0xfff1d6, collide: false });
  P.sign(ctx, { x: x + 1.6, z, text, bg, rotY });
}
