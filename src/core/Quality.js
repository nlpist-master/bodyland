import * as THREE from 'three';

// Graphics tiers. "auto" picks by device and steps down if the frame rate drops.
const TIERS = {
  high: { pixelRatio: 2, shadows: true },
  medium: { pixelRatio: 1.5, shadows: false },
  low: { pixelRatio: 1, shadows: false },
};
export const QUALITY_OPTIONS = ['auto', 'high', 'medium', 'low'];

export class Quality {
  constructor(setting = 'auto') {
    const ua = navigator.userAgent;
    const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    this.isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || iPadOS;
    this.isTouch = this.isMobile || matchMedia('(pointer: coarse)').matches;
    this.antialias = !this.isMobile;
    this.setting = QUALITY_OPTIONS.includes(setting) ? setting : 'auto';
    this.autoTier = this.isMobile ? 'medium' : 'high';
    this.renderer = null;
    this.onShadowsChanged = null;
    this._time = 0;
    this._frames = 0;
    this._slow = 0;
    this.fps = 60;
  }

  get tier() {
    return this.setting === 'auto' ? this.autoTier : this.setting;
  }

  get shadows() {
    return TIERS[this.tier].shadows;
  }

  attach(renderer, onShadowsChanged) {
    this.renderer = renderer;
    this.onShadowsChanged = onShadowsChanged;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    this.apply();
  }

  apply() {
    const r = this.renderer;
    if (!r) return;
    const t = TIERS[this.tier];
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, t.pixelRatio));
    if (r.shadowMap.enabled !== t.shadows) {
      r.shadowMap.enabled = t.shadows;
      this.onShadowsChanged?.();
    }
  }

  set(setting) {
    this.setting = setting;
    if (setting === 'auto') this.autoTier = this.isMobile ? 'medium' : 'high';
    this.apply();
  }

  /** Called every frame with the raw frame time; steps "auto" down when slow. */
  sample(rawDt) {
    if (rawDt > 0.25) return; // tab switch or loading hitch, not real gameplay
    this._time += rawDt;
    this._frames++;
    if (this._time < 2) return;
    this.fps = this._frames / this._time;
    this._time = 0;
    this._frames = 0;
    if (this.setting !== 'auto') return;
    // 24 rather than 30, so screens that are capped at 30 fps don't trigger it.
    this._slow = this.fps < 24 ? this._slow + 1 : 0;
    if (this._slow >= 2 && this.autoTier !== 'low') {
      this.autoTier = this.autoTier === 'high' ? 'medium' : 'low';
      this._slow = 0;
      console.info('[quality] low frame rate, switching to', this.autoTier);
      this.apply();
    }
  }
}
