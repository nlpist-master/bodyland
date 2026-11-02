import { ITEMS } from '../data/items.js';

// The backpack (item counts), coins and stars. Everything is stored in the
// save file, so it survives closing the game.
export class Inventory {
  constructor(game) {
    this.game = game;
    this.listeners = new Set();
  }

  get data() {
    return this.game.progress.data;
  }

  onChange(fn) {
    this.listeners.add(fn);
  }

  _changed() {
    this.game.progress.save();
    for (const fn of this.listeners) fn();
  }

  count(id) {
    return this.data.inventory[id] || 0;
  }

  add(id, n = 1) {
    const inv = this.data.inventory;
    inv[id] = (inv[id] || 0) + n;
    this.data.seen[id] = true;
    this._changed();
  }

  remove(id, n = 1) {
    const inv = this.data.inventory;
    if ((inv[id] || 0) < n) return false;
    inv[id] -= n;
    if (!inv[id]) delete inv[id];
    this._changed();
    return true;
  }

  /** Items currently carried, as [{ id, def, count }], foods first. */
  list() {
    return Object.entries(this.data.inventory)
      .filter(([id, n]) => n > 0 && ITEMS[id])
      .map(([id, count]) => ({ id, def: ITEMS[id], count }))
      .sort((a, b) => (a.def.kind === b.def.kind ? 0 : a.def.kind === 'food' ? -1 : 1));
  }

  get coins() {
    return this.data.coins;
  }

  get stars() {
    return this.data.stars;
  }

  addCoins(n) {
    this.data.coins += n;
    this._changed();
  }

  spendCoins(n) {
    if (this.data.coins < n) return false;
    this.data.coins -= n;
    this._changed();
    return true;
  }

  addStars(n) {
    this.data.stars += n;
    this._changed();
  }
}
