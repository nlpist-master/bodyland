import * as THREE from 'three';

// Shared cartoon materials and small procedural textures.
// Cached materials are flagged userData.shared and are never disposed.

let gradientMap = null;
const cache = new Map();

function getGradient() {
  if (!gradientMap) {
    gradientMap = new THREE.DataTexture(new Uint8Array([120, 190, 255]), 3, 1, THREE.RedFormat);
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.generateMipmaps = false;
    gradientMap.needsUpdate = true;
    gradientMap.userData.shared = true;
  }
  return gradientMap;
}

/** Cached toon material. opts may only hold plain values (no textures). */
export function toon(color, opts = {}) {
  const key = 't' + color + JSON.stringify(opts);
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: getGradient(), ...opts });
    m.userData.shared = true;
    cache.set(key, m);
  }
  return m;
}

/** Cached unlit material (glows, sky details). */
export function flat(color, opts = {}) {
  const key = 'f' + color + JSON.stringify(opts);
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, ...opts });
    m.userData.shared = true;
    cache.set(key, m);
  }
  return m;
}

/** Non-cached toon material with a texture (disposed with its zone). */
export function toonMap(map, color = 0xffffff) {
  return new THREE.MeshToonMaterial({ color, map, gradientMap: getGradient() });
}

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Soft "cells" pattern used for floors inside the body. */
export function cellTexture(base, spot, seed = 7) {
  const rand = seeded(seed);
  const tex = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = 14 + rand() * 26;
      // Draw wrapped copies so the texture tiles seamlessly.
      for (const ox of [-w, 0, w]) {
        for (const oy of [-h, 0, h]) {
          g.globalAlpha = 0.35;
          g.fillStyle = spot;
          g.beginPath();
          g.arc(x + ox, y + oy, r, 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 0.5;
          g.beginPath();
          g.arc(x + ox - r * 0.2, y + oy - r * 0.2, r * 0.28, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
    g.globalAlpha = 1;
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** Vertical gradient used as the scene background. */
export function skyTexture(top, bottom) {
  return canvasTexture(4, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

/** Rounded label with Hebrew text (signs, name tags). */
export function labelTexture(text, { bg = '#ff5fa2', fg = '#ffffff', w = 512, h = 160, size = 64 } = {}) {
  return canvasTexture(w, h, (g) => {
    const r = h * 0.3;
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(6, 6, w - 12, h - 12, r);
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.stroke();
    g.fillStyle = fg;
    g.font = `700 ${size}px Rubik, Arial, sans-serif`;
    const fit = (w - 60) / g.measureText(text).width;
    if (fit < 1) g.font = `700 ${Math.floor(size * fit)}px Rubik, Arial, sans-serif`;
    g.direction = 'rtl';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 4);
  });
}

let blobTex = null;
export function blobShadowTexture() {
  if (!blobTex) {
    blobTex = canvasTexture(64, 64, (g, w, h) => {
      const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grad.addColorStop(0, 'rgba(40,10,40,0.9)');
      grad.addColorStop(0.6, 'rgba(40,10,40,0.45)');
      grad.addColorStop(1, 'rgba(40,10,40,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    });
    blobTex.userData.shared = true;
  }
  return blobTex;
}
