import * as THREE from 'three';
import { toon, toonMap, labelTexture, skyTexture, blobShadowTexture } from './Materials.js';

// Building blocks for zones. Each helper creates the visible mesh and,
// when needed, the matching collider, so what you see is what you bump into.

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 28);
const unitSphere = new THREE.SphereGeometry(1, 20, 14);
const lowSphere = new THREE.SphereGeometry(1, 10, 7); // for leaves and small, far things
for (const g of [unitBox, unitCyl, unitSphere, lowSphere]) g.userData.shared = true;
export const GEO = { box: unitBox, cyl: unitCyl, sphere: unitSphere, lowSphere };

function finish(ctx, mesh, { cast = true, receive = true, parent, dynamic = false } = {}) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  mesh.userData.bake = !dynamic; // see Bake.js; pass dynamic:true for meshes that move
  (parent || ctx.root).add(mesh);
  return mesh;
}

/** Box standing on y (its bottom). */
export function box(ctx, o) {
  const { x = 0, y = 0, z = 0, w = 1, h = 1, d = 1, rotY = 0, color = 0xffffff, mat, collide = true, tag, camera } = o;
  const mesh = new THREE.Mesh(unitBox, mat || toon(color));
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y + h / 2, z);
  mesh.rotation.y = rotY;
  finish(ctx, mesh, o);
  const collider = collide ? ctx.collision.addBox({ x, z, w, d, rotY, minY: y, maxY: y + h, tag, camera }) : null;
  return { mesh, collider };
}

/** Upright cylinder standing on y. */
export function cylinder(ctx, o) {
  const { x = 0, y = 0, z = 0, r = 0.5, h = 1, color = 0xffffff, mat, collide = true, tag } = o;
  const mesh = new THREE.Mesh(unitCyl, mat || toon(color));
  mesh.scale.set(r, h, r);
  mesh.position.set(x, y + h / 2, z);
  finish(ctx, mesh, o);
  const collider = collide ? ctx.collision.addCylinder({ x, z, r, minY: y, maxY: y + h, tag }) : null;
  return { mesh, collider };
}

/** Floor slab whose top is at y=top, with a tiling texture. */
export function floor(ctx, { x0, x1, z0, z1, top = 0, thickness = 1, texture, tile = 6, color = 0xffffff }) {
  const w = x1 - x0, d = z1 - z0;
  const map = texture.clone();
  map.repeat.set(w / tile, d / tile);
  map.needsUpdate = true;
  return box(ctx, { x: (x0 + x1) / 2, z: (z0 + z1) / 2, y: top - thickness, w, h: thickness, d, mat: toonMap(map, color), cast: false });
}

/** Wedge mesh for a ramp: top goes from y0 at local -z to y1 at local +z. */
function wedgeGeometry(w, d, y0, y1, bottom) {
  const g = new THREE.BoxGeometry(w, 1, d);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i);
    const top = y0 + ((z + d / 2) / d) * (y1 - y0);
    p.setY(i, p.getY(i) > 0 ? top : bottom);
  }
  g.computeVertexNormals();
  return g;
}

export function ramp(ctx, o) {
  const { x, z, w, d, rotY = 0, y0, y1, bottom = 0, color = 0xffffff } = o;
  const mesh = new THREE.Mesh(wedgeGeometry(w, d, y0, y1, bottom), toon(color));
  mesh.position.set(x, 0, z);
  mesh.rotation.y = rotY;
  finish(ctx, mesh, o);
  const collider = ctx.collision.addRamp({ x, z, w, d, rotY, y0, y1, minY: bottom });
  return { mesh, collider };
}

/** Stairs climbing along local +z from (x,z). */
export function stairs(ctx, { x, z, rotY = 0, steps = 6, stepH = 0.3, depth = 0.6, w = 3, colors = [0xffd23f, 0xffb347] }) {
  const s = Math.sin(rotY), c = Math.cos(rotY);
  for (let i = 0; i < steps; i++) {
    const along = (i + 0.5) * depth;
    box(ctx, { x: x + s * along, z: z + c * along, y: 0, w, h: (i + 1) * stepH, d: depth, rotY, color: colors[i % colors.length] });
  }
}

