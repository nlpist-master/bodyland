import { ITEMS, GROUPS } from '../data/items.js';
import { QUESTS, QUEST_ORDER } from '../data/quests.js';
import { ZONE_INFO, ZONE_ORDER } from '../data/zones.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { html } from './Panel.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const QUALITY_NAMES = { auto: 'אוטומטי', high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };

/** The labels of the settings buttons, here and in the pause menu. */
export function settingText(s) {
  return {
    quality: 'גרפיקה: ' + QUALITY_NAMES[s.quality],
    sound: 'צלילים: ' + (s.sound ? 'פועלים' : 'כבויים'),
    steer: 'שליטה: ' + (s.steer === 'free' ? 'חופשית' : 'כמו רכב'),
  };
}

export function openSettings(game) {
  game.panel.open({
    title: 'הגדרות',
    kind: 'settings',
    render(body, close) {
      const rows = { quality: () => game.cycleQuality(), sound: () => game.toggleSound(), steer: () => game.toggleSteer() };
      for (const key in rows) {
        const b = html('<button class="btn alt"></button>');
        const draw = () => { b.textContent = settingText(game.progress.data.settings)[key]; };
        b.addEventListener('click', () => {
          game.audio.play('click');
          rows[key]();
          draw();
        });
        draw();
        body.appendChild(b);
      }
      const done = html('<button class="btn big">סיימתי</button>');
      done.addEventListener('click', () => close());
      body.appendChild(done);
    },
  });
}

export function openAchievements(game, onClose) {
  game.panel.open({
    title: 'ההישגים שלי',
    kind: 'achievements',
    onClose,
    render(body) {
      const { achievements, inventory } = game;
      body.appendChild(html(`<div class="wallet"><span>🏅 ${achievements.count} מתוך ${ACHIEVEMENTS.length}</span><span>⭐ ${inventory.stars} כוכבים</span><span>🪙 ${inventory.coins} מטבעות</span></div>`));
      const grid = ACHIEVEMENTS.map((a) => `<div class="badge${achievements.has(a.id) ? ' on' : ''}"><span class="ico">${a.icon}</span><b>${esc(a.title)}</b><small>${esc(a.text)}</small></div>`).join('');
      body.appendChild(html(`<div class="badges">${grid}</div>`));
    },
  });
}

/** Backpack: everything collected, tap an item to learn what it does. */
export function openInventory(game) {
  game.panel.open({
    title: 'התיק שלי',
    kind: 'inventory',
    render(body) {
      const { inventory } = game;
      const items = inventory.list();
      body.appendChild(html(`<div class="wallet"><span>🪙 ${inventory.coins} מטבעות</span><span>⭐ ${inventory.stars} כוכבים</span></div>`));
      if (!items.length) {
        body.appendChild(html('<p class="empty">התיק עוד ריק. אספו דברים בעולם!</p>'));
        return;
      }
      const grid = html('<div class="item-grid"></div>');
      const info = html('<div class="item-info"><p class="empty">בחרו פריט כדי לראות מה הוא עושה.</p></div>');
      for (const { id, def, count } of items) {
        const b = html(`<button class="item"><span class="ico">${def.icon}</span><span class="nm">${esc(def.name)}</span>${count > 1 ? `<span class="cnt">${count}</span>` : ''}</button>`);
        b.addEventListener('click', () => {
          game.audio.play('click');
          grid.querySelectorAll('.item').forEach((x) => x.classList.remove('sel'));
          b.classList.add('sel');
          const chips = def.groups.map((g) => `<span class="chip-g g-${g}">${GROUPS[g]}</span>`).join('');
          info.innerHTML = `<div class="ii-head"><span class="ico big">${def.icon}</span><b>${esc(def.name)}</b></div>
            ${chips ? `<div class="chips">${chips}</div>` : ''}<p>${esc(def.info)}</p>`;
        });
        grid.appendChild(b);
      }
      body.append(grid, info);
    },
  });
}

/** Mission log: active missions with their steps, then finished ones. */
export function openQuests(game) {
  game.panel.open({
    title: 'המשימות שלי',
    kind: 'quests',
    render(body) {
      const { quests } = game;
      const active = QUEST_ORDER.filter((id) => quests.status(id) === 'active');
      const done = QUEST_ORDER.filter((id) => quests.isDone(id));
      if (!active.length && !done.length) {
        body.appendChild(html('<p class="empty">עוד אין משימות. דברו עם פרופסור פיפטין במרכז העולם!</p>'));
      }
      for (const id of active) {
        const q = QUESTS[id];
        const cur = quests.state[id].step;
        const steps = q.steps.map((st, i) => {
          const { n, m } = i === cur ? quests.progress(st) : { n: 0, m: 1 };
          const cls = i < cur ? 'done' : i === cur ? 'now' : 'later';
          return `<li class="${cls}">${i < cur ? '✔' : i === cur ? '➜' : '○'} ${esc(st.text)}${i === cur && m > 1 ? ` <small>(${n}/${m})</small>` : ''}</li>`;
        }).join('');
        body.appendChild(html(`<div class="quest q-${q.kind}">
          <div class="q-head"><b>${esc(q.title)}</b><span>${esc(ZONE_INFO[q.zone].short)}</span></div>
          <ul>${steps}</ul></div>`));
      }
      if (done.length) {
        body.appendChild(html(`<h3>הושלמו (${done.length})</h3>`));
        body.appendChild(html(`<div class="done-list">${done.map((id) => `<span>✔ ${esc(QUESTS[id].title)}</span>`).join('')}</div>`));
      }
      const hint = game.touch.enabled ? '' : '<p class="note">J – פתיחה וסגירה של המשימות</p>';
      if (hint) body.appendChild(html(hint));
    },
  });
}

/** World map: every zone with how much of it has been restored. */
export function openMap(game) {
  game.panel.open({
    title: 'מפת BIOVERSE',
    kind: 'map',
    render(body) {
      const { quests, progress } = game;
      const here = game.world.id;
      const cards = ZONE_ORDER.concat('arena').map((id) => {
        const info = ZONE_INFO[id];
        const visited = progress.data.visited[id];
        const r = Math.round(quests.restored(id) * 100);
        const color = '#' + info.color.toString(16).padStart(6, '0');
        return `<div class="zone-card${here === id ? ' here' : ''}" style="--c:${color}">
          <b>${esc(info.short)}</b>
          ${here === id ? '<span class="tag">אתם כאן</span>' : visited ? '' : '<span class="tag dim">עוד לא ביקרתם</span>'}
          ${id === 'arena' ? '<small>מקום להתאמן</small>' : `<div class="bar small"><i style="width:${r}%"></i></div><small>שיקום: ${r}%</small>`}
        </div>`;
      }).join('');
      const total = Math.round((QUEST_ORDER.filter((id) => quests.isDone(id)).length / QUEST_ORDER.length) * 100);
      body.appendChild(html(`<div class="map-hub${here === 'hub' ? ' here' : ''}"><b>מרכז העולם</b><small>כל השערים יוצאים מכאן · התקדמות כללית ${total}%</small></div>`));
      body.appendChild(html(`<div class="zone-grid">${cards}</div>`));
    },
  });
}
