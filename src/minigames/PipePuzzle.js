import { html } from '../ui/Panel.js';

// Turn the pipe pieces until water can flow from the tank (left) to the
// house (right). Tap a piece to rotate it a quarter turn.
const N = 1, E = 2, S = 4, W = 8;
const BASE = { I: N | S, L: N | E, T: N | E | S };
const rot = (m, r) => {
  for (let i = 0; i < r; i++) m = ((m << 1) | (m >> 3)) & 15;
  return m;
};
const OPP = { [N]: S, [S]: N, [E]: W, [W]: E };
const STEP = { [N]: [-1, 0], [S]: [1, 0], [E]: [0, 1], [W]: [0, -1] };

// Solution path: enter (1,0) from the west, leave (2,3) to the east.
// [type, rotation that solves it]
const SOLUTION = [
  [['L', 1], ['I', 1], ['T', 2], ['L', 0]],
  [['I', 1], ['L', 2], ['L', 3], ['I', 0]],
  [['T', 0], ['L', 0], ['I', 1], ['I', 1]],
  [['L', 3], ['I', 0], ['T', 1], ['L', 2]],
];
const IN = [1, 0], OUT = [2, 3];

function flow(tiles) {
  const wet = new Set();
  const stack = [[IN[0], IN[1], W]];
  let reached = false;
  while (stack.length) {
    const [r, c, from] = stack.pop();
    if (r < 0 || r > 3 || c < 0 || c > 3) continue;
    const t = tiles[r][c];
    const m = rot(BASE[t.type], t.r);
    if (!(m & from)) continue;
    const key = r * 4 + c;
    if (wet.has(key)) continue;
    wet.add(key);
    if (r === OUT[0] && c === OUT[1] && m & E) reached = true;
    for (const d of [N, E, S, W]) {
      if (!(m & d)) continue;
      const [dr, dc] = STEP[d];
      stack.push([r + dr, c + dc, OPP[d]]);
    }
  }
  return { wet, reached };
}

function pathSVG(mask, wet) {
  const color = wet ? '#4fc3f7' : '#b9a9d9';
  const arm = { [N]: 'M50 50 L50 0', [E]: 'M50 50 L100 50', [S]: 'M50 50 L50 100', [W]: 'M50 50 L0 50' };
  const d = [N, E, S, W].filter((x) => mask & x).map((x) => arm[x]).join(' ');
  return `<svg viewBox="0 0 100 100"><path d="${d}" stroke="#5d4a8a" stroke-width="34" stroke-linecap="round"/><path d="${d}" stroke="${color}" stroke-width="20" stroke-linecap="round"/></svg>`;
}

export function pipePuzzle(game) {
  return new Promise((resolve) => {
    let solved = false;
    game.panel.open({
      title: 'לתקן את הצינור',
      kind: 'pipes',
      onClose: () => resolve(solved),
      render(body, close) {
        body.appendChild(html('<p class="intro">סובבו את חלקי הצינור (לחיצה על חלק) עד שהמים יזרמו מהמכל אל הצד השני.</p>'));
        const tiles = SOLUTION.map((row) => row.map(([type, r]) => ({ type, r: (r + 1 + Math.floor(Math.random() * 3)) % 4 })));
        const wrap = html('<div class="pipes-wrap" dir="ltr"><div class="tank">💧</div><div class="pipes"></div><div class="tank end">🏠</div></div>');
        const grid = wrap.querySelector('.pipes');
        const msg = html('<p class="msg hidden"></p>');
        const actions = html('<div class="row"><button class="btn big go hidden">המים זורמים!</button></div>');
        body.append(wrap, msg, actions);
        const draw = () => {
          const { wet, reached } = flow(tiles);
          grid.innerHTML = '';
          tiles.forEach((row, r) => row.forEach((t, c) => {
            const cell = html(`<button class="pipe">${pathSVG(rot(BASE[t.type], t.r), wet.has(r * 4 + c))}</button>`);
            cell.addEventListener('click', () => {
              if (solved) return;
              t.r = (t.r + 1) % 4;
              game.audio.play('click');
              draw();
            });
            grid.appendChild(cell);
          }));
          if (reached && !solved) {
            solved = true;
            game.audio.play('machine');
            msg.classList.remove('hidden');
            msg.classList.add('good');
            msg.textContent = 'כל הכבוד! המים זורמים שוב בצינור.';
            actions.querySelector('.go').classList.remove('hidden');
          }
        };
        actions.querySelector('.go').addEventListener('click', () => close());
        draw();
      },
    });
  });
}
