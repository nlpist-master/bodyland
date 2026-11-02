import { Game } from './Game.js';

// Entry point, called by boot.js once every file is downloaded.
export async function start(boot) {
  boot.progress(0.1, 'מכין את הגופנים...');
  try {
    await Promise.all(['700 40px Rubik', '400 20px Rubik'].flatMap((f) => [
      document.fonts.load(f, 'אבג'),
      document.fonts.load(f, 'ABC'),
    ]));
  } catch {
    // Signs fall back to a system font; the game still works.
  }
  const game = new Game();
  await game.init(boot);
  boot.progress(1, '');
  return game;
}
