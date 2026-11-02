import * as THREE from 'three';
import { bakeStatic } from './Bake.js';
import * as arena from './zones/arena.js';
import * as selectStage from './zones/selectStage.js';
import * as hub from './zones/hub.js';
import * as energy from './zones/energy.js';
import * as construction from './zones/construction.js';
import * as jungle from './zones/jungle.js';
import * as water from './zones/water.js';
import * as life from './zones/life.js';

// Loads one zone at a time into the scene and frees it on leave.
// Every zone is generated from code that is already downloaded,
// so switching zones never touches the network.
export const ZONES = { arena, select: selectStage, hub, energy, construction, jungle, water, life };

const ease = (t) => t * t * (3 - 2 * t);

export class WorldManager {
  constructor(game) {
    this.game = game;
    this.root = null;
    this.zone = null;
    this.id = null;
    this.env = null;
    this.tweens = [];
  }

  load(id) {
    this.unload();
    const { engine, collision, interactions, audio, progress, npcs } = this.game;
    collision.clear();
    interactions.clear();
    npcs.clear();
    this.root = new THREE.Group();
    this.root.name = 'zone:' + id;
    engine.scene.add(this.root);
    const ctx = {
      game: this.game,
      scene: engine.scene,
      root: this.root,
      collision,
      interactions,
      npcs,
      audio,
      save: progress.data,
      tween: (duration, fn, done) => this.tween(duration, fn, done),
      setEnv: (env) => (this.env = env),
    };
    this.id = id;
    this.zone = ZONES[id].build(ctx);
    if (this.zone.bake) bakeStatic(this.root);
    return this.zone;
  }

  unload() {
    if (!this.root) return;
    const scene = this.game.engine.scene;
    scene.remove(this.root);
    this.root.traverse((o) => {
      if (o.isLight) o.dispose(); // frees the sun's shadow map
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      if (o.isInstancedMesh) o.dispose();
      for (const m of [].concat(o.material || [])) {
        if (m.userData.shared) continue;
        if (m.map && !m.map.userData.shared) m.map.dispose();
        m.dispose();
      }
    });
    if (scene.background?.isTexture) scene.background.dispose();
    scene.background = null;
    scene.fog = null;
    this.root = null;
    this.zone = null;
    this.env = null;
    this.tweens.length = 0;
  }

  tween(duration, fn, done) {
    this.tweens.push({ t: 0, duration, fn, done });
  }

  update(dt, t) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.duration);
      tw.fn(ease(k));
      if (k >= 1) {
        this.tweens.splice(i, 1);
        tw.done?.();
      }
    }
    this.zone?.update?.(dt, t);
  }
}
