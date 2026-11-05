import { CHARACTER_BY_ID } from '../data/characters.js';
import { MAX_PLAYERS, MAX_NAME, cleanName } from '../systems/ProgressManager.js';
import { cardColor } from './CharacterSelect.js';

// "Who is playing today?": a card for every child, and the screen that asks
// for a name.
export class PlayersScreen {
  constructor(game) {
    this.game = game;
    const el = (this.el = document.createElement('div'));
    el.className = 'menu-screen players-screen hidden';
    el.innerHTML = `
      <div class="players-pick">
        <h1 class="select-title">מי משחק היום?</h1>
        <div class="players-grid"></div>
        <div class="players-count"></div>
        <button class="btn big players-add">+ שחקן חדש</button>
        <p class="players-full hidden">הגעתם ל-${MAX_PLAYERS} שחקנים. כדי להוסיף שחקן, נכנסים לשחקן אחר ומוחקים אותו בהגדרות.</p>
      </div>
      <form class="players-ask hidden" autocomplete="off">
        <h1 class="select-title"></h1>
        <p class="ask-note"></p>
        <input class="name-input" type="text" maxlength="${MAX_NAME}" dir="auto" enterkeyhint="done" autocomplete="off" aria-label="שם">
        <p class="ask-error"></p>
        <div class="row">
          <button class="btn big" type="submit">ממשיכים</button>
          <button class="btn ghost ask-back" type="button">חזרה</button>
        </div>
      </form>`;
    document.getElementById('ui').appendChild(el);
    this.pick = el.querySelector('.players-pick');
    this.grid = el.querySelector('.players-grid');
    this.count = el.querySelector('.players-count');
    this.add = el.querySelector('.players-add');
    this.full = el.querySelector('.players-full');
    this.ask = el.querySelector('.players-ask');
    this.input = el.querySelector('.name-input');
    this.error = el.querySelector('.ask-error');
    this.backBtn = el.querySelector('.ask-back');

    this.add.addEventListener('click', () => {
      game.audio.play('click');
      this.add.blur();
      this.askName({
        title: 'מה השם שלך?',
        onBack: () => this.show(),
        onDone: (name) => game.addPlayer(name),
      });
    });
    this.backBtn.addEventListener('click', () => {
      game.audio.play('click');
      this.onBack();
    });
    this.ask.addEventListener('submit', (e) => {
      e.preventDefault();
      this._submit();
    });
    this.input.addEventListener('input', () => { this.error.textContent = ''; });
  }

  show() {
    const { game } = this;
    const { progress } = game;
    this.el.classList.remove('hidden');
    if (progress.oldSave) {
      return this.askName({
        title: 'מה השם של מי ששיחק עד עכשיו?',
        note: 'כל ההתקדמות נשמרה. צריך רק לכתוב שם.',
        onDone: (name) => game.adoptOldSave(name),
      });
    }
    const list = progress.players();
    if (!list.length) return this.askName({ title: 'מה השם שלך?', onDone: (name) => game.addPlayer(name) });

    this.ask.classList.add('hidden');
    this.el.classList.remove('asking');
    this.pick.classList.remove('hidden');
    this.grid.innerHTML = '';
    for (const p of list) this.grid.appendChild(this._card(p));
    this.grid.scrollTop = 0;
    this.count.textContent = `${list.length} מתוך ${MAX_PLAYERS} שחקנים`;
    const full = list.length >= MAX_PLAYERS;
    this.add.classList.toggle('hidden', full);
    this.full.classList.toggle('hidden', !full);
  }

  _card(p) {
    const def = CHARACTER_BY_ID[p.character];
    const card = document.createElement('button');
    card.className = 'card player-card';
    card.innerHTML = '<span class="card-dot"></span><b></b><small></small>';
    if (def) card.firstChild.style.setProperty('--c', cardColor(def));
    card.querySelector('b').textContent = p.name;
    card.querySelector('small').textContent = `⭐ ${p.stars}`;
    card.addEventListener('click', () => {
      this.game.audio.play('click');
      card.blur();
      this.game.choosePlayer(p.id);
    });
    return card;
  }

  /** Ask for a name. Without onBack there is no way out but to answer. */
  askName({ title, note = '', value = '', onBack = null, onDone }) {
    this.onBack = onBack;
    this.onDone = onDone;
    this.el.classList.remove('hidden');
    this.el.classList.add('asking');
    this.pick.classList.add('hidden');
    this.ask.classList.remove('hidden');
    this.ask.querySelector('h1').textContent = title;
    this.ask.querySelector('.ask-note').textContent = note;
    this.backBtn.classList.toggle('hidden', !onBack);
    this.error.textContent = '';
    this.input.value = value;
    if (!this.game.touch.enabled) this.input.focus();
  }

  _submit() {
    const { audio, progress } = this.game;
    const name = cleanName(this.input.value);
    const problem = !name ? 'כתבו שם כדי להמשיך' : progress.nameTaken(name) ? 'השם הזה כבר תפוס. נסו שם אחר' : '';
    this.error.textContent = problem;
    if (problem) return audio.play('click');
    audio.play('success');
    this.onDone(name);
  }

  hide() {
    this.input.blur();
    this.el.classList.add('hidden');
  }
}
