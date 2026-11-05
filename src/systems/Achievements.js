import { ACHIEVEMENTS } from '../data/achievements.js';

// Awards badges. Badges that were already deserved when a save is loaded are
// recorded quietly, so an old save doesn't fill the screen with messages.
export class Achievements {
  constructor(game) {
    this.game = game;
    this._timer = 0;
  }

  has(id) {
    return !!this.game.progress.data.achievements[id];
  }

  get count() {
    return ACHIEVEMENTS.filter((a) => this.has(a.id)).length;
  }

  check(quiet = false) {
    const { progress, ui, audio } = this.game;
    for (const a of ACHIEVEMENTS) {
      if (this.has(a.id) || !a.got(this.game)) continue;
      progress.data.achievements[a.id] = true;
      progress.save();
      if (quiet) continue;
      audio.play('badge');
      ui.toast(`הישג חדש: ${a.icon} ${a.title}`, 'secret');
    }
  }

  update(dt) {
    this._timer -= dt;
    if (this._timer > 0) return;
    this._timer = 1;
    this.check();
  }
}
