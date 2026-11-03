import * as THREE from 'three';
import { blobShadow } from '../world/Props.js';

const WALK = 4.2;
const RUN = 7.6;
const JUMP = 8.6;
const GRAVITY = 24;
const BOUNCE = 15.5;
const CLIMB = 2.6;
const COYOTE = 0.12;
const JUMP_BUFFER = 0.15;
const BACK = 2.6;        // car steering: reverse speed
const TURN = 2.9;        // car steering: turn rate on keys (radians per second)
const TURN_STICK = 1.6;  // car steering: top turn rate on the joystick; a phone screen spins fast
const STICK_CURVE = 1.3; // car steering: part-way pushes turn gently
const STICK_DEAD = 0.25; // car steering: small sideways pushes don't turn

const TAU = Math.PI * 2;
const wrap = (a) => a - TAU * Math.floor((a + Math.PI) / TAU);

// Third-person character movement: walk, run, jump (hold for higher),
// ladders, bounce pads, and respawn after falling off the world.
// Two steering modes (pause menu): "car" - forward/back moves along the way
// the character faces and left/right turns it; "free" - moves toward where
// the stick or keys point, relative to the camera.
export class PlayerController {
  constructor(game, character) {
    this.game = game;
    this.char = character;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.radius = 0.32;
    this.height = 1.45;
    this.stepHeight = 0.35;
    this.gravityScale = 1;
    this.grounded = false;
    this.ground = null;
    this.facing = 0;
    this.car = true;
    this.turnVel = 0;
    this.reversing = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.climb = null;
    this.state = 'idle';
    this.lastSafe = new THREE.Vector3();
    this.safeTimer = 0;
    this.celebrateTime = 0;
    this.respawning = false;

    this.shadow = blobShadow();
    game.engine.scene.add(character.root, this.shadow);
    character.animator.onStep = (run) => game.audio.play('step', run ? 1 : 0.6);
  }

  detach() {
    this.game.engine.scene.remove(this.char.root, this.shadow);
    this.shadow.geometry.dispose();
    this.shadow.material.dispose();
  }

  spawn({ x, y = 0, z, yaw = 0 }) {
    this.pos.set(x, y, z);
    this.vel.set(0, 0, 0);
    this.facing = yaw;
    this.climb = null;
    this.grounded = true;
    this.lastSafe.copy(this.pos);
    this._sync();
  }

  /** Stop and do a happy dance for a moment. */
  celebrate(seconds = 1.6) {
    this.celebrateTime = seconds;
  }

  update(dt, camYaw) {
    if (this.respawning) return;
    const { input, collision, audio } = this.game;
    const frozen = this.celebrateTime > 0 && this.grounded;
    this.celebrateTime -= dt;

    this.car = this.game.progress.data.settings.steer !== 'free';
    let wx, wz, mag;
    if (this.car) [wx, wz, mag] = this._carMove(dt, input, frozen);
    else {
      const mv = input.getMove();
      const s = Math.sin(camYaw), c = Math.cos(camYaw);
      // Camera forward = (s, 0, c), camera right = (-c, 0, s).
      wx = -c * mv.x + s * mv.y;
      wz = s * mv.x + c * mv.y;
      mag = Math.min(1, Math.hypot(wx, wz));
      if (frozen) mag = 0;
      if (mag > 1e-3) {
        const inv = 1 / Math.hypot(wx, wz);
        wx *= inv;
        wz *= inv;
      }
    }

    if (input.consume('jump') && !frozen) this.jumpBuffer = JUMP_BUFFER;
    else this.jumpBuffer -= dt;

    if (this.climb) {
      this._climbStep(dt, wx * mag, wz * mag);
    } else {
      // A bounce throws you forward: rising from one carries at running speed.
      const speed = mag * (this.reversing ? BACK : input.isRunning() || this.bounced ? RUN : WALK);
      const k = 1 - Math.exp(-(this.grounded ? 12 : 4) * dt);
      this.vel.x += (wx * speed - this.vel.x) * k;
      this.vel.z += (wz * speed - this.vel.z) * k;

      this.coyote = this.grounded ? COYOTE : this.coyote - dt;
      if (this.jumpBuffer > 0 && this.coyote > 0) {
        this.vel.y = JUMP;
        this.grounded = false;
        this.coyote = 0;
        this.jumpBuffer = 0;
        audio.play('jump');
      }
      // Releasing jump early gives a short hop; falling is a bit faster than rising.
      if (this.vel.y <= 0) this.bounced = false;
      this.gravityScale = this.vel.y > 0 ? (this.bounced || input.isHeld('jump') ? 1 : 2.2) : 1.25;

      const res = collision.moveBody(this, dt, GRAVITY);
      if (res.landed) {
        this.char.animator.land(res.impact);
        if (res.impact > 5) audio.play('land', Math.min(1, res.impact / 16));
      }
      if (this.grounded && this.ground?.tag === 'bounce') {
        this.vel.y = BOUNCE;
        this.bounced = true;
        this.grounded = false;
        this.coyote = 0;
        this.char.animator.land(6);
        audio.play('boing');
      }

      if (mag > 0.3) {
        const ladder = collision.findClimb(this.pos, this.radius);
        if (ladder && !this.reversing && -(wx * ladder.nx + wz * ladder.nz) > 0.55 && this.pos.y < ladder.maxY - 0.3) this._startClimb(ladder);
      }
      if (mag > 0.1 && !this.climb && !this.car) {
        this.facing += wrap(Math.atan2(wx, wz) - this.facing) * (1 - Math.exp(-14 * dt));
      }

      if (this.grounded && this.ground?.tag !== 'bounce') {
        this.safeTimer += dt;
        if (this.safeTimer > 0.4) {
          this.lastSafe.copy(this.pos);
          this.safeTimer = 0;
        }
      }
      if (this.pos.y < collision.killY) this._respawn();
    }

    this._animate(dt);
    this._sync();
  }

