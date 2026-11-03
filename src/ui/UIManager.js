import { ICONS } from './icons.js';
import { HUD } from './HUD.js';
import { openInventory, openQuests, openMap } from './screens.js';

// HTML overlay: top bar, interaction prompt, toasts, fade, pause and help.
const QUALITY_NAMES = { auto: 'אוטומטי', high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };

const MOVE_KEYS = {
  car: `
    <li><span dir="ltr"><kbd>W</kbd> / <kbd>↑</kbd></span>הליכה קדימה</li>
    <li><span dir="ltr"><kbd>A</kbd><kbd>D</kbd> / <kbd>←</kbd><kbd>→</kbd></span>סיבוב ימינה ושמאלה</li>
    <li><span dir="ltr"><kbd>S</kbd> / <kbd>↓</kbd></span>נסיעה לאחור</li>`,
  free: `
    <li><span dir="ltr"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></span>הליכה</li>`,
};
const MOVE_TOUCH = {
  car: `
    <li><span>ג'ויסטיק מימין</span>קדימה: הליכה · הצידה: סיבוב · אחורה: נסיעה לאחור. דחיפה קדימה עד הסוף: ריצה</li>`,
  free: `
    <li><span>ג'ויסטיק מימין</span>הליכה. דחיפה עד הסוף: ריצה</li>`,
};
const HELP_KEYS = (steer) => `
  <ul class="keys">${MOVE_KEYS[steer]}
    <li><span><kbd>Shift</kbd></span>ריצה (להחזיק)</li>
    <li><span><kbd>רווח</kbd></span>קפיצה – החזיקו לקפיצה גבוהה</li>
    <li><span><kbd>E</kbd></span>פעולה: לדבר, להפעיל מכונות ועוד</li>
    <li><span><kbd>I</kbd> <kbd>J</kbd> <kbd>M</kbd></span>תיק · משימות · מפה</li>
    <li><span>גרירת עכבר</span>סיבוב המצלמה · גלגלת – זום</li>
    <li><span><kbd>Esc</kbd></span>השהיה</li>
  </ul>`;
const HELP_TOUCH = (steer) => `
  <ul class="keys">${MOVE_TOUCH[steer]}
    <li><span>החלקה על המסך</span>סיבוב המצלמה</li>
    <li><span>קפיצה (משמאל)</span>החזיקו לקפיצה גבוהה</li>
    <li><span>פעולה (משמאל)</span>נדלק כשיש משהו להפעיל</li>
    <li><span>כפתורים למעלה</span>תיק, משימות ומפה</li>
  </ul>`;

