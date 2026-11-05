// Things the player can use with E / the action button, plus invisible
// trigger areas that react when the player walks in.
export class InteractionSystem {
  constructor(game) {
    this.game = game;
    this.items = [];
    this.triggers = [];
    this.current = null;
  }

  clear() {
    this.items.length = 0;
    this.triggers.length = 0;
    this._setCurrent(null);
  }

  /** { position: Vector3, label, radius?, once?, when?(), onInteract(item) } */
  add(o) {
    const item = { radius: 1.8, once: false, enabled: true, ...o };
    this.items.push(item);
    return item;
  }

  /** { x, z, r, minY?, maxY?, once?, onEnter(), onExit() } */
  addTrigger(o) {
    const t = { minY: -Infinity, maxY: Infinity, once: false, inside: false, done: false, ...o };
    this.triggers.push(t);
    return t;
  }

  _setCurrent(item) {
    if (item === this.current) return;
    this.current = item;
    const label = item ? item.label : null;
    this.game.ui?.showPrompt(label);
    this.game.touch?.setInteract(label);
  }

  update() {
    const { player, input } = this.game;
    const p = player.pos;
    let best = null;
    let bestD = Infinity;
    for (const it of this.items) {
      if (!it.enabled || (it.when && !it.when())) continue;
      const dx = it.position.x - p.x, dz = it.position.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < it.radius && d < bestD && Math.abs(it.position.y - p.y) < 2.2) {
        best = it;
        bestD = d;
      }
    }
    this._setCurrent(best);

    if (input.consume('interact') && best) {
      if (best.once) best.enabled = false;
      player.act();
      best.onInteract(best);
      this._setCurrent(null);
    }

    for (const t of this.triggers) {
      if (t.done) continue;
      const inside = Math.hypot(t.x - p.x, t.z - p.z) < t.r && p.y >= t.minY && p.y <= t.maxY;
      if (inside && !t.inside) {
        t.inside = true;
        t.onEnter?.();
        if (t.once) t.done = true;
      } else if (!inside && t.inside) {
        t.inside = false;
        t.onExit?.();
      }
    }
  }
}
