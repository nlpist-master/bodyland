import * as P from '../Props.js';
import { cellTexture } from '../Materials.js';

// Small stage with three podiums for the character select screen.
export function build(ctx) {
  ctx.setEnv(P.environment(ctx, {
    skyTop: '#5b36a8', skyBottom: '#ffb8d6', fogNear: 18, fogFar: 60,
    hemiSky: 0xffffff, hemiGround: 0xc9a0ff, sun: 2.2,
  }));
  const tex = cellTexture('#c7a8ff', '#ad88ff', 11);
  P.floor(ctx, { x0: -25, x1: 25, z0: -25, z1: 25, texture: tex, tile: 4 });
  tex.dispose();

  const slots = [1.9, 0, -1.9].map((x, i) => {
    P.cylinder(ctx, { x, z: 0, r: 0.75, h: 0.3, color: [0xff9cc8, 0x5ed6cc, 0x8fb4ff][i], collide: false });
    return { x, y: 0.3, z: 0 };
  });
  const cells = P.floatingCells(ctx, { count: 20, radiusMin: 14, radiusMax: 26, yMin: 5, yMax: 12 });

  return {
    slots,
    update: (dt, t) => cells.update(t),
  };
}
