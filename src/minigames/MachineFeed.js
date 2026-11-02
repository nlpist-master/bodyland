import { ITEMS } from '../data/items.js';
import { html } from '../ui/Panel.js';

/**
 * Put items from the backpack into a machine's slots and press start.
 * check(ids) -> { ok, msg, consume: [ids eaten even on failure] }
 * Resolves true when the machine accepted the items.
 */
export function machineFeed(game, { title, intro, slots = 3, check }) {
  return new Promise((resolve) => {
    let solved = false;
    game.panel.open({
      title,
      kind: 'machine',
      onClose: () => resolve(solved),
      render(body, close) {
        const inv = game.inventory;
        const put = new Array(slots).fill(null);
        body.appendChild(html(`<p class="intro">${intro}</p>`));
        const slotRow = html('<div class="slots"></div>');
        const msg = html('<p class="msg hidden"></p>');
        const list = html('<div class="item-grid small"></div>');
        const actions = html('<div class="row"><button class="btn big go">הפעלה!</button></div>');
        body.append(slotRow, list, msg, actions);
        const go = actions.querySelector('.go');

        const left = (id) => inv.count(id) - put.filter((p) => p === id).length;
        const render = () => {
          slotRow.innerHTML = '';
          put.forEach((id, i) => {
            const s = html(`<button class="slot${id ? ' full' : ''}">${id ? ITEMS[id].icon : '+'}</button>`);
            s.addEventListener('click', () => {
              if (!id || solved) return;
              game.audio.play('click');
              put[i] = null;
              render();
            });
            slotRow.appendChild(s);
          });
          list.innerHTML = '';
          const foods = inv.list().filter((x) => x.def.kind === 'food');
          if (!foods.length) list.appendChild(html('<p class="empty">אין בתיק מזונות. צאו לאסוף!</p>'));
          for (const { id, def } of foods) {
            const n = left(id);
            const b = html(`<button class="item"${n ? '' : ' disabled'}><span class="ico">${def.icon}</span><span class="nm">${def.name}</span><span class="cnt">${n}</span></button>`);
            b.addEventListener('click', () => {
              const free = put.indexOf(null);
              if (free < 0 || !left(id) || solved) return;
              game.audio.play('click');
              put[free] = id;
              render();
            });
            list.appendChild(b);
          }
          go.disabled = put.includes(null) && !solved;
        };
        go.addEventListener('click', () => {
          if (solved) return close();
          const res = check(put.slice());
          msg.classList.remove('hidden', 'good', 'bad');
          msg.classList.add(res.ok ? 'good' : 'bad');
          msg.textContent = res.msg;
          if (res.ok) {
            solved = true;
            for (const id of put) inv.remove(id);
            game.audio.play('machine');
            go.textContent = 'יופי!';
            go.disabled = false;
          } else {
            game.audio.play('fail');
            for (const id of res.consume || []) {
              const i = put.indexOf(id);
              if (i >= 0) {
                inv.remove(id);
                put[i] = null;
              }
            }
          }
          render();
        });
        render();
      },
    });
  });
}
