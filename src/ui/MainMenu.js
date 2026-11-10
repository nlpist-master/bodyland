import { CHARACTER_BY_ID } from '../data/characters.js';
import { ICONS } from './icons.js';
import { openSettings, openAchievements, openContact, creditLine } from './screens.js';

// One child's menu: continue, new game, settings, achievements and contact, over the
// three characters on their podiums.
export class MainMenu {
  constructor(game) {
    this.game = game;
    const el = (this.el = document.createElement('div'));
    el.className = 'menu-screen hidden';
    el.innerHTML = `
      <div class="logo" dir="ltr">BODY<span>LAND</span></div>
      <div class="tagline menu-hello"></div>
      <div class="menu-btns">
        <button class="btn big" data-m="continue">ממשיכים לשחק</button>
        <button class="btn big" data-m="new"></button>
        <div class="row menu-grid">
          <button class="btn small ghost" data-m="settings">${ICONS.gear}<span>הגדרות</span></button>
          <button class="btn small ghost" data-m="achievements">${ICONS.medal}<span>הישגים</span></button>
          <button class="btn small ghost" data-m="players">${ICONS.person}<span>החלפת שחקן</span></button>
          <button class="btn small ghost" data-m="contact">${ICONS.mail}<span>צרו קשר</span></button>
        </div>
      </div>`;
    el.appendChild(creditLine(game));
    document.getElementById('ui').appendChild(el);
    this.continueBtn = el.querySelector('[data-m="continue"]');
    this.newBtn = el.querySelector('[data-m="new"]');
    this.hello = el.querySelector('.menu-hello');
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
    return !!(CHARACTER_BY_ID[d.character] && d.zone);
  }

  show() {
    const save = this.hasSave;
    this.continueBtn.classList.toggle('hidden', !save);
    this.newBtn.classList.toggle('alt', save);
    this.newBtn.textContent = 'משחק חדש';
    this.confirming = false;
    this.hello.textContent = `שלום ${this.game.progress.data.name}!`;
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
    else if (what === 'players') game.openPlayers();
    else if (what === 'contact') openContact(game);
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
