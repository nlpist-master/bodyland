import { QUESTS, QUEST_ORDER } from '../data/quests.js';
import { ITEMS } from '../data/items.js';

// Runs the missions: starts them when the player talks to the giver,
// checks each step automatically, hands out rewards and keeps track of
// how much of each zone has been restored.
export class QuestManager {
  constructor(game) {
    this.game = game;
    this.listeners = new Set();
    this._timer = 0;
  }

  get state() {
    return this.game.progress.data.quests;
  }

  onChange(fn) {
    this.listeners.add(fn);
  }

  _changed() {
    this.game.progress.save();
    for (const fn of this.listeners) fn();
  }

  status(id) {
    return this.state[id]?.state || null;
  }

  isDone(id) {
    return this.status(id) === 'done';
  }

  get isDoneAll() {
    return QUEST_ORDER.every((id) => this.isDone(id));
  }

  canStart(id) {
    const q = QUESTS[id];
    return !this.status(id) && (!q.after || this.isDone(q.after));
  }

  start(id) {
    this.state[id] = { state: 'active', step: 0 };
    this.game.audio.play('quest');
    this.game.ui.toast('משימה חדשה: ' + QUESTS[id].title, 'quest');
    this._changed();
    this._check(id);
  }

  step(id) {
    const s = this.state[id];
    return s && s.state === 'active' ? QUESTS[id].steps[s.step] : null;
  }

  /**
   * Called when the player talks to an NPC. Returns { line, started } for a
   * mission event (new mission, or a "talk to me" step), otherwise null.
   */
  talk(npc, zone) {
    for (const id of QUEST_ORDER) {
      const st = this.step(id);
      if (st && st.type === 'talk' && st.npc === npc && st.zone === zone) {
        this._advance(id);
        return { line: st.say };
      }
    }
    for (const id of QUEST_ORDER) {
      if (this._owesThanks(id, npc, zone)) {
        this.state[id].thanked = true;
        this.game.progress.save();
        return { line: QUESTS[id].thanks };
      }
    }
    for (const id of QUEST_ORDER) {
      const q = QUESTS[id];
      if (q.giver === npc && q.zone === zone && this.canStart(id)) {
        this.start(id);
        return { line: q.intro, started: true };
      }
    }
    return null;
  }

  /** A finished mission whose giver has not yet said what came of it. */
  _owesThanks(id, npc, zone) {
    const q = QUESTS[id];
    return q.thanks && q.giver === npc && q.zone === zone && this.isDone(id) && !this.state[id].thanked;
  }

  /**
   * What an NPC repeats about the missions they gave that are still running:
   * the full explanation, then the current step. Same order every time.
   */
  linesFor(npc, zone) {
    const out = [];
    for (const id of QUEST_ORDER) {
      const q = QUESTS[id];
      if (q.giver !== npc || q.zone !== zone || this.status(id) !== 'active') continue;
      out.push(q.intro);
      const st = this.step(id);
      if (st) out.push('עכשיו צריך: ' + st.text + '.');
    }
    return out;
  }

  /** Does this NPC have a new mission or a mission step waiting? */
  hasNews(npc, zone) {
    for (const id of QUEST_ORDER) {
      const q = QUESTS[id];
      if (q.giver === npc && q.zone === zone && this.canStart(id)) return true;
      if (this._owesThanks(id, npc, zone)) return true;
      const st = this.step(id);
      if (st && st.type === 'talk' && st.npc === npc && st.zone === zone) return true;
    }
    return false;
  }

  /** { n, m } progress of a step. */
  progress(st) {
    const d = this.game.progress.data;
    const inv = this.game.inventory;
    switch (st.type) {
      case 'collect': {
        let n = 0, m = 0;
        for (const [item, c] of st.need) {
          n += Math.min(c, inv.count(item));
          m += c;
        }
        return { n, m };
      }
      case 'flag':
        return { n: d.flags[st.flag] ? 1 : 0, m: 1 };
      case 'flags':
        return { n: st.flags.filter((f) => d.flags[f]).length, m: st.flags.length };
      case 'visit':
        return { n: st.zones.filter((z) => d.visited[z]).length, m: st.zones.length };
      case 'quests':
        return { n: st.quests.filter((q) => this.isDone(q)).length, m: st.quests.length };
      case 'colors': {
        const seen = new Set(Object.keys(d.seen).map((id) => ITEMS[id]?.color).filter(Boolean));
        return { n: st.colors.filter((c) => seen.has(c)).length, m: st.colors.length };
      }
      default:
        return { n: 0, m: 1 };
    }
  }

  _check(id) {
    const st = this.step(id);
    if (!st || st.type === 'talk') return;
    const { n, m } = this.progress(st);
    if (n >= m) this._advance(id);
  }

  _advance(id) {
    const q = QUESTS[id];
    const s = this.state[id];
    const { ui, audio } = this.game;
    s.step++;
    if (s.step >= q.steps.length) {
      s.state = 'done';
      const r = q.reward;
      if (r.coins) this.game.inventory.addCoins(r.coins);
      if (r.stars) this.game.inventory.addStars(r.stars);
      audio.play('success');
      this.game.player?.celebrate(2);
      const p = this.game.player?.pos;
      if (p) for (const color of ['gold', 'pink', 'teal']) this.game.effects.burst(p.x, p.y + 1.2, p.z, { color, n: 6, speed: 4 });
      ui.toast(`משימה הושלמה: ${q.title}! פרס: ${r.coins} 🪙${r.stars ? ` · ${r.stars} ⭐` : ''}`, 'good');
    } else {
      audio.play('step-done');
      ui.toast('✔ ' + q.steps[s.step - 1].text, 'small');
    }
    this._changed();
    if (s.state === 'active') this._check(id);
  }

  update(dt) {
    this._timer -= dt;
    if (this._timer > 0) return;
    this._timer = 0.25;
    for (const id of QUEST_ORDER) if (this.status(id) === 'active') this._check(id);
  }

  /** The quest shown in the HUD: an active one in this zone, main first. */
  tracked(zone) {
    let best = null;
    const rank = { main: 0, side: 1, challenge: 2 };
    for (const id of QUEST_ORDER) {
      if (this.status(id) !== 'active') continue;
      const q = QUESTS[id];
      const score = (q.zone === zone ? 0 : 10) + rank[q.kind];
      if (!best || score < best.score) best = { id, score };
    }
    return best ? best.id : null;
  }

  /** 0..1: how much of a zone has been restored (its quests done). */
  restored(zone) {
    const ids = QUEST_ORDER.filter((id) => QUESTS[id].zone === zone);
    if (!ids.length) return 0;
    return ids.filter((id) => this.isDone(id)).length / ids.length;
  }
}
