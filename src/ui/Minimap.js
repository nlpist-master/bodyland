// Small round map in the corner. The zone is drawn once from its colliders
// (seen from above); every frame only the markers move. The map turns with
// the camera, so "up" is always the way you are looking.
const SCALE = 4;   // pixels per world unit on the prerendered layer
const VIEW = 26;   // world units from the center to the edge of the map

export class Minimap {
  constructor(parent) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'minimap';
    parent.appendChild(this.canvas);
    this.size = 0;
    this.layer = null;
    this.bounds = null;
    this._t = 0;
  }

  /** Draw the static layer for the zone that was just built. */
  build(collision, markers) {
    const seen = new Set();
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    const list = [];
    for (const cell of collision.grid.values()) {
      for (const c of cell) {
        if (seen.has(c)) continue;
        seen.add(c);
        list.push(c);
        const r = c.type === 'cyl' ? c.r : Math.hypot(c.hw, c.hd);
        x0 = Math.min(x0, c.x - r); x1 = Math.max(x1, c.x + r);
        z0 = Math.min(z0, c.z - r); z1 = Math.max(z1, c.z + r);
      }
    }
    if (!list.length) return;
    x0 = Math.max(x0, -60); x1 = Math.min(x1, 60); z0 = Math.max(z0, -60); z1 = Math.min(z1, 60);
    const layer = document.createElement('canvas');
    layer.width = Math.ceil((x1 - x0) * SCALE);
    layer.height = Math.ceil((z1 - z0) * SCALE);
    const g = layer.getContext('2d');
    const draw = (c, fill) => {
      g.fillStyle = fill;
      g.save();
      g.translate((c.x - x0) * SCALE, (c.z - z0) * SCALE);
      if (c.type === 'cyl') {
        g.beginPath();
        g.arc(0, 0, c.r * SCALE, 0, Math.PI * 2);
        g.fill();
      } else {
        // Collider local axes: x' = (cos, -sin), z' = (sin, cos) in world x/z.
        g.transform(c.cos, -c.sin, c.sin, c.cos, 0, 0);
        g.fillRect(-c.hw * SCALE, -c.hd * SCALE, c.hw * 2 * SCALE, c.hd * 2 * SCALE);
      }
      g.restore();
    };
    // Floors first (walkable ground), then everything that sticks up.
    for (const c of list) if (c.maxY <= 0.4 && c.minY < -0.3) draw(c, 'rgba(255,255,255,0.55)');
    for (const c of list) {
      if (c.maxY <= 0.4 && c.minY < -0.3) continue;
      const h = c.maxY;
      draw(c, h > 3 ? 'rgba(60,40,110,0.95)' : h > 1 ? 'rgba(120,90,190,0.9)' : 'rgba(190,170,240,0.9)');
    }
    this.layer = layer;
    this.bounds = { x0, z0 };
    this.markers = markers;
  }

  /** player: {pos}, yaw: camera yaw, target: {x,z} or null. */
  draw(dt, player, yaw, target, npcs) {
    this._t += dt;
    if (this._t < 1 / 20) return;
    this._t = 0;
    const cv = this.canvas;
    const css = cv.clientWidth;
    if (!css) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (this.size !== css * dpr) {
      this.size = css * dpr;
      cv.width = cv.height = this.size;
    }
    const g = cv.getContext('2d');
    const S = this.size, R = S / 2;
    const k = R / VIEW; // canvas px per world unit
    g.clearRect(0, 0, S, S);
    g.save();
    g.beginPath();
    g.arc(R, R, R - 2, 0, Math.PI * 2);
    g.fillStyle = 'rgba(42,27,77,0.75)';
    g.fill();
    g.clip();
    g.translate(R, R);
    // Forward (sin yaw, cos yaw) must point up.
    const rot = -Math.PI / 2 - Math.atan2(Math.cos(yaw), Math.sin(yaw));
    g.rotate(rot);
    const p = player.pos;
    if (this.layer) {
      const b = this.bounds;
      g.drawImage(this.layer, -(p.x - b.x0) * k, -(p.z - b.z0) * k, this.layer.width * (k / SCALE), this.layer.height * (k / SCALE));
    }
    const dot = (x, z, color, r) => {
      g.fillStyle = color;
      g.beginPath();
      g.arc((x - p.x) * k, (z - p.z) * k, r, 0, Math.PI * 2);
      g.fill();
    };
    for (const m of this.markers || []) dot(m.x, m.z, m.color, S * 0.035);
    for (const n of npcs) dot(n.x, n.z, '#ffd23f', S * 0.03);
    if (target) {
      // Clamp the mission marker to the edge when it is far away.
      let dx = (target.x - p.x) * k, dz = (target.z - p.z) * k;
      const len = Math.hypot(dx, dz), max = R - S * 0.07;
      if (len > max) {
        dx *= max / len;
        dz *= max / len;
      }
      const pulse = 1 + Math.sin(performance.now() / 180) * 0.15;
      g.save();
      g.translate(dx, dz);
      g.rotate(-rot);
      g.fillStyle = '#ff5fa2';
      g.strokeStyle = '#fff';
      g.lineWidth = S * 0.012;
      star(g, S * 0.06 * pulse);
      g.restore();
    }
    g.restore();
    // Player arrow (always pointing up, the map turns instead).
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#2a1b4d';
    g.lineWidth = S * 0.015;
    g.beginPath();
    g.moveTo(R, R - S * 0.07);
    g.lineTo(R + S * 0.045, R + S * 0.045);
    g.lineTo(R, R + S * 0.02);
    g.lineTo(R - S * 0.045, R + S * 0.045);
    g.closePath();
    g.fill();
    g.stroke();
    g.beginPath();
    g.arc(R, R, R - 2, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = S * 0.025;
    g.stroke();
  }
}

function star(g, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
  g.stroke();
}
