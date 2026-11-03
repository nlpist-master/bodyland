// Saves progress on this device (localStorage). No accounts, no server.
const KEY = 'bodyquest.save';
const VERSION = 1;

function defaults() {
  return {
    version: VERSION,
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
  };
}

const OBJECTS = ['visited', 'flags', 'inventory', 'seen', 'picked', 'quests'];

export class ProgressManager {
  constructor() {
    this.data = defaults();
  }

  load() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(KEY));
    } catch {
      saved = null;
    }
    const d = defaults();
    if (saved && saved.version === VERSION) {
      this.data = { ...d, ...saved, settings: { ...d.settings, ...saved.settings } };
      for (const k of OBJECTS) this.data[k] = { ...saved[k] };
    } else {
      this.data = d;
    }
    return this.data;
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('[save] could not save progress', e);
    }
  }

  setFlag(name, value = true) {
    this.data.flags[name] = value;
    this.save();
  }

  /** Start over. Settings (quality, sound, steering) are kept. */
  reset() {
    const settings = this.data.settings;
    this.data = defaults();
    this.data.settings = settings;
    this.save();
  }
}