export class UIManager {
  constructor(game) {
    this.game = game;
    const root = (this.root = document.getElementById('ui'));
    root.insertAdjacentHTML('beforeend', `
      <div class="hud hidden">
        <div class="hud-top">
          <div class="hud-right">
            <div class="chip zone-title"></div>
            <div class="restore hidden"><i></i><span></span></div>
            <button class="tracker hidden"><b class="tr-title"></b><span class="tr-step"></span><span class="tr-bar"><i></i></span></button>
          </div>
          <div class="hud-left">
            <div class="hud-btns">
              <button class="icon-btn pause-btn" aria-label="השהיה">${ICONS.pause}</button>
              <button class="icon-btn" data-open="inventory" aria-label="התיק">${ICONS.bag}</button>
              <button class="icon-btn" data-open="quests" aria-label="משימות">${ICONS.quests}</button>
              <button class="icon-btn" data-open="map" aria-label="מפה">${ICONS.map}</button>
            </div>
            <div class="hud-stats"><span class="stat stat-coins">🪙 <b>0</b></span><span class="stat stat-stars">⭐ <b>0</b></span></div>
            <div class="map-slot"></div>
          </div>
        </div>
      </div>
      <div class="prompt hidden"><kbd>E</kbd><span></span></div>
      <div class="toasts"></div>
      <div class="modal pause hidden">
        <div class="panel">
          <h2>המשחק מושהה</h2>
          <button class="btn big" data-act="resume">ממשיכים לשחק</button>
          <button class="btn alt" data-act="help">איך משחקים?</button>
          <button class="btn alt" data-act="character">החלפת דמות</button>
          <div class="row">
            <button class="btn small ghost" data-act="quality"></button>
            <button class="btn small ghost" data-act="sound"></button>
          </div>
          <button class="btn small ghost" data-act="steer"></button>
          <button class="btn small ghost" data-act="fullscreen">מסך מלא</button>
          <button class="btn small ghost danger" data-act="newgame">משחק חדש</button>
        </div>
      </div>
      <div class="modal help hidden">
        <div class="panel">
          <h2>איך משחקים?</h2>
          <div class="help-keys"></div>
          <p class="note">ממרכז העולם יוצאים בשערים לחמישה אזורים בתוך הגוף ולזירת האימונים. דברו עם החברים שתפגשו, טפסו לכל מקום, וחפשו מקומות סודיים!</p>
          <button class="btn big" data-act="close-help">הבנתי, יוצאים!</button>
        </div>
      </div>
      <div class="fade"></div>`);

    const q = (s) => root.querySelector(s);
    this.hud = q('.hud');
    this.zoneTitle = q('.zone-title');
    this.prompt = q('.prompt');
    this.promptKey = q('.prompt kbd');
    this.promptText = q('.prompt span');
    this.toasts = q('.toasts');
    this.pauseEl = q('.modal.pause');
    this.helpEl = q('.modal.help');
    this.fadeEl = q('.fade');
    this.qualityBtn = q('[data-act="quality"]');
    this.soundBtn = q('[data-act="sound"]');
    this.steerBtn = q('[data-act="steer"]');

    const fsBtn = q('[data-act="fullscreen"]');
    if (!document.documentElement.requestFullscreen) fsBtn.remove();

    q('.pause-btn').addEventListener('click', (e) => {
      e.currentTarget.blur();
      game.togglePause();
    });
    const screens = { inventory: openInventory, quests: openQuests, map: openMap };
    root.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', (e) => {
      e.currentTarget.blur();
      if (game.state !== 'play' || game.modal) return;
      game.audio.play('click');
      screens[b.dataset.open](game);
    }));
    q('.tracker').addEventListener('click', (e) => {
      e.currentTarget.blur();
      if (game.state === 'play' && !game.modal) openQuests(game);
    });
    this.newGameBtn = q('[data-act="newgame"]');
    this.hudLogic = new HUD(game, this.hud);
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      btn.blur();
      game.audio.play('click');
      const act = btn.dataset.act;
      if (act === 'resume') game.resume();
      else if (act === 'help') this.showHelp(true);
      else if (act === 'close-help') game.resume();
      else if (act === 'character') game.openCharacterSelect();
      else if (act === 'quality') game.cycleQuality();
      else if (act === 'sound') game.toggleSound();
      else if (act === 'steer') game.toggleSteer();
      else if (act === 'fullscreen') game.toggleFullscreen();
      else if (act === 'newgame') {
        // Ask twice so nobody erases their progress by accident.
        if (btn.classList.contains('confirm')) game.newGame();
        else {
          btn.classList.add('confirm');
          btn.textContent = 'בטוחים? כל ההתקדמות תימחק. לחצו שוב';
        }
      }
      this.refreshSettings();
    });
    this.refreshSettings();
  }

  refreshSettings() {
    const s = this.game.progress.data.settings;
    this.qualityBtn.textContent = 'גרפיקה: ' + QUALITY_NAMES[s.quality];
    this.soundBtn.textContent = 'צלילים: ' + (s.sound ? 'פועלים' : 'כבויים');
    this.steerBtn.textContent = 'שליטה: ' + (s.steer === 'free' ? 'חופשית' : 'כמו רכב');
  }

  showHUD(on) {
    this.hud.classList.toggle('hidden', !on);
    if (!on) this.showPrompt(null);
  }

  setZoneTitle(text) {
    this.zoneTitle.textContent = text;
  }

  showPrompt(label) {
    this.prompt.classList.toggle('hidden', !label);
    if (!label) return;
    const touch = this.game.touch.enabled;
    this.promptKey.classList.toggle('hidden', touch);
    this.promptText.textContent = touch ? label + ' – לחצו על "פעולה"' : label;
  }

  toast(text, kind = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.textContent = text;
    this.toasts.appendChild(el);
    while (this.toasts.children.length > 3) this.toasts.firstChild.remove();
    setTimeout(() => el.classList.add('out'), 2800);
    setTimeout(() => el.remove(), 3300);
  }

  /** Fade the screen to dark (true) or back (false). Resolves when done. */
  fade(on) {
    this.fadeEl.classList.toggle('on', on);
    return new Promise((r) => setTimeout(r, 300));
  }

  showPause(on) {
    this.pauseEl.classList.toggle('hidden', !on);
    this.newGameBtn.classList.remove('confirm');
    this.newGameBtn.textContent = 'משחק חדש';
    if (on) this.refreshSettings();
  }

  showHelp(on) {
    if (on) {
      const steer = this.game.progress.data.settings.steer === 'free' ? 'free' : 'car';
      this.helpEl.querySelector('.help-keys').innerHTML = (this.game.touch.enabled ? HELP_TOUCH : HELP_KEYS)(steer);
      this.pauseEl.classList.add('hidden');
    }
    this.helpEl.classList.toggle('hidden', !on);
    this.game.setModal(on ? 'help' : null);
  }
}
