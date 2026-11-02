import { ITEMS, COLOR_NAMES } from '../data/items.js';
import { machineFeed } from '../minigames/MachineFeed.js';
import { use, foods, flag } from './helpers.js';

// Jungle of Colors: each garden gate opens with two foods of its color.
// Then feed the fiber station three DIFFERENT fiber foods: variety!

const GATES = [
  { color: 'red', flag: 'jGateRed', x: 14 },
  { color: 'yellow', flag: 'jGateYellow', x: 20 },
  { color: 'purple', flag: 'jGatePurple', x: 26 },
];
const GATE_NAME = { red: 'האדום', yellow: 'הצהוב', purple: 'הסגול' };

function fiberCheck(ids) {
  if (ids.includes('candy')) {
    return { ok: false, msg: 'בסוכרייה כמעט אין סיבים. התחנה צריכה פירות, ירקות או דגנים מלאים.' };
  }
  const bad = ids.find((id) => !ITEMS[id].groups.includes('fiber'));
  if (bad) {
    const d = ITEMS[bad];
    return { ok: false, msg: `${d.icon} ${d.name}: מזון חשוב לגוף, אבל אין בו הרבה סיבים. התחנה צריכה פירות, ירקות או דגנים מלאים.` };
  }
  if (new Set(ids).size < ids.length) {
    return { ok: false, msg: 'כמעט! התחנה רוצה שלושה מזונות שונים. גיוון נותן לגוף הרבה סוגים של דברים טובים.' };
  }
  return { ok: true, msg: 'התחנה מסתובבת! סיבים מפירות, ירקות ודגנים מלאים עוזרים למערכת העיכול לעבוד טוב.' };
}

export function setup(ctx, zone) {
  const { game } = ctx;

  ctx.pickups.addCoins(ctx, 'jungle', [
    [0, 0, -22], [0, 0, -16], [0, 0, -10], [0, 0.1, 0], [2, 0, 6],
    [-13, 0.1, -0.6], [-13.2, 0.1, 2.6], [3.8, 4.75, 21.4], [2.2, 4.75, 22.6],
    [-28, 0, 10], [-28, 0, 12.2], [14, 0.12, 0],
  ]);
  foods(ctx, [
    ['apple', -7, 0, -15.5], ['strawberry', 17, 0, -12.5], ['tomato', -16, 0, -15], ['apple', 5, 0, 12.5],
    ['banana', 6, 0, -6.5], ['corn', -4, 0, 7.5], ['banana', 12, 0, 12],
    ['grapes', 22, 0, -19], ['eggplant', -22.5, 0, -4.5], ['grapes', -8, 0, 14],
    ['carrot', -5, 0, -9.6], ['orange', 13, 0, 8.5], ['broccoli', -12, 0, 24.5], ['pear', -18, 0, -6.5],
    ['orange', 16.5, 0, 25.5], ['pear', 24, 0, 25.5], ['broccoli', 20, 0, 30],
    ['candy', -20, 0, 6],
  ]);

  // ---- Color gates ----
  const open = (i, instant) => {
    const { door, symbol } = zone.doors[i];
    ctx.collision.remove(door.collider);
    if (instant) {
      door.mesh.position.y = -1.3;
      symbol.visible = false;
      return;
    }
    symbol.visible = false;
    game.audio.play('gate');
    ctx.tween(1.2, (k) => (door.mesh.position.y = 1.3 - k * 2.6));
  };
  GATES.forEach((gate, i) => {
    if (flag(ctx, gate.flag)) open(i, true);
    use(ctx, {
      x: gate.x, z: 16.8, radius: 1.9,
      label: `לפתוח את השער ${GATE_NAME[gate.color]}`,
      when: () => !flag(ctx, gate.flag),
      onUse: () => {
        const have = game.inventory.list().filter((x) => x.def.color === gate.color);
        const count = have.reduce((s, x) => s + x.count, 0);
        if (count < 2) {
          game.audio.play('fail');
          game.ui.toast(`השער ${GATE_NAME[gate.color]} רוצה שני פירות או ירקות בצבע ${COLOR_NAMES[gate.color]}. יש לכם ${count}.`);
          return;
        }
        let left = 2;
        for (const x of have) {
          const n = Math.min(left, x.count);
          game.inventory.remove(x.id, n);
          left -= n;
          if (!left) break;
        }
        open(i, false);
        game.progress.setFlag(gate.flag);
        const opened = GATES.filter((g) => flag(ctx, g.flag)).length;
        game.ui.toast(opened === 3 ? 'כל שערי הצבעים פתוחים!' : `השער ${GATE_NAME[gate.color]} נפתח!`, 'good');
      },
    });
  });

  // ---- Fiber station ----
  use(ctx, {
    x: -14.2, z: 22, radius: 2.4,
    label: 'להזין את תחנת הסיבים',
    when: () => !flag(ctx, 'jFiber'),
    onUse: async () => {
      const ok = await machineFeed(game, {
        title: 'תחנת הסיבים',
        intro: 'הכניסו לתחנה שלושה מזונות שונים שיש בהם סיבים תזונתיים.',
        check: fiberCheck,
      });
      if (ok) {
        game.progress.setFlag('jFiber');
        game.audio.play('secret');
        game.ui.toast('תחנת הסיבים עובדת שוב!', 'good');
      }
    },
  });

  let spin = 0;
  return {
    update(dt) {
      // The zone keeps the wheel "stuck"; once fixed it turns for real.
      if (!flag(ctx, 'jFiber')) return;
      spin += dt * 2.5;
      zone.wheel.rotation.z = spin;
    },
  };
}
