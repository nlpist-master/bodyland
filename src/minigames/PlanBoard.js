import { html } from '../ui/Panel.js';

// A thinking challenge from data/boards.js: choose something in every row,
// press check, and get a hint until the plan works. Trying again is free.
export function planBoard(game, board) {
  return new Promise((resolve) => {
    let solved = false;
    game.panel.open({
      title: board.title,
      kind: 'plan',
      onClose: () => resolve(solved),
      render(body, close) {
        body.appendChild(html(`<p class="intro">${board.intro}</p>`));
        const picks = board.rows.map(() => []);
        const list = html(`<div class="plan${board.compact ? ' compact' : ''}"></div>`);
        board.rows.forEach((row, r) => {
          const max = row.max || 1;
          const el = html(`<div class="plan-row"><div class="plan-title">${row.label ? `<span class="plan-time">${row.label}</span>` : ''}<b>${row.title}</b>${max > 1 ? '<small></small>' : ''}</div><div class="plan-opts"></div></div>`);
          const count = el.querySelector('small');
          const opts = el.querySelector('.plan-opts');
          const refresh = () => {
            opts.querySelectorAll('.opt').forEach((b, i) => b.classList.toggle('on', picks[r].includes(row.options[i])));
            if (count) count.textContent = `${picks[r].length}/${max}`;
          };
          for (const o of row.options) {
            const b = html(`<button class="opt${o.icon ? '' : ' text'}">${o.icon ? `<span class="ico">${o.icon}</span>` : ''}<span class="nm">${o.name}</span></button>`);
            b.addEventListener('click', () => {
              if (solved) return;
              game.audio.play('click');
              const at = picks[r].indexOf(o);
              if (at >= 0) picks[r].splice(at, 1);
              else if (max === 1) picks[r] = [o];
              else if (picks[r].length < max) picks[r].push(o);
              refresh();
            });
            opts.appendChild(b);
          }
          list.appendChild(el);
          refresh();
        });
        const msg = html('<p class="msg hidden"></p>');
        const actions = html('<div class="row"><button class="btn big go">בדיקה</button></div>');
        body.append(list, msg, actions);
        const go = actions.querySelector('.go');
        const show = (text, good) => {
          msg.textContent = text;
          msg.classList.remove('hidden', 'good', 'bad');
          msg.classList.add(good ? 'good' : 'bad');
        };
        go.addEventListener('click', () => {
          if (solved) return close();
          const empty = board.rows.findIndex((row, r) => picks[r].length < (row.min || 1));
          const hint = empty >= 0 ? 'עוד לא סיימתם לבחור: ' + board.rows[empty].title : board.check(picks);
          if (hint) {
            show(hint, false);
            game.audio.play('fail');
            return;
          }
          solved = true;
          show(board.win, true);
          game.audio.play('machine');
          go.textContent = 'סיום';
        });
      },
    });
  });
}
