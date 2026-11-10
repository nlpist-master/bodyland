// Saves progress on this device (localStorage). No accounts, no server.
// Every child has a save of their own, found by its key. Graphics and sound
// belong to the device; steering belongs to the child.
const OLD_KEY = 'bodyland.save'; // the single save from before players; kept, only read
const DEVICE_KEY = 'bodyland.device';
const PLAYER_PREFIX = 'bodyland.player.';
const VERSION = 1;
export const MAX_PLAYERS = 20;
export const MAX_NAME = 14;

function defaults() {
  return {
    version: VERSION,
    name: '',
    played: 0,      // when this child last played, newest first in the list
    character: null,
    zone: null,
    visited: {},
    settings: { quality: 'auto', sound: true, steer: 'car' },
    flags: {},
    coins: 0,
    stars: 0,
    inventory: {},  // item id -> count
    seen: {},       // item ids ever collected
    picked: {},     // one-time pickups already taken (coins, parts)
    quests: {},     // quest id -> { state: 'active' | 'done', step }
    upgrades: {},   // upgrades bought in the workshop
    achievements: {},
  };
}

const OBJECTS = ['visited', 'flags', 'inventory', 'seen', 'picked', 'quests', 'upgrades', 'achievements'];

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('[save] could not save progress', e);
    return false;
  }
}

const isPlayer = (s) => s?.version === VERSION && typeof s.name === 'string' && !!s.name;

export const cleanName = (s) => String(s).replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);

export class ProgressManager {
  constructor() {
    this.id = null; // the child playing now; null while nobody was chosen
    this.device = { quality: 'auto', sound: true, oldSaveDone: false };
    this.oldSave = null; // a save from before players, waiting for a name
    this.data = defaults();
  }

  load() {
    const old = read(OLD_KEY);
    const device = read(DEVICE_KEY);
    const first = device ? {} : { quality: old?.settings?.quality ?? 'auto', sound: old?.settings?.sound ?? true };
    this.device = { ...this.device, ...first, ...device };
    this.oldSave = old?.version === VERSION && old.character && !this.device.oldSaveDone ? old : null;
    this.leave();
    return this.data;
  }

  /** Everyone saved on this device, last played first. */
  players() {
    const list = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith(PLAYER_PREFIX)) continue;
        const s = read(key);
        if (!isPlayer(s)) continue;
        list.push({
          id: key.slice(PLAYER_PREFIX.length), name: s.name, character: s.character,
          stars: Number.isFinite(s.stars) ? s.stars : 0, played: s.played || 0,
        });
      }
    } catch {
      return [];
    }
    return list.sort((a, b) => b.played - a.played);
  }

  nameTaken(name) {
    const same = cleanName(name).toLowerCase();
    return this.players().some((p) => p.id !== this.id && p.name.toLowerCase() === same);
  }

  /** A save as read from storage, with anything missing or broken filled in. */
  _fill(saved) {
    const data = { ...defaults(), ...saved };
    data.settings = this._settings(saved.settings?.steer);
    for (const k of OBJECTS) data[k] = { ...saved[k] };
    for (const k of ['coins', 'stars']) if (!Number.isFinite(data[k])) data[k] = 0;
    return data;
  }

  _settings(steer) {
    return { quality: this.device.quality, sound: this.device.sound, steer: steer === 'free' ? 'free' : 'car' };
  }

  _start(id, data) {
    this.id = id;
    this.data = data;
    data.played = Date.now();
    return this.save();
  }

  /** A new child. from: the old save, which becomes this child's progress. */
  create(name, from = null) {
    const data = from ? this._fill(from) : { ...defaults(), settings: this._settings() };
    data.name = cleanName(name);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    if (this._start(id, data) && from) {
      this.oldSave = null;
      this.device.oldSaveDone = true;
      write(DEVICE_KEY, this.device);
    }
  }

  select(id) {
    const saved = read(PLAYER_PREFIX + id);
    if (!isPlayer(saved)) return false;
    this._start(id, this._fill(saved));
    return true;
  }

  /** Nobody is playing: nothing can reach a child's save until one is chosen. */
  leave() {
    this.id = null;
    this.data = { ...defaults(), settings: this._settings() };
  }

  rename(name) {
    this.data.name = cleanName(name);
    this.save();
  }

  /** Erase this child completely. */
  remove() {
    try {
      localStorage.removeItem(PLAYER_PREFIX + this.id);
    } catch {
      // Nothing was stored, so there is nothing to erase.
    }
    this.leave();
  }

  save() {
    const { quality, sound, steer } = this.data.settings;
    Object.assign(this.device, { quality, sound });
    write(DEVICE_KEY, this.device);
    return !!this.id && write(PLAYER_PREFIX + this.id, { ...this.data, settings: { steer } });
  }

  setFlag(name, value = true) {
    this.data.flags[name] = value;
    this.save();
  }

  /** Start over: this child keeps their name and settings. */
  reset() {
    const { name, played, settings } = this.data;
    this.data = { ...defaults(), name, played, settings };
    this.save();
  }
}
