import { ITEMS, GROUPS } from '../data/items.js';
import { QUESTS, QUEST_ORDER } from '../data/quests.js';
import { ZONE_INFO, ZONE_ORDER } from '../data/zones.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { NPC_INFO } from '../data/npcs.js';
import { html } from './Panel.js';
import { ICONS } from './icons.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const zoneColor = (id) => '#' + ZONE_INFO[id].color.toString(16).padStart(6, '0');

/** A card with a picture: the same look for achievements and missions. */
function tile({ icon, title, lines = [], cls = '', color = '' }) {
  const style = color ? ` style="--c:${color}"` : '';
  const small = lines.map((l) => `<small>${esc(l)}</small>`).join('');
  return `<div class="tile ${cls}"${style}><span class="ico">${icon}</span><b>${esc(title)}</b>${small}</div>`;
}

const QUALITY_NAMES = { auto: 'אוטומטי', high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };

/** The labels of the settings buttons. */
export function settingText(s) {
  return {
    quality: 'גרפיקה: ' + QUALITY_NAMES[s.quality],
    sound: 'צלילים: ' + (s.sound ? 'פועלים' : 'כבויים'),
    steer: 'שליטה: ' + (s.steer === 'free' ? 'חופשית' : 'כמו רכב'),
  };
}

