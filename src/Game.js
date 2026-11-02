import { Engine } from './core/Engine.js';
import { Quality, QUALITY_OPTIONS } from './core/Quality.js';
import { Input } from './core/Input.js';
import { DEBUG, DebugOverlay } from './core/Debug.js';
import { Collision } from './world/Collision.js';
import { WorldManager, ZONES } from './world/WorldManager.js';
import { PlayerController } from './player/PlayerController.js';
import { CameraController } from './player/CameraController.js';
import { createCharacter } from './characters/CharacterBuilder.js';
import { InteractionSystem } from './systems/InteractionSystem.js';
import { NPCSystem } from './systems/NPCSystem.js';
import { Inventory } from './systems/Inventory.js';
import { QuestManager } from './systems/QuestManager.js';
import { Pickups } from './systems/Pickups.js';
import { Challenge } from './systems/Challenge.js';
import { Panel } from './ui/Panel.js';
import { openInventory, openQuests, openMap } from './ui/screens.js';
import { AudioManager } from './systems/AudioManager.js';
import { ProgressManager } from './systems/ProgressManager.js';
import { UIManager } from './ui/UIManager.js';
import { TouchControls } from './ui/TouchControls.js';
import { CharacterSelect } from './ui/CharacterSelect.js';
import { CHARACTER_BY_ID } from './data/characters.js';
import { ZONE_INFO } from './data/zones.js';

// Wires all systems together and runs the high-level game states:
// 'select' (character select), 'loading' and 'play'.
export class Game {
  constructor() {
    this.progress = new ProgressManager();
    const save = this.progress.load();
    this.quality = new Quality(save.settings.quality);
    this.engine = new Engine(document.getElementById('game'), this.quality);
    this.input = new Input(this.engine.canvas);
    this.audio = new AudioManager(save.settings.sound);
    this.collision = new Collision();
    this.interactions = new InteractionSystem(this);
    this.npcs = new NPCSystem(this);
    this.inventory = new Inventory(this);
    this.quests = new QuestManager(this);
    this.pickups = new Pickups(this);
    this.challenge = new Challenge(this);
    this.world = new WorldManager(this);
    this.touch = new TouchControls(this.input, this.quality.isTouch);
    this.ui = new UIManager(this);
    this.panel = new Panel(this);
    this.cameraCtl = new CameraController(this.engine.camera, this.input, this.collision);
    this.select = new CharacterSelect(this);
    this.player = null;
    this.state = 'boot';
    this.modal = null;

    this.engine.onUpdate = (dt, t) => this.update(dt, t);
    this.engine.onContextLost = () => this.ui.toast('הגרפיקה הופסקה. רעננו את הדף כדי להמשיך.');
    if (DEBUG) {
      this.debug = new DebugOverlay(this);
      this.engine.onFrame = (raw) => this.debug.tick(raw);
    }
    window.__BQ = this; // handy for testing from the console
  }

  async init(boot) {
    this.openCharacterSelect();
    boot.progress(0.5, 'מכין את הדמויות...');
    this.engine.compile();
    this.engine.start();
  }

  openCharacterSelect() {
    this.state = 'select';
    this.panel.close();
    this.challenge.clear();
    this.setModal(null);
    this.ui.showPause(false);
    this.ui.showHUD(false);
    this.touch.setVisible(false);
    if (this.player) {
      this.player.detach();
      this.player = null;
    }
    this.select.open(this.progress.data.character || 'dvori', (id) => this.startPlay(id));
  }

