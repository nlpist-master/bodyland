import { html } from '../ui/Panel.js';

// Pipetin's workshop in the hub: spend coins on upgrades that stay forever.
export const UPGRADES = [
  { id: 'boots', icon: '👟', name: 'נעלי מהירות', info: 'הולכים ורצים קצת יותר מהר', price: 30 },
  { id: 'spring', icon: '🦘', name: 'קפיץ בנעל', info: 'קופצים קצת יותר גבוה', price: 40 },
  { id: 'magnet', icon: '🧲', name: 'מגנט מטבעות', info: 'מטבעות נאספים גם מרחוק', price: 30 },
];

export function openWorkshop(game) {
  game.panel.open({
    title: 'סדנת השדרוגים',
    kind: 'workshop',
    render(body, close) {
      const { inventory, progress, audio, effects, player } = game;
      const wallet = html('<div class="wallet"></div>');
      const grid = html('<div class="shop-grid"></div>');
      const actions = html('<div class="row"><button class="btn big">סיימתי</button></div>');
      body.append(html('<p class="intro">פיפטין בנה המצאות! כל שדרוג נשאר איתכם לתמיד.</p>'), wallet, grid, actions);
      actions.querySelector('button').addEventListener('click', () => close());
      const draw = () => {
        wallet.innerHTML = `<span>🪙 ${inventory.coins} מטבעות</span>`;
        grid.innerHTML = '';
        for (const u of UPGRADES) {
          const own = progress.data.upgrades[u.id];
          const b = html(`<button class="ware"${own || inventory.coins < u.price ? ' disabled' : ''}>
            <span class="ico">${u.icon}</span><b>${u.name}</b><small>${u.info}</small>
            <span class="price">${own ? '✔ שלכם' : '🪙 ' + u.price}</span></button>`);
          b.addEventListener('click', () => {
            if (own || !inventory.spendCoins(u.price)) return;
            progress.data.upgrades[u.id] = true;
            progress.save();
            audio.play('success');
            effects.burst(player.pos.x, player.pos.y + 1, player.pos.z, { color: 'teal', n: 12 });
            draw();
          });
          grid.appendChild(b);
        }
      };
      draw();
    },
  });
}
