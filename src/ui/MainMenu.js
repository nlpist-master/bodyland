import { openSettings, openAchievements } from './screens.js';

// The opening screen: continue, new game, settings and achievements, over
// the three children on their podiums.
export class MainMenu {
  constructor(game) {
    this.game = game;
    const el = (this.el = document.createElement('div'));
    el.className = 'menu-screen hidden';
    el.innerHTML = `
      <div class="logo" dir="ltr">BODY<span>QUEST</span></div>
      <div class="tagline">ההרפתקה הגדולה בתוך הגוף</div>
      <div class="menu-btns">
        <button class="btn big" data-m="continue">ממשיכים לשחק</button>
        <button class="btn big" data-m="new"></button>
        <div class="row">
          <button class="btn small ghost" data-m="settings">הגדרות</button>
          <button class="btn small ghost" data-m="achievements">הישגים</button>
        </div>
      </div>`;
    document.getElementById('ui').appendChild(el);
    this.continueBtn = el.querySelector('[data-m="continue"]');
    this.newBtn = el.querySelector('[data-m="new"]');
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-m]');
      if (!btn) return;
      btn.blur();
      game.audio.play('click');
      this._act(btn.dataset.m);
    });
  }

  get hasSave() {
    const d = this.game.progress.data;
    return !!(d.character && d.zone);
  }

  show() {
    const save = this.hasSave;
    this.continueBtn.classList.toggle('hidden', !save);
    this.newBtn.classList.toggle('alt', save);
    this.newBtn.textContent = 'משחק חדש';
    this.confirming = false;
    this.el.classList.remove('hidden');
  }

  hide() {
    this.el.classList.add('hidden');
  }

  _act(what) {
    const { game } = this;
    if (what === 'continue') game.continueGame();
    else if (what === 'settings') openSettings(game);
    else if (what === 'achievements') openAchievements(game);
    else if (!this.hasSave || this.confirming) game.newGame();
    else {
      // Ask twice so nobody erases their progress by accident.
      this.confirming = true;
      this.newBtn.textContent = 'בטוחים? כל ההתקדמות תימחק. לחצו שוב';
    }
  }

  update() {
    const { input, modal } = this.game;
    if (!modal && input.consume('confirm')) this._act(this.hasSave ? 'continue' : 'new');
  }
}
