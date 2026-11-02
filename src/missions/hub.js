// World center: coins around the heart fountain and on Mochi's balcony.
export function setup(ctx) {
  const coins = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    coins.push([Math.sin(a) * 5.4, 0, 4 + Math.cos(a) * 5.4]);
  }
  coins.push([-3.4, 3.6, 24.4], [3.4, 3.6, 24.4], [0, 3.6, 31.8], [-4.2, 3.6, 28.5]);
  ctx.pickups.addCoins(ctx, 'hub', coins);
  return null;
}
