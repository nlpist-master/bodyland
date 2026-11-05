import { openShop, GOODS } from '../minigames/Shop.js';
import { use, missing, take, flag, board } from './helpers.js';

// City of Life: buy groceries with the coins you collected, put them in
// the fridge at home, cook, pack the bag, plan the school day, and race the
// playground obstacle course.

const GROCERIES = [['bread', 1], ['cheese', 1], ['tomato', 1]];
const PRICES = Object.fromEntries(GOODS);
const COURSE = [[-13.5, 1.3, 11.5], [-23, 3.3, 11], [-21.5, 1.3, 17.2], [-26.5, 1.3, 12], [-17.5, 1.3, 20.5], [-12.5, 1.3, 15.5]];

export function setup(ctx) {
  const { game } = ctx;

  ctx.pickups.addCoins(ctx, 'life', [
    [0, 0, -22], [-10, 0, -16], [10, 0, -16], [-20, 0, -16], [20, 0, -16],
    [0, 0, -6], [0, 0, 8], [-23, 2, 11], [-20, 0, 14], [0, 0, 27],
    [12, 0, -2.5], [-11.5, 0, -2],
  ]);

  use(ctx, {
    x: 17.2, z: -6.4, radius: 2.2,
    label: 'לקנות במכולת',
    onUse: () => {
      // Whoever spent everything can still finish the mission: a friend helps out.
      const cost = GROCERIES.reduce((sum, [id]) => sum + (game.inventory.count(id) ? 0 : PRICES[id]), 0);
      if (game.quests.step('shopping')?.type === 'collect' && game.inventory.coins < cost) {
        game.inventory.addCoins(cost - game.inventory.coins);
        game.ui.toast('קיבוצי השלים לכם מטבעות למצרכים. חברים עוזרים!', 'good');
      }
      openShop(game);
    },
  });

  use(ctx, {
    x: -17.9, z: -0.8, radius: 2,
    label: 'לסדר מצרכים במקרר',
    when: () => !flag(ctx, 'lFridge'),
    onUse: () => {
      const miss = missing(game, GROCERIES);
      if (miss) {
        game.audio.play('fail');
        game.ui.toast('עוד חסר: ' + miss + '. אפשר לקנות במכולת.');
        return;
      }
      take(game, GROCERIES);
      game.audio.play('build');
      game.progress.setFlag('lFridge');
      game.ui.toast('המקרר מלא! עכשיו יש ממה להכין ארוחה.', 'good');
    },
  });

  board(ctx, { x: -15.2, z: -0.9, radius: 2, label: 'להכין ארוחה', quest: 'meal', name: 'meal', flagName: 'lMeal' });
  board(ctx, { x: -14, z: -4.5, radius: 2.4, label: 'לארוז את התיק', quest: 'bag', name: 'bag', flagName: 'lBag' });
  board(ctx, { x: 0, z: 28.6, radius: 2.4, label: 'לתכנן את היום על הלוח', quest: 'schoolDay', name: 'day', flagName: 'lDay' });

  const pad = game.challenge.pad(ctx, {
    x: -9.6, z: 14, label: 'להתחיל: מסלול גן המשחקים',
    start: () => game.challenge.rings(ctx, {
      title: 'מסלול גן המשחקים', rings: COURSE, seconds: 40,
      onWin: () => {
        game.audio.play('secret');
        game.player.celebrate(2);
        game.ui.toast('סיימתם את המסלול! אלופים!', 'good');
        game.progress.setFlag('lRace');
      },
    }),
  });

  return { update: (dt, t) => pad.update(t) };
}
