import { ITEMS } from '../data/items.js';
import { html } from '../ui/Panel.js';

// The grocery shop in the City of Life: spend coins on food.
export const GOODS = [
  ['bread', 3], ['cheese', 4], ['tomato', 2], ['egg', 3], ['yogurt', 3], ['lentils', 3],
  ['rice', 3], ['pasta', 3], ['carrot', 2], ['apple', 2], ['banana', 2], ['nuts', 4],
];

export function openShop(game) {
  return new Promise((resolve) => {
    game.panel.open({
      title: 'המכולת',
      kind: 'shop',
      onClose: () => resolve(),
      render(body, close) {
        const inv = game.inventory;
        const wallet = html('<div class="wallet"></div>');
        const grid = html('<div class="shop-grid"></div>');
        const actions = html('<div class="row"><button class="btn big">סיימתי לקנות</button></div>');
        body.append(html('<p class="intro">מה תרצו לקנות? לוחצים על מוצר כדי לקנות אותו במטבעות.</p>'), wallet, grid, actions);
        actions.querySelector('button').addEventListener('click', () => close());
        const draw = () => {
          wallet.innerHTML = `<span>🪙 ${inv.coins} מטבעות</span>`;
          grid.innerHTML = '';
          for (const [id, price] of GOODS) {
            const def = ITEMS[id];
            const have = inv.count(id);
            const b = html(`<button class="ware"${inv.coins < price ? ' disabled' : ''}>
              <span class="ico">${def.icon}</span><b>${def.name}</b><span class="price">🪙 ${price}</span>
              ${have ? `<small>בתיק: ${have}</small>` : ''}</button>`);
            b.addEventListener('click', () => {
              if (!inv.spendCoins(price)) return;
              inv.add(id);
              game.audio.play('coin');
              draw();
            });
            grid.appendChild(b);
          }
        };
        draw();
      },
    });
  });
}