  /** Car steering: returns the move direction and amount, and turns the character. */
  _carMove(dt, input, frozen) {
    let x, y, rate = TURN;
    const st = input.stick;
    if (st.active) {
      // Ignore a slight sideways drift when the stick is pushed "about forward".
      const ax = Math.abs(st.x);
      x = ax < STICK_DEAD ? 0 : Math.sign(st.x) * ((ax - STICK_DEAD) / (1 - STICK_DEAD)) ** STICK_CURVE;
      y = Math.abs(st.y) < 0.12 ? 0 : st.y;
      rate = TURN_STICK;
    } else {
      x = (input.isHeld('right') ? 1 : 0) - (input.isHeld('left') ? 1 : 0);
      y = (input.isHeld('up') ? 1 : 0) - (input.isHeld('down') ? 1 : 0);
    }
    if (frozen) x = y = 0;
    // Turning eases in and out so the camera behind doesn't jerk.
    const want = this.climb ? 0 : -x * rate;
    this.turnVel += (want - this.turnVel) * (1 - Math.exp(-(st.active ? 7 : 12) * dt));
    this.facing = wrap(this.facing + this.turnVel * dt);
    this.reversing = y < 0 && !this.climb;
    const sign = y < 0 ? -1 : 1;
    return [Math.sin(this.facing) * sign, Math.cos(this.facing) * sign, Math.min(1, Math.abs(y))];
  }

  _startClimb(ladder) {
    this.climb = ladder;
    this.vel.set(0, 0, 0);
    this.facing = Math.atan2(-ladder.nx, -ladder.nz);
    // Snap onto the ladder, touching the wall behind it.
    const dx = this.pos.x - ladder.x, dz = this.pos.z - ladder.z;
    const lx = Math.max(-ladder.hw * 0.5, Math.min(ladder.hw * 0.5, dx * ladder.cos - dz * ladder.sin));
    const lz = ladder.hd - this.radius - 0.02;
    this.pos.x = ladder.x + lx * ladder.cos + lz * ladder.sin;
    this.pos.z = ladder.z - lx * ladder.sin + lz * ladder.cos;
  }

  _climbStep(dt, wx, wz) {
    const l = this.climb;
    const into = -(wx * l.nx + wz * l.nz);
    if (this.jumpBuffer > 0) {
      // Jump off the ladder, away from the wall.
      this.jumpBuffer = 0;
      this.climb = null;
      this.vel.set(l.nx * 4, 6.5, l.nz * 4);
      this.game.audio.play('jump');
      return;
    }
    const vy = Math.abs(into) > 0.2 ? Math.sign(into) * CLIMB * Math.min(1, Math.abs(into) * 1.3) : 0;
    this.vel.set(0, vy, 0);
    this.pos.y += vy * dt;
    if (this.pos.y >= l.maxY - 0.02) {
      // Reached the top: step onto the ledge.
      this.pos.y = l.maxY + 0.01;
      this.pos.x -= l.nx * (this.radius + 0.5);
      this.pos.z -= l.nz * (this.radius + 0.5);
      this.climb = null;
      this.grounded = true;
      this.vel.set(0, 0, 0);
    } else if (this.pos.y <= l.minY && vy < 0) {
      this.pos.y = l.minY;
      this.climb = null;
    }
  }

  _respawn() {
    const { audio, ui } = this.game;
    this.respawning = true;
    audio.play('whoosh');
    ui.fade(true).then(() => {
      this.spawn({ x: this.lastSafe.x, y: this.lastSafe.y, z: this.lastSafe.z, yaw: this.facing });
      this.game.cameraCtl.reset(this.pos, this.facing);
      this.respawning = false;
      ui.toast('אופס! ננסה שוב');
      ui.fade(false);
    });
  }

  _animate(dt) {
    const hs = Math.hypot(this.vel.x, this.vel.z);
    let state;
    if (this.climb) state = 'climb';
    else if (!this.grounded) state = this.vel.y > -2.5 ? 'jump' : 'fall';
    else if (this.celebrateTime > 0) state = 'dance';
    else state = hs > 5.4 ? 'run' : hs > 0.35 ? 'walk' : 'idle';
    let speed = hs;
    if (state === 'walk' && this.car && this.vel.x * Math.sin(this.facing) + this.vel.z * Math.cos(this.facing) < 0) {
      speed = -hs; // stepping backward: the legs swing the other way
    } else if (state === 'idle' && this.car && Math.abs(this.turnVel) > 0.8) {
      state = 'walk'; // small steps while turning on the spot
      speed = 1.3;
    }
    this.state = state;
    this.char.animator.update(dt, state, speed, this.vel.y);
  }

  _sync() {
    const root = this.char.root;
    root.position.copy(this.pos);
    root.rotation.y = this.facing;
    const gy = this.game.collision.groundAt(this.pos.x, this.pos.z, this.pos.y + 0.05);
    const sh = this.shadow;
    sh.visible = gy > -Infinity;
    if (sh.visible) {
      const h = this.pos.y - gy;
      const s = 1 / (1 + h * 0.35);
      sh.position.set(this.pos.x, gy + 0.02, this.pos.z);
      sh.scale.setScalar(0.95 * s);
      sh.material.opacity = 0.8 * s;
    }
  }
}
