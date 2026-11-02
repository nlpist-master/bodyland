import { ICONS } from './icons.js';

// HTML overlay: top bar, interaction prompt, toasts, fade, pause and help.
const QUALITY_NAMES = { auto: 'אוטומטי', high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };

const HELP_KEYS = `
  <ul class="keys">
    <li><span dir="ltr"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></span>הליכה</li>
    <li><span><kbd>Shift</kbd></span>ריצה (להחזיק)</li>
    <li><span><kbd>רווח</kbd></span>קפיצה – החזיקו לקפיצה גבוהה</li>
    <li><span><kbd>E</kbd></span>פעולה (ידיות, מכונות ועוד)</li>
    <li><span>גרירת עכבר</span>סיבוב המצלמה · גלגלת – זום</li>
    <li><span><kbd>Esc</kbd></span>השהיה</li>
  </ul>`;
const HELP_TOUCH = `
  <ul class="keys">
    <li><span>ג'ויסטיק משמאל</span>הליכה לכל כיוון</li>
    <li><span>החלקה על המסך</span>סיבוב המצלמה</li>
    <li><span>קפיצה</span>החזיקו לקפיצה גבוהה</li>
    <li><span>ריצה</span>הפעלה / כיבוי של ריצה</li>
    <li><span>פעולה</span>נדלק כשיש משהו להפעיל</li>
  </ul>`;

export class UIManager {
  constructor(game) {
    this.game = game;
    const root = (this.root = document.getElementById('ui'));
    root.insertAdjacentHTML('beforeend', `
      <div class="hud hidden">
        <div class="hud-top">
          <div class="chip zone-title"></div>
          <button class="icon-btn pause-btn" aria-label="השהיה">${ICONS.pause}</button>
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
          <button class="btn small ghost" data-act="fullscreen">מסך מלא</button>
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

    const fsBtn = q('[data-act="fullscreen"]');
    if (!document.documentElement.requestFullscreen) fsBtn.remove();

    q('.pause-btn').addEventListener('click', (e) => {
      e.currentTarget.blur();
      game.togglePause();
    });
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
      else if (act === 'fullscreen') game.toggleFullscreen();
      this.refreshSettings();
    });
    this.refreshSettings();
  }

  refreshSettings() {
    const s = this.game.progress.data.settings;
    this.qualityBtn.textContent = 'גרפיקה: ' + QUALITY_NAMES[s.quality];
    this.soundBtn.textContent = 'צלילים: ' + (s.sound ? 'פועלים' : 'כבויים');
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
    if (on) this.refreshSettings();
  }

  showHelp(on) {
    if (on) {
      this.helpEl.querySelector('.help-keys').innerHTML = this.game.touch.enabled ? HELP_TOUCH : HELP_KEYS;
      this.pauseEl.classList.add('hidden');
    }
    this.helpEl.classList.toggle('hidden', !on);
    this.game.setModal(on ? 'help' : null);
  }
}