  async startPlay(id) {
    if (this.state !== 'select') return;
    this.state = 'loading';
    this.progress.data.character = id;
    this.progress.save();
    if (this.touch.enabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    await this.ui.fade(true);
    this.select.close();

    this.player = new PlayerController(this, createCharacter(CHARACTER_BY_ID[id]));
    const saved = this.progress.data.zone;
    this._enterZone(ZONES[saved] && saved !== 'select' ? saved : 'hub');
    this.ui.showHUD(true);
    this.touch.setVisible(true);
    this.state = 'play';
    await this.ui.fade(false);

    const name = CHARACTER_BY_ID[id].name;
    if (!this.progress.data.flags.helpSeen) {
      this.progress.setFlag('helpSeen');
      this.ui.showHelp(true);
    } else {
      this.ui.toast(`${name}, ברוכים הבאים ל${ZONE_INFO[this.world.id].short}!`);
    }
    if (this.touch.enabled && innerHeight > innerWidth) this.ui.toast('טיפ: סובבו את המכשיר לרוחב');
  }

  /** Build a zone and place the player at the entrance used (from = previous zone). */
  _enterZone(id, from) {
    const zone = this.world.load(id);
    const spawn = (from && zone.spawns?.[from]) || zone.spawn;
    this.player.spawn(spawn);
    this.cameraCtl.reset(this.player.pos, spawn.yaw);
    this.ui.setZoneTitle(zone.title);
    this.ui.hudLogic.minimap.build(this.collision, this.world.markers);
    this.engine.compile();
    const data = this.progress.data;
    data.zone = id;
    const first = !data.visited[id];
    data.visited[id] = true;
    this.progress.save();
    this.ui.hudLogic.refresh();
    return first;
  }

  /** Walk through a portal to another zone. */
  async travel(to, from = this.world.id) {
    if (this.state !== 'play' || this.traveling) return;
    this.traveling = true;
    this.audio.play('portal');
    this.player.respawning = true; // freeze movement during the fade
    await this.ui.fade(true);
    const first = this._enterZone(to, from);
    this.player.respawning = false;
    await this.ui.fade(false);
    this.traveling = false;
    if (first && to !== 'hub') {
      this.audio.play('secret');
      this.ui.toast('אזור חדש: ' + ZONE_INFO[to].short + '!', 'good');
    } else {
      this.ui.toast(ZONE_INFO[to].short);
    }
  }

  /** Erase all progress and go back to character select. */
  newGame() {
    this.progress.reset();
    this.ui.refreshSettings();
    this.ui.hudLogic.refresh();
    this.openCharacterSelect();
  }

  setModal(name) {
    this.modal = name;
  }

  togglePause() {
    if (this.state !== 'play') return;
    if (this.modal === 'pause') this.resume();
    else if (!this.modal) {
      this.setModal('pause');
      this.ui.showPause(true);
    }
  }

  resume() {
    this.ui.showPause(false);
    this.ui.showHelp(false);
    this.setModal(null);
  }

  cycleQuality() {
    const s = this.progress.data.settings;
    s.quality = QUALITY_OPTIONS[(QUALITY_OPTIONS.indexOf(s.quality) + 1) % QUALITY_OPTIONS.length];
    this.quality.set(s.quality);
    this.progress.save();
  }

  toggleSound() {
    const s = this.progress.data.settings;
    s.sound = !s.sound;
    this.audio.setEnabled(s.sound);
    this.progress.save();
  }

  toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  update(dt, t) {
    const input = this.input;
    if (this.state === 'select') {
      this.select.update(dt, t);
      this.world.update(dt, t);
    } else if (this.state === 'play') {
      if (input.consume('pause')) {
        if (this.modal === 'panel') this.panel.closable && this.panel.close();
        else if (this.modal === 'help') this.resume();
        else this.togglePause();
      }
      const screens = { inventory: openInventory, quests: openQuests, map: openMap };
      if (!this.modal) {
        if (input.consume('help')) this.ui.showHelp(true);
        for (const key in screens) if (input.consume(key)) screens[key](this);
      } else if (this.modal === 'panel') {
        // The same key closes its screen again.
        for (const key in screens) if (input.consume(key) && this.panel.kind === key) this.panel.close();
      }
      if (!this.modal) {
        this.player.update(dt, this.cameraCtl.yaw);
        this.interactions.update(dt);
        this.npcs.update(dt);
        this.pickups.update(dt, t);
        this.challenge.update(dt);
        this.quests.update(dt);
        this.world.update(dt, t);
        this.cameraCtl.update(dt, this.player);
        this._followSun();
        this.ui.hudLogic.update(dt);
      } else if (this.modal === 'help' && input.consume('confirm')) {
        this.resume();
      }
    }
    input.endFrame();
  }

  /** Keep the shadow-casting light centered on the player. */
  _followSun() {
    const sun = this.world.env?.sun;
    if (!sun) return;
    const p = this.player.pos;
    sun.position.set(p.x + 12, p.y + 22, p.z + 8);
    sun.target.position.set(p.x, p.y, p.z);
  }
}
