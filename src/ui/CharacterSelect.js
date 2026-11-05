import { CHARACTERS } from '../data/characters.js';
import { createCharacter } from '../characters/CharacterBuilder.js';

// Character select: three children on podiums, cards below.
// Cards are right-to-left, matching the characters from right to left on screen.
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
export const cardColor = (def) => hex(def.shirt === 0xffffff ? def.bag : def.shirt);

export class CharacterSelect {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.el = null;
    this.chars = [];
    this.index = 0;
  }

  open(currentId, onChoose) {
    const g = this.game;
    const zone = g.world.load('select');
    this.chars = CHARACTERS.map((def, i) => {
      const c = createCharacter(def);
      const s = zone.slots[i];
      c.root.position.set(s.x, s.y, s.z);
      g.world.root.add(c.root);
      return c;
    });
    this.onChoose = onChoose;

    const el = (this.el = document.createElement('div'));
    el.className = 'select-screen';
    el.innerHTML = `
      <h1 class="select-title">מי יוצא להרפתקה?</h1>
      <div class="select-bottom">
        <div class="select-cards">
          ${CHARACTERS.map((d, i) => `
            <button class="card" data-i="${i}">
              <span class="card-dot" style="--c:${cardColor(d)}"></span>
              <b>${d.name}</b><small>${d.blurb}</small>
            </button>`).join('')}
        </div>
        <button class="btn big go">יוצאים לדרך!</button>
        <div class="select-tip">אפשר להחליף דמות בכל רגע מתפריט ההשהיה</div>
      </div>`;
    document.getElementById('ui').appendChild(el);
    el.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('click', () => {
        card.blur();
        this.select(Number(card.dataset.i));
      });
    });
    el.querySelector('.go').addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.confirm();
    });

    this.index = Math.max(0, CHARACTERS.findIndex((d) => d.id === currentId));
    this.select(this.index, true);
    this.active = true;
    this._placeCamera();
  }

  _placeCamera() {
    const cam = this.game.engine.camera;
    const far = cam.aspect < 1 ? 9.5 : 6;
    cam.position.set(0, 1.5, far);
    cam.lookAt(0, 0.75, 0);
  }

  select(i, silent) {
    this.index = (i + CHARACTERS.length) % CHARACTERS.length;
    this.el.querySelectorAll('.card').forEach((c, j) => c.classList.toggle('sel', j === this.index));
    if (!silent) this.game.audio.play('select');
  }

  highlight(id) {
    this.select(Math.max(0, CHARACTERS.findIndex((d) => d.id === id)), true);
  }

  confirm() {
    if (!this.active) return;
    this.game.audio.play('success');
    this.onChoose(CHARACTERS[this.index].id);
  }

  setVisible(on) {
    this.el?.classList.toggle('hidden', !on);
  }

  /** idle: the main menu is on top, so the keys are not for us. */
  update(dt, idle = false) {
    const input = this.game.input;
    if (!idle) {
      // Index 0 is the rightmost card, so "left" moves to a higher index.
      if (input.consume('left')) this.select(this.index + 1);
      if (input.consume('right')) this.select(this.index - 1);
      if (input.consume('confirm') || input.consume('jump')) return this.confirm();
    }
    this._placeCamera();

    const k = 1 - Math.exp(-8 * dt);
    this.chars.forEach((c, i) => {
      const sel = i === this.index;
      c.animator.update(dt, sel ? 'wave' : 'idle');
      const s = c.root.scale.x + ((sel ? 1.12 : 0.95) - c.root.scale.x) * k;
      c.root.scale.setScalar(s);
      const yaw = sel ? 0 : c.root.position.x > 0 ? -0.35 : c.root.position.x < 0 ? 0.35 : 0;
      c.root.rotation.y += (yaw - c.root.rotation.y) * k;
    });
  }

  close() {
    this.active = false;
    this.el?.remove();
    this.el = null;
    this.chars = [];
  }
}
