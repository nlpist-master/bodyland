import * as THREE from 'three';

// Owns the renderer, scene, camera and the main loop.
export class Engine {
  constructor(container, quality) {
    this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({
      antialias: quality.antialias,
      powerPreference: 'high-performance',
    });
    this.canvas = this.renderer.domElement;
    container.appendChild(this.canvas);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 220);
    quality.attach(this.renderer, () => this.refreshMaterials());

    this.clock = new THREE.Clock(false);
    this.time = 0;
    this.onUpdate = null;
    this.onFrame = null;
    this.onContextLost = null;

    const resize = () => this.resize();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    this.resize();

    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.onContextLost?.();
    });
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 70 : 55; // wider view when a phone is held upright
    this.camera.updateProjectionMatrix();
  }

  start() {
    this.clock.start();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  frame() {
    const raw = this.clock.getDelta();
    const dt = Math.min(raw, 0.05);
    this.time += dt;
    this.onUpdate?.(dt, this.time);
    this.renderer.render(this.scene, this.camera);
    this.quality.sample(raw);
    this.onFrame?.(raw);
  }

  /** Compile shaders up front so the first seconds of play don't stutter. */
  compile() {
    this.renderer.compile(this.scene, this.camera);
  }

  refreshMaterials() {
    this.scene.traverse((o) => {
      if (!o.material) return;
      for (const m of [].concat(o.material)) m.needsUpdate = true;
    });
  }
}
