// Third-person orbit camera: follows the player, rotates with mouse drag or
// finger swipe, zooms with the wheel, and pulls in when a wall is behind it.
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const TAU = Math.PI * 2;
const wrap = (a) => a - TAU * Math.floor((a + Math.PI) / TAU);
const TARGET_H = 1.15;

export class CameraController {
  constructor(camera, input, collision) {
    this.camera = camera;
    this.input = input;
    this.collision = collision;
    this.yaw = 0;
    this.pitch = 0.32;
    this.wantDist = 6.2;
    this.dist = 6.2;
    this.idle = 0;
    this.target = { x: 0, y: 0, z: 0 };
  }

  reset(pos, yaw) {
    this.yaw = yaw;
    this.pitch = 0.32;
    this.target.x = pos.x;
    this.target.y = pos.y + TARGET_H;
    this.target.z = pos.z;
    this.dist = this.wantDist;
    this._place(0);
  }

  update(dt, player) {
    const look = this.input.consumeLook();
    if (look.x || look.y) {
      this.yaw -= look.x * 0.0055;
      this.pitch = clamp(this.pitch + look.y * 0.0045, -0.2, 1.15);
      this.idle = 0;
    } else {
      this.idle += dt;
    }
    const zoom = this.input.consumeZoom();
    if (zoom) this.wantDist = clamp(this.wantDist + zoom * 0.8, 3, 10);

    const t = this.target;
    const k = 1 - Math.exp(-12 * dt);
    const ky = 1 - Math.exp(-7 * dt);
    t.x += (player.pos.x - t.x) * k;
    t.z += (player.pos.z - t.z) * k;
    t.y += (player.pos.y + TARGET_H - t.y) * ky;

    // Gently swing behind the player while walking, unless the player is steering the camera.
    const hs = Math.hypot(player.vel.x, player.vel.z);
    if (this.idle > 1.2 && hs > 1 && !player.climb) {
      const diff = wrap(player.facing - this.yaw);
      if (Math.abs(diff) < 1.0) this.yaw += diff * (1 - Math.exp(-0.25 * hs * dt));
    }
    this._place(dt);
  }

  _place(dt) {
    const t = this.target;
    const cp = Math.cos(this.pitch);
    // Direction from the target back toward the camera.
    const bx = -Math.sin(this.yaw) * cp;
    const by = Math.sin(this.pitch);
    const bz = -Math.cos(this.yaw) * cp;
    const hit = this.collision.raycast(t.x, t.y, t.z, bx, by, bz, this.wantDist + 0.3);
    const allowed = Math.max(0.8, Math.min(this.wantDist, hit - 0.3));
    if (allowed < this.dist || dt === 0) this.dist = allowed;
    else this.dist += (allowed - this.dist) * (1 - Math.exp(-4 * dt));

    const cam = this.camera;
    cam.position.set(t.x + bx * this.dist, t.y + by * this.dist, t.z + bz * this.dist);
    cam.lookAt(t.x, t.y, t.z);
  }
}
