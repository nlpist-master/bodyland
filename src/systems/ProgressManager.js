// Saves progress on this device (localStorage). No accounts, no server.
const KEY = 'bodyquest.save';
const VERSION = 1;

function defaults() {
  return {
    version: VERSION,
    character: null,
    settings: { quality: 'auto', sound: true },
    flags: {},
  };
}

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
      this.data = { ...d, ...saved, settings: { ...d.settings, ...saved.settings }, flags: { ...saved.flags } };
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

  reset() {
    this.data = defaults();
    this.save();
  }
}
