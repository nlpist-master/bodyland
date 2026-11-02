import { openShop } from '../minigames/Shop.js';
import { use, missing, take, flag } from './helpers.js';

// City of Life: buy groceries with the coins you collected, put them in
// the fridge at home, and race the playground obstacle course.

const GROCERIES = [['bread', 1], ['cheese', 1], ['tomato', 1]];
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
    onUse: () => openShop(game),
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
