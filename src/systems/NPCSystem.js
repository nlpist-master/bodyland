import * as THREE from 'three';
import { createNPC } from '../characters/NPCs.js';
import { blobShadow } from '../world/Props.js';
import { NPC_INFO, NPC_LINES } from '../data/npcs.js';

const TAU = Math.PI * 2;
const wrap = (a) => a - TAU * Math.floor((a + Math.PI) / TAU);
const GESTURES = ['talk', 'point', 'laugh', 'excited', 'talk'];

// Companions standing in a zone: they turn toward the player, wave and
// greet once, and answer with a speech bubble when the player talks to them.
export class NPCSystem {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.speaker = null;
    this.timer = 0;
    this.bubble = document.createElement('div');
    this.bubble.className = 'npc-bubble hidden';
    this.bubble.innerHTML = '<b></b><span></span>';
    this.bubbleName = this.bubble.querySelector('b');
    this.bubbleText = this.bubble.querySelector('span');
    document.getElementById('ui').appendChild(this.bubble);
    this._v = new THREE.Vector3();
  }

  clear() {
    this.list.length = 0;
    this._hide();
  }

  /** Place a companion in the zone being built. */
  add(ctx, { id, x, z, y = 0, rotY = 0, zone }) {
    const npc = createNPC(id);
    npc.root.position.set(x, y, z);
    npc.root.rotation.y = rotY;
    ctx.root.add(npc.root);
    const shadow = blobShadow();
    shadow.position.set(x, y + 0.02, z);
    shadow.scale.setScalar(1.1);
    ctx.root.add(shadow);
    ctx.collision.addCylinder({ x, z, r: 0.45, minY: y, maxY: y + npc.height });

    const info = NPC_INFO[id];
    const script = NPC_LINES[id]?.[zone] || { greet: 'שלום!', lines: ['שלום!'] };
    const n = { id, npc, info, script, x, y, z, baseYaw: rotY, idx: 0, greeted: false };
    ctx.interactions.add({
      position: new THREE.Vector3(x, y, z),
      radius: 2.4,
      label: 'לדבר עם ' + info.name,
      onInteract: () => this.talk(n),
    });
    this.list.push(n);
    return n;
  }

  talk(n) {
    const line = n.script.lines[n.idx % n.script.lines.length];
    n.idx++;
    this.say(n, line);
    n.npc.animator.play(GESTURES[n.idx % GESTURES.length], 2.2);
    this.game.audio.play('talk');
  }

  say(n, text) {
    this.speaker = n;
    this.timer = 2.5 + text.length * 0.06;
    this.bubbleName.textContent = n.info.name;
    this.bubbleName.style.color = n.info.color;
    this.bubbleText.textContent = text;
    this.bubble.classList.remove('hidden');
    this.bubble.classList.remove('pop');
    void this.bubble.offsetWidth; // restart the pop animation
    this.bubble.classList.add('pop');
  }

  _hide() {
    this.speaker = null;
    this.bubble.classList.add('hidden');
  }

  update(dt) {
    const p = this.game.player.pos;
    for (const n of this.list) {
      const dx = p.x - n.x, dz = p.z - n.z;
      const dist = Math.hypot(dx, dz);
      const root = n.npc.root;
      const want = dist < 7 ? Math.atan2(dx, dz) : n.baseYaw;
      root.rotation.y += wrap(want - root.rotation.y) * (1 - Math.exp(-5 * dt));
      if (!n.greeted && dist < 5) {
        n.greeted = true;
        this.say(n, n.script.greet);
        n.npc.animator.play('wave', 2.4);
        this.game.audio.play('talk');
      }
      n.npc.animator.update(dt);
    }
    this._placeBubble(dt);
  }

  _placeBubble(dt) {
    const n = this.speaker;
    if (!n) return;
    this.timer -= dt;
    const p = this.game.player.pos;
    if (this.timer <= 0 || Math.hypot(p.x - n.x, p.z - n.z) > 11) {
      this._hide();
      return;
    }
    const v = this._v.set(n.x, n.y + n.npc.height + 0.25, n.z).project(this.game.engine.camera);
    const visible = v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
    this.bubble.style.visibility = visible ? 'visible' : 'hidden';
    // Keep the whole bubble on screen, even on a narrow phone.
    const W = innerWidth, H = innerHeight;
    const half = this.bubble.offsetWidth / 2 + 8;
    const x = Math.min(W - half, Math.max(half, ((v.x + 1) / 2) * W));
    const y = Math.max(this.bubble.offsetHeight + 80, ((1 - v.y) / 2) * H);
    this.bubble.style.left = x + 'px';
    this.bubble.style.top = Math.min(H - 20, y) + 'px';
  }
}
