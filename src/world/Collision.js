// Lightweight character collision: boxes (rotatable around Y), ramps and
// cylinders, stored in a uniform grid. No physics engine needed.
//
// A collider blocks sideways only when it is taller than the character's
// step height at that point; otherwise the character steps up onto it.

const CELL = 8;
const SNAP_DOWN = 0.45;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const key = (cx, cz) => (cx + 2048) * 4096 + (cz + 2048);

export class Collision {
  constructor() {
    this.clear();
    this._near = [];
    this._ground = { y: -Infinity, c: null };
    this._res = { landed: false, impact: 0 };
  }

  clear() {
    this.grid = new Map();
    this.climbs = [];
    this.killY = -10;
    this._stamp = 1;
  }

  _make(type, o) {
    const rot = o.rotY || 0;
    return {
      type,
      x: o.x, z: o.z,
      hw: (o.w || 0) / 2, hd: (o.d || 0) / 2, r: o.r || 0,
      minY: o.minY ?? 0, maxY: o.maxY ?? 1,
      y0: o.y0 ?? 0, y1: o.y1 ?? 0,
      cos: Math.cos(rot), sin: Math.sin(rot),
      tag: o.tag || null,
      camera: o.camera !== false,
      enabled: true,
      cells: [],
      _stamp: 0,
    };
  }

  /** Box: x,z = center, w,d = size, minY..maxY, rotY. */
  addBox(o) {
    return this._insert(this._make('box', o));
  }

  /** Ramp: like a box whose top goes from y0 (local -z edge) to y1 (local +z edge). */
  addRamp(o) {
    const c = this._make('ramp', o);
    c.maxY = Math.max(c.y0, c.y1);
    return this._insert(c);
  }

  /** Vertical cylinder: x,z, r, minY..maxY. */
  addCylinder(o) {
    return this._insert(this._make('cyl', o));
  }

  /** Climbable volume (ladder). The climbing face looks toward local -z. */
  addClimb(o) {
    const c = this._make('climb', o);
    c.nx = -c.sin;
    c.nz = -c.cos;
    this.climbs.push(c);
    return c;
  }

  remove(c) {
    c.enabled = false;
    for (const k of c.cells) {
      const list = this.grid.get(k);
      const i = list ? list.indexOf(c) : -1;
      if (i >= 0) list.splice(i, 1);
    }
    c.cells.length = 0;
  }

  /** Put back a collider taken out with remove(). */
  restore(c) {
    if (c.enabled) return c;
    c.enabled = true;
    return this._insert(c);
  }

