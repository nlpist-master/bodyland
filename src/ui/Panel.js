// One reusable window for the backpack, missions, map and the mini-games.
// While it is open the game is paused (modal 'panel').
export class Panel {
  constructor(game) {
    this.game = game;
    this.onClose = null;
    this.closable = true;
    const el = (this.el = document.createElement('div'));
    el.className = 'modal sheet hidden';
    el.innerHTML = `
      <div class="panel wide">
        <div class="sheet-head"><h2></h2><button class="icon-btn close-btn" aria-label="סגירה">✕</button></div>
        <div class="sheet-body"></div>
      </div>`;
    document.getElementById('ui').appendChild(el);
    this.title = el.querySelector('h2');
    this.body = el.querySelector('.sheet-body');
    this.closeBtn = el.querySelector('.close-btn');
    this.closeBtn.addEventListener('click', () => {
      game.audio.play('click');
      if (this.closable) this.close();
    });
  }

  get isOpen() {
    return !this.el.classList.contains('hidden');
  }

  /** render(body, close) fills the window. onClose(result) runs when it closes. */
  open({ title, render, onClose, closable = true, kind = '' }) {
    if (this.isOpen) this.close();
    this.game.setModal('panel');
    this.game.ui.showPrompt(null);
    this.kind = kind;
    this.onClose = onClose || null;
    this.closable = closable;
    this.closeBtn.classList.toggle('hidden', !closable);
    this.title.textContent = title;
    this.body.innerHTML = '';
    this.el.classList.remove('hidden');
    render(this.body, (result) => this.close(result));
  }

  close(result) {
    if (!this.isOpen) return;
    this.el.classList.add('hidden');
    this.body.innerHTML = '';
    this.game.setModal(null);
    const fn = this.onClose;
    this.onClose = null;
    fn?.(result);
  }
}

/** Small helper: element from an HTML string. */
export function html(str) {
  const t = document.createElement('template');
  t.innerHTML = str.trim();
  return t.content.firstElementChild;
}