/** inGame: opened from the pause menu, where a player can't be renamed or erased. */
export function openSettings(game, { inGame = false, onClose } = {}) {
  game.panel.open({
    title: 'הגדרות',
    kind: 'settings',
    onClose,
    render(body, close) {
      const add = (kind, icon, onClick) => {
        const b = html(`<button class="btn ${kind} set-btn">${ICONS[icon]}<span></span></button>`);
        b.addEventListener('click', () => {
          game.audio.play('click');
          onClick(b);
        });
        body.appendChild(b);
        return b;
      };
      const rows = [
        ['sound', 'sound', () => game.toggleSound()],
        ['steer', 'wheel', () => game.toggleSteer()],
        ['quality', 'picture', () => game.cycleQuality()],
      ];
      for (const [key, icon, change] of rows) {
        const draw = (b) => { b.lastChild.textContent = settingText(game.progress.data.settings)[key]; };
        draw(add('alt', icon, (b) => {
          change();
          draw(b);
        }));
      }
      if (document.documentElement.requestFullscreen) {
        add('alt', 'fullscreen', () => game.toggleFullscreen()).lastChild.textContent = 'מסך מלא';
      }
      if (!inGame) {
        add('ghost', 'pencil', () => game.askNewName()).lastChild.textContent = 'שינוי שם';
        add('ghost danger', 'trash', (b) => {
          // Ask twice so nobody erases a player by accident.
          if (b.classList.contains('confirm')) return game.deletePlayer();
          b.classList.add('confirm');
          b.lastChild.textContent = `בטוחים? השחקן ${game.progress.data.name} יימחק עם כל ההתקדמות. לחצו שוב`;
        }).lastChild.textContent = 'מחיקת שחקן';
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
      const earned = (a) => (achievements.has(a.id) ? 1 : 0);
      const grid = [...ACHIEVEMENTS].sort((a, b) => earned(b) - earned(a)).map((a) => tile({
        icon: a.icon,
        title: a.title,
        lines: [a.text, a.zone ? ZONE_INFO[a.zone].short : 'כל העולם'],
        cls: earned(a) ? 'got' : 'off',
        color: a.zone ? zoneColor(a.zone) : '',
      })).join('');
      body.appendChild(html(`<div class="tiles">${grid}</div>`));
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

const WORLDS = ['hub', ...ZONE_ORDER];
const KIND_RANK = { main: 0, side: 1, challenge: 2 };
const KIND_NAME = { main: 'ראשית', side: 'בונוס', challenge: 'אתגר זמן' };

/** A running mission, with all its steps. */
function runningTile(game, id) {
  const { quests } = game;
  const q = QUESTS[id];
  const cur = quests.state[id].step;
  const steps = q.steps.map((st, i) => {
    const { n, m } = i === cur ? quests.progress(st) : { n: 0, m: 1 };
    const cls = i < cur ? 'done' : i === cur ? 'now' : 'later';
    return `<li class="${cls}">${i < cur ? '✔' : i === cur ? '➜' : '○'} ${esc(st.text)}${i === cur && m > 1 ? ` <small>(${n}/${m})</small>` : ''}</li>`;
  }).join('');
  return `<div class="tile running k-${q.kind}"><span class="ico">${q.icon}</span><b>${esc(q.title)}</b>
    <small>${KIND_NAME[q.kind]} · בביצוע</small><ul>${steps}</ul></div>`;
}

function missionTile(game, id) {
  const { quests } = game;
  const q = QUESTS[id];
  if (quests.status(id) === 'active') return runningTile(game, id);
  const kind = `k-${q.kind}`;
  const base = { icon: q.icon, title: q.title };
  if (quests.isDone(id)) return tile({ ...base, lines: [KIND_NAME[q.kind], '✔ הושלם'], cls: `got ${kind}` });
  if (quests.canStart(id)) return tile({ ...base, lines: [KIND_NAME[q.kind], 'דברו עם ' + NPC_INFO[q.giver].name], cls: `ready ${kind}` });
  return tile({ ...base, lines: [KIND_NAME[q.kind], '🔒 עוד מעט'], cls: `off ${kind}` });
}

/** The top of the missions screen: what to do next. */
function nowCard(game, id) {
  const { quests } = game;
  if (quests.isDoneAll) return '<p class="empty">כל המשימות הושלמו! איזה יופי!</p>';
  if (!id) return '<p class="empty">דברו עם החברים בעולם כדי לקבל משימה חדשה!</p>';
  const q = QUESTS[id];
  const st = quests.step(id);
  const { n, m } = quests.progress(st);
  return `<div class="now-card"><span class="ico">${q.icon}</span><div>
    <span class="tag">עכשיו</span><b>${esc(q.title)}</b>
    <small>השלב הבא: ${esc(st.text)}${m > 1 ? ` (${n}/${m})` : ''}</small></div></div>`;
}

/** Missions by world: what to do now on top, one world open at a time. */
export function openQuests(game) {
  game.panel.open({
    title: 'המשימות שלי',
    kind: 'quests',
    render(body) {
      const { quests } = game;
      const here = game.world.id;
      const tracked = quests.tracked(here);
      const doneCount = QUEST_ORDER.filter((id) => quests.isDone(id)).length;
      body.appendChild(html(`<div class="wallet"><span>🏁 ${doneCount} מתוך ${QUEST_ORDER.length} הושלמו</span></div>`));
      body.appendChild(html(nowCard(game, tracked)));

      let open = WORLDS.includes(here) ? here : tracked ? QUESTS[tracked].zone : 'hub';
      const list = html('<div class="worlds"></div>');
      const draw = () => {
        list.innerHTML = '';
        for (const zone of WORLDS) {
          const ids = QUEST_ORDER.filter((id) => QUESTS[id].zone === zone)
            .sort((a, b) => KIND_RANK[QUESTS[a].kind] - KIND_RANK[QUESTS[b].kind]);
          const done = ids.filter((id) => quests.isDone(id)).length;
          const isOpen = zone === open;
          const row = html(`<button class="world-row${isOpen ? ' open' : ''}" style="--c:${zoneColor(zone)}" aria-expanded="${isOpen}">
            <span class="arrow">▾</span><b>${esc(ZONE_INFO[zone].short)}</b>
            <span class="count">${done === ids.length ? '✔ ' : ''}${done} מתוך ${ids.length}</span></button>`);
          row.addEventListener('click', () => {
            game.audio.play('click');
            open = isOpen ? null : zone;
            draw();
          });
          list.appendChild(row);
          if (isOpen) list.appendChild(html(`<div class="tiles">${ids.map((id) => missionTile(game, id)).join('')}</div>`));
        }
      };
      draw();
      body.appendChild(list);
      if (!game.touch.enabled) body.appendChild(html('<p class="note">J – פתיחה וסגירה של המשימות</p>'));
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
        return `<div class="zone-card${here === id ? ' here' : ''}" style="--c:${zoneColor(id)}">
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
