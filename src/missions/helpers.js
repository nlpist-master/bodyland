import * as THREE from 'three';
import { ITEMS } from '../data/items.js';

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
