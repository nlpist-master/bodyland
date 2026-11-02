import { QUESTS } from '../data/quests.js';
import { Minimap } from './Minimap.js';

// In-game overlay: coins and stars, the tracked mission with its progress,
// how much of the zone is restored, and the minimap.
export class HUD {
  constructor(game, hud) {
    this.game = game;
    const q = (s) => hud.querySelector(s);
    this.coins = q('.stat-coins b');
    this.stars = q('.stat-stars b');
    this.tracker = q('.tracker');
    this.trTitle = q('.tracker .tr-title');
    this.trStep = q('.tracker .tr-step');
    this.trBar = q('.tracker .tr-bar i');
    this.restore = q('.restore');
    this.restoreBar = q('.restore i');
    this.restoreText = q('.restore span');
    this.minimap = new Minimap(q('.map-slot'));
    this.trackedId = null;
    this._lastCoins = null;
    game.inventory.onChange(() => this.refresh());
    game.quests.onChange(() => this.refresh());
  }

  refresh() {
    const { inventory, quests, world } = this.game;
    if (this._lastCoins !== null && inventory.coins > this._lastCoins) this._bump(this.coins);
    this._lastCoins = inventory.coins;
    this.coins.textContent = inventory.coins;
    this.stars.textContent = inventory.stars;

    const zone = world.id;
    const id = quests.tracked(zone);
    this.trackedId = id;
    this.tracker.classList.toggle('hidden', !id);
    if (id) {
      const def = QUESTS[id];
      const st = quests.step(id);
      const { n, m } = quests.progress(st);
      this.trTitle.textContent = (def.kind === 'challenge' ? '⏱ ' : def.kind === 'side' ? '✦ ' : '★ ') + def.title;
      this.trStep.textContent = st.text + (m > 1 ? `  (${n}/${m})` : '');
      this.trBar.style.width = (m > 1 ? (n / m) * 100 : 0) + '%';
      this.trBar.parentElement.classList.toggle('hidden', m <= 1);
    }
    const r = zone && zone !== 'select' ? quests.restored(zone) : 0;
    const hasQuests = Object.values(QUESTS).some((qq) => qq.zone === zone);
    this.restore.classList.toggle('hidden', !hasQuests);
    this.restoreBar.style.width = r * 100 + '%';
    this.restoreText.textContent = (zone === 'hub' ? 'התקדמות: ' : 'שיקום האזור: ') + Math.round(r * 100) + '%';
  }

  _bump(el) {
    el.parentElement.classList.remove('bump');
    void el.offsetWidth;
    el.parentElement.classList.add('bump');
  }

  /** Where the minimap star points: the current step's target. */
  target() {
    const id = this.trackedId;
    if (!id) return null;
    const def = QUESTS[id];
    if (def.zone !== this.game.world.id) {
      // Mission in another zone: point at that zone's portal in the hub.
      return this.game.world.zone?.portalOf?.(def.zone) || null;
    }
    const st = this.game.quests.step(id);
    if (!st) return null;
    if (st.find) {
      // Point at the nearest useful pickup until carrying enough for the machine/gate.
      const inv = this.game.inventory;
      const carried = st.find.reduce((s, item) => s + inv.count(item), 0);
      const enough = st.type !== 'collect' && carried >= (st.type === 'flags' ? 2 : 3);
      const p = enough ? null : this.game.pickups.nearest(st.find);
      if (p) return p;
    }
    if (st.at) return { x: st.at[0], z: st.at[1] };
    if (st.type === 'visit') {
      const z = st.zones.find((zz) => !this.game.progress.data.visited[zz]);
      return z ? this.game.world.zone?.portalOf?.(z) || null : null;
    }
    return null;
  }

  update(dt) {
    const { player, cameraCtl, npcs } = this.game;
    if (player) this.minimap.draw(dt, player, cameraCtl.yaw, this.target(), npcs.list);
  }
}
