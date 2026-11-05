import { use, board, station, flag } from './helpers.js';
import { openWorkshop } from '../minigames/Workshop.js';
import { openEnding } from '../ui/Story.js';

// World center: coins around the heart fountain and on Mochi's balcony, the
// control board of the finale, and all the friends together once it is won.
export function setup(ctx) {
  const { game, npcs } = ctx;
  const coins = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    coins.push([Math.sin(a) * 5.4, 0, 4 + Math.cos(a) * 5.4]);
  }
  coins.push([-3.4, 3.6, 24.4], [3.4, 3.6, 24.4], [0, 3.6, 31.8], [-4.2, 3.6, 28.5]);
  ctx.pickups.addCoins(ctx, 'hub', coins);

  station(ctx, { x: 6, z: -8.6, color: 0xffb300, text: 'סדנת השדרוגים', bg: '#e08a00' });
  use(ctx, { x: 6, z: -7.8, radius: 2.2, label: 'להיכנס לסדנת השדרוגים', onUse: () => openWorkshop(game) });

  station(ctx, { x: 2.4, z: 20.8, color: 0x2fd6c3, text: 'לוח בקרה', bg: '#17a596', rotY: Math.PI });
  board(ctx, {
    x: 2.4, z: 20, radius: 2.2, label: 'להרכיב את תוכנית האיזון', quest: 'finale', name: 'finale', flagName: 'hFinale',
    onDone: () => {
      game.quests.update(1); // hand out the last reward before the ending
      openEnding(game, () => game.travel('hub', 'hub'));
    },
  });
  if (flag(ctx, 'hFinale')) {
    npcs.add(ctx, { id: 'shriron', x: -4.6, z: -3.4, rotY: 0.5, zone: 'hub' });
    npcs.add(ctx, { id: 'kibutzi', x: 6.4, z: -1, rotY: -1, zone: 'hub' });
    npcs.add(ctx, { id: 'tiptip', x: -7.2, z: -0.4, rotY: 1.2, zone: 'hub' });
  }
  return null;
}
