// Performance overlay, enabled with ?debug=1 in the address bar.
export const DEBUG = new URLSearchParams(location.search).has('debug');

export class DebugOverlay {
  constructor(game) {
    this.game = game;
    this.el = document.createElement('div');
    this.el.className = 'debug';
    document.body.appendChild(this.el);
    this._t = 0;
    this._frames = 0;
    this._worst = 0;
  }

  tick(rawDt) {
    this._t += rawDt;
    this._frames++;
    this._worst = Math.max(this._worst, rawDt);
    if (this._t < 0.5) return;
    const { engine, quality, player } = this.game;
    const info = engine.renderer.info;
    const fps = this._frames / this._t;
    const p = player?.pos;
    this.el.textContent =
      `fps ${fps.toFixed(0)}  worst ${(this._worst * 1000).toFixed(0)}ms\n` +
      `calls ${info.render.calls}  tris ${(info.render.triangles / 1000).toFixed(1)}k\n` +
      `geo ${info.memory.geometries}  tex ${info.memory.textures}\n` +
      `tier ${quality.tier} (${quality.setting})  pr ${engine.renderer.getPixelRatio().toFixed(2)}\n` +
      (p ? `pos ${p.x.toFixed(1)} ${p.y.toFixed(2)} ${p.z.toFixed(1)}  ${player.state}` : '');
    this._t = 0;
    this._frames = 0;
    this._worst = 0;
  }
}