  _insert(c) {
    let ex, ez;
    if (c.type === 'cyl') {
      ex = ez = c.r;
    } else {
      ex = Math.abs(c.hw * c.cos) + Math.abs(c.hd * c.sin);
      ez = Math.abs(c.hw * c.sin) + Math.abs(c.hd * c.cos);
    }
    const x0 = Math.floor((c.x - ex) / CELL), x1 = Math.floor((c.x + ex) / CELL);
    const z0 = Math.floor((c.z - ez) / CELL), z1 = Math.floor((c.z + ez) / CELL);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const k = key(cx, cz);
        if (!this.grid.has(k)) this.grid.set(k, []);
        this.grid.get(k).push(c);
        c.cells.push(k);
      }
    }
    return c;
  }

  _query(minX, minZ, maxX, maxZ, out) {
    const stamp = ++this._stamp;
    out.length = 0;
    const x0 = Math.floor(minX / CELL), x1 = Math.floor(maxX / CELL);
    const z0 = Math.floor(minZ / CELL), z1 = Math.floor(maxZ / CELL);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const list = this.grid.get(key(cx, cz));
        if (!list) continue;
        for (const c of list) {
          if (c._stamp !== stamp) {
            c._stamp = stamp;
            out.push(c);
          }
        }
      }
    }
    return out;
  }

  _top(c, lx, lz) {
    if (c.type !== 'ramp') return c.maxY;
    const t = (clamp(lz, -c.hd, c.hd) + c.hd) / (2 * c.hd);
    return c.y0 + (c.y1 - c.y0) * t;
  }

  /** Highest walkable surface under (x,z) that is not above maxTop. */
  _groundBelow(x, z, maxTop, margin, near, out) {
    out.y = -Infinity;
    out.c = null;
    for (const c of near) {
      let top;
      if (c.type === 'cyl') {
        const dx = x - c.x, dz = z - c.z;
        if (dx * dx + dz * dz > (c.r + margin) ** 2) continue;
        top = c.maxY;
      } else {
        const dx = x - c.x, dz = z - c.z;
        const lx = dx * c.cos - dz * c.sin;
        const lz = dx * c.sin + dz * c.cos;
        if (Math.abs(lx) > c.hw + margin || Math.abs(lz) > c.hd + margin) continue;
        top = this._top(c, lx, lz);
      }
      if (top <= maxTop && top > out.y) {
        out.y = top;
        out.c = c;
      }
    }
    return out;
  }

  groundAt(x, z, maxTop) {
    const near = this._query(x - 1, z - 1, x + 1, z + 1, this._near);
    return this._groundBelow(x, z, maxTop, 0, near, this._ground).y;
  }

  _pushOut(b, c) {
    const r = b.radius;
    let nx, nz, pen;
    if (c.type === 'cyl') {
      if (!(b.pos.y < c.maxY - b.stepHeight && b.pos.y + b.height > c.minY)) return;
      const dx = b.pos.x - c.x, dz = b.pos.z - c.z;
      const R = c.r + r;
      const d2 = dx * dx + dz * dz;
      if (d2 >= R * R) return;
      const d = Math.sqrt(d2);
      if (d < 1e-6) { nx = 1; nz = 0; } else { nx = dx / d; nz = dz / d; }
      pen = R - d;
    } else {
      const dx = b.pos.x - c.x, dz = b.pos.z - c.z;
      const lx = dx * c.cos - dz * c.sin;
      const lz = dx * c.sin + dz * c.cos;
      const qx = clamp(lx, -c.hw, c.hw), qz = clamp(lz, -c.hd, c.hd);
      if (!(b.pos.y < this._top(c, qx, qz) - b.stepHeight && b.pos.y + b.height > c.minY)) return;
      const ex = lx - qx, ez = lz - qz;
      const d2 = ex * ex + ez * ez;
      if (d2 >= r * r) return;
      let lnx, lnz;
      if (d2 > 1e-10) {
        const d = Math.sqrt(d2);
        lnx = ex / d; lnz = ez / d; pen = r - d;
      } else {
        const px = c.hw - Math.abs(lx), pz = c.hd - Math.abs(lz);
        if (px < pz) { lnx = Math.sign(lx) || 1; lnz = 0; pen = px + r; } else { lnx = 0; lnz = Math.sign(lz) || 1; pen = pz + r; }
      }
      nx = lnx * c.cos + lnz * c.sin;
      nz = -lnx * c.sin + lnz * c.cos;
    }
    b.pos.x += nx * pen;
    b.pos.z += nz * pen;
    const vn = b.vel.x * nx + b.vel.z * nz;
    if (vn < 0) {
      b.vel.x -= nx * vn;
      b.vel.z -= nz * vn;
    }
  }

  _ceiling(b, near, feetBefore) {
    const head = b.pos.y + b.height;
    for (const c of near) {
      if (c.minY < feetBefore + b.height - 0.01 || head <= c.minY) continue;
      const dx = b.pos.x - c.x, dz = b.pos.z - c.z;
      let inside;
      if (c.type === 'cyl') {
        inside = dx * dx + dz * dz < (c.r + b.radius * 0.5) ** 2;
      } else {
        const lx = dx * c.cos - dz * c.sin;
        const lz = dx * c.sin + dz * c.cos;
        inside = Math.abs(lx) < c.hw + b.radius * 0.5 && Math.abs(lz) < c.hd + b.radius * 0.5;
      }
      if (inside) {
        b.pos.y = c.minY - b.height;
        b.vel.y = 0;
        return;
      }
    }
  }

  /**
   * Moves a character body {pos, vel, radius, height, stepHeight, grounded,
   * ground, gravityScale} and resolves collisions. Returns {landed, impact}.
   */
  moveBody(b, dt, gravity) {
    const res = this._res;
    res.landed = false;
    res.impact = 0;
    const speed = Math.hypot(b.vel.x, b.vel.y, b.vel.z);
    const steps = Math.min(6, Math.max(1, Math.ceil((speed * dt) / 0.2)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) this._step(b, h, gravity, res);
    return res;
  }

  _step(b, h, gravity, res) {
    b.pos.x += b.vel.x * h;
    b.pos.z += b.vel.z * h;
    const reach = b.radius + 1;
    const near = this._query(b.pos.x - reach, b.pos.z - reach, b.pos.x + reach, b.pos.z + reach, this._near);
    for (let it = 0; it < 2; it++) for (const c of near) this._pushOut(b, c);

    const feet = b.pos.y;
    const g = this._groundBelow(b.pos.x, b.pos.z, feet + b.stepHeight, b.radius * 0.6, near, this._ground);

    if (b.grounded && b.vel.y <= 0 && g.c && feet - g.y <= SNAP_DOWN) {
      b.pos.y = g.y;
      b.vel.y = 0;
      b.ground = g.c;
      return;
    }
    b.vel.y = Math.max(-30, b.vel.y - gravity * (b.gravityScale ?? 1) * h);
    b.pos.y += b.vel.y * h;
    if (b.vel.y > 0) this._ceiling(b, near, feet);
    if (g.c && b.pos.y <= g.y) {
      if (!b.grounded) {
        res.landed = true;
        res.impact = Math.max(res.impact, -b.vel.y);
      }
      b.pos.y = g.y;
      b.vel.y = 0;
      b.grounded = true;
      b.ground = g.c;
    } else {
      b.grounded = false;
      b.ground = null;
    }
  }

  /** Ladder the character is touching, or null. */
  findClimb(pos, radius) {
    for (const c of this.climbs) {
      const dx = pos.x - c.x, dz = pos.z - c.z;
      const lx = dx * c.cos - dz * c.sin;
      const lz = dx * c.sin + dz * c.cos;
      if (Math.abs(lx) <= c.hw + radius * 0.3 && Math.abs(lz) <= c.hd + radius &&
          pos.y >= c.minY - 0.1 && pos.y <= c.maxY) return c;
    }
    return null;
  }

  /** Distance along a ray to the first solid collider (for the camera). */
  raycast(ox, oy, oz, dx, dy, dz, maxDist) {
    const ex = ox + dx * maxDist, ez = oz + dz * maxDist;
    const near = this._query(Math.min(ox, ex), Math.min(oz, ez), Math.max(ox, ex), Math.max(oz, ez), this._near);
    let best = maxDist;
    for (const c of near) {
      if (!c.camera) continue;
      const px = ox - c.x, pz = oz - c.z;
      const lox = px * c.cos - pz * c.sin, loz = px * c.sin + pz * c.cos;
      const ldx = dx * c.cos - dz * c.sin, ldz = dx * c.sin + dz * c.cos;
      const hw = c.type === 'cyl' ? c.r * 0.85 : c.hw;
      const hd = c.type === 'cyl' ? c.r * 0.85 : c.hd;
      let t0 = 0, t1 = best;
      const slab = (o, d, lo, hi) => {
        if (Math.abs(d) < 1e-8) return o >= lo && o <= hi;
        let a = (lo - o) / d, bb = (hi - o) / d;
        if (a > bb) [a, bb] = [bb, a];
        t0 = Math.max(t0, a);
        t1 = Math.min(t1, bb);
        return t0 <= t1;
      };
      if (slab(lox, ldx, -hw, hw) && slab(oy, dy, c.minY, c.maxY) && slab(loz, ldz, -hd, hd) && t0 > 0) {
        best = Math.min(best, t0);
      }
    }
    return best;
  }
}
