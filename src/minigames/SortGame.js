import { ITEMS, GROUPS } from '../data/items.js';
import { html } from '../ui/Panel.js';

// The sorting belt in the Building Factory: mark which building materials
// each food gives the body. A food can go in more than one bin!
// need: must be marked. ok: also fine if marked (true, but not the main point).
const FOODS = [
  { id: 'egg', need: ['protein'], ok: ['fats', 'iron'] },
  { id: 'yogurt', need: ['protein', 'calcium'], ok: [] },
  { id: 'lentils', need: ['protein', 'iron'], ok: [] },
  { id: 'nuts', need: ['fats'], ok: ['protein', 'iron', 'calcium'] },
  { id: 'cheese', need: ['calcium', 'protein'], ok: ['fats'] },
  { id: 'fish', need: ['protein'], ok: ['fats', 'iron'] },
];
const BINS = ['protein', 'calcium', 'iron', 'fats'];

export function sortGame(game) {
  return new Promise((resolve) => {
    let solved = false;
    game.panel.open({
      title: 'פס המיון של שרירון',
      kind: 'sort',
      onClose: () => resolve(solved),
      render(body, close) {
        body.appendChild(html('<p class="intro">סמנו לכל מזון את חומרי הבנייה שהוא נותן לגוף. שימו לב: מזון יכול להתאים ליותר מקבוצה אחת!</p>'));
        const marks = FOODS.map(() => new Set());
        const table = html('<div class="sort"></div>');
        const rows = FOODS.map((f, i) => {
          const def = ITEMS[f.id];
          const row = html(`<div class="sort-row"><div class="sort-food"><span class="ico">${def.icon}</span>${def.name}</div><div class="sort-bins"></div><div class="sort-hint"></div></div>`);
          const bins = row.querySelector('.sort-bins');
          for (const b of BINS) {
            const btn = html(`<button class="bin g-${b}">${GROUPS[b]}</button>`);
            btn.addEventListener('click', () => {
              if (solved) return;
              game.audio.play('click');
              marks[i].has(b) ? marks[i].delete(b) : marks[i].add(b);
              btn.classList.toggle('on', marks[i].has(b));
              row.classList.remove('right', 'wrong');
            });
            bins.appendChild(btn);
          }
          table.appendChild(row);
          return row;
        });
        const msg = html('<p class="msg hidden"></p>');
        const actions = html('<div class="row"><button class="btn big go">בדיקה</button></div>');
        body.append(table, msg, actions);
        const go = actions.querySelector('.go');
        go.addEventListener('click', () => {
          if (solved) return close();
          let right = 0;
          FOODS.forEach((f, i) => {
            const m = marks[i];
            const missing = f.need.filter((g) => !m.has(g));
            const extra = [...m].filter((g) => !f.need.includes(g) && !f.ok.includes(g));
            const ok = !missing.length && !extra.length;
            rows[i].classList.toggle('right', ok);
            rows[i].classList.toggle('wrong', !ok);
            rows[i].querySelector('.sort-hint').textContent = ok ? '✔'
              : missing.length ? 'חסר: ' + missing.map((g) => GROUPS[g]).join(', ')
                : 'זה לא העיקר כאן: ' + extra.map((g) => GROUPS[g]).join(', ');
            if (ok) right++;
          });
          msg.classList.remove('hidden', 'good', 'bad');
          if (right === FOODS.length) {
            solved = true;
            msg.classList.add('good');
            msg.textContent = 'מושלם! ראיתם? יוגורט נותן גם חלבון וגם סידן, ועדשים גם חלבון וגם ברזל. אין מזון אחד שעושה הכל, ולכן כדאי לגוון.';
            game.audio.play('machine');
            go.textContent = 'סיום';
          } else {
            msg.classList.add('bad');
            msg.textContent = `${right} מתוך ${FOODS.length} נכונים. תקנו את השורות האדומות ונסו שוב.`;
            game.audio.play('fail');
          }
        });
      },
    });
  });
}