/** Ladder whose climbing face looks toward local -z; (x,z) is in front of the wall. */
export function ladder(ctx, { x, z, y = 0, rotY = 0, height, w = 1.2, color = 0xffb347 }) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;
  const mat = toon(color);
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(unitBox, mat);
    rail.scale.set(0.12, height + 0.5, 0.12);
    rail.position.set(side * (w / 2 - 0.06), (height + 0.5) / 2, 0.22);
    rail.castShadow = true;
    rail.userData.bake = true;
    group.add(rail);
  }
  for (let y = 0.35; y < height + 0.2; y += 0.38) {
    const rung = new THREE.Mesh(unitBox, mat);
    rung.scale.set(w - 0.1, 0.08, 0.1);
    rung.position.set(0, y, 0.22);
    rung.userData.bake = true;
    group.add(rung);
  }
  ctx.root.add(group);
  return ctx.collision.addClimb({ x, z, w, d: 0.6, rotY, minY: y, maxY: y + height });
}

/** Sign post with a Hebrew label. */
export function sign(ctx, { x, z, rotY = 0, text, bg = '#ff5fa2', y = 0 }) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;
  const post = new THREE.Mesh(unitCyl, toon(0x8a5a44));
  post.scale.set(0.08, 1.9, 0.08);
  post.position.y = 0.95;
  post.castShadow = true;
  post.userData.bake = true;
  group.add(post);
  const tex = labelTexture(text, { bg });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.69), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  board.position.set(0, 1.75, 0.09);
  group.add(board);
  const back = new THREE.Mesh(unitBox, toon(0x8a5a44));
  back.scale.set(2.1, 0.6, 0.12);
  back.position.set(0, 1.75, 0);
  back.userData.bake = true;
  group.add(back);
  ctx.root.add(group);
  ctx.collision.addCylinder({ x, z, r: 0.15, minY: y, maxY: y + 1.9 });
  return group;
}

/** Sky, fog and lights. Returns { sun, hemi }. */
export function environment(ctx, { skyTop, skyBottom, fogNear = 45, fogFar = 120, hemiSky = 0xffffff, hemiGround = 0xffc2d6, hemi = 1.6, sun = 2.4 }) {
  ctx.scene.background = skyTexture(skyTop, skyBottom);
  ctx.scene.fog = new THREE.Fog(skyBottom, fogNear, fogFar);
  const hemiLight = new THREE.HemisphereLight(hemiSky, hemiGround, hemi);
  const sunLight = new THREE.DirectionalLight(0xffffff, sun);
  sunLight.position.set(12, 22, 8);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  const cam = sunLight.shadow.camera;
  cam.left = cam.bottom = -24;
  cam.right = cam.top = 24;
  cam.near = 1;
  cam.far = 70;
  sunLight.shadow.bias = -0.0006;
  sunLight.shadow.normalBias = 0.04;
  ctx.root.add(hemiLight, sunLight, sunLight.target);
  return { sun: sunLight, hemi: hemiLight };
}

/** Soft round shadow drawn under characters (cheap on every device). */
export function blobShadow() {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 1;
  return mesh;
}

/** Floating red blood cells drifting in the sky (one draw call). */
export function floatingCells(ctx, { count = 36, radiusMin = 22, radiusMax = 50, yMin = 9, yMax = 24, color = 0xff5d6c, seed = 3, size = [0.8, 2.4], flat = 0.36 }) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const mesh = new THREE.InstancedMesh(unitSphere, toon(color), count);
  const items = [];
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const r = radiusMin + rand() * (radiusMax - radiusMin);
    items.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: yMin + rand() * (yMax - yMin), size: size[0] + rand() * (size[1] - size[0]), phase: rand() * 6, tilt: rand() * 1.2 });
  }
  ctx.root.add(mesh);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const update = (t) => {
    for (let i = 0; i < count; i++) {
      const it = items[i];
      p.set(it.x, it.y + Math.sin(t * 0.6 + it.phase) * 0.6, it.z);
      e.set(it.tilt + Math.sin(t * 0.3 + it.phase) * 0.2, t * 0.15 + it.phase, 0);
      q.setFromEuler(e);
      sc.set(it.size, it.size * flat, it.size);
      mesh.setMatrixAt(i, m.compose(p, q, sc));
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  update(0);
  return { mesh, update };
}
