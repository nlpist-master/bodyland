import * as THREE from 'three';

// Merges static meshes that share a material into a few big meshes, so a
// zone with hundreds of props costs only a handful of draw calls.
// Meshes are grouped per material and per 32x32 area, which keeps
// frustum culling useful. Only meshes flagged userData.bake are touched.

const CHUNK = 32;

function merge(list) {
  let vCount = 0;
  let iCount = 0;
  for (const { geo } of list) {
    vCount += geo.attributes.position.count;
    iCount += geo.index ? geo.index.count : geo.attributes.position.count;
  }
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const uv = new Float32Array(vCount * 2);
  const index = vCount > 65535 ? new Uint32Array(iCount) : new Uint16Array(iCount);
  const v = new THREE.Vector3();
  const nm = new THREE.Matrix3();
  let vo = 0;
  let io = 0;
  for (const { geo, matrix } of list) {
    nm.getNormalMatrix(matrix);
    const p = geo.attributes.position, n = geo.attributes.normal, t = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const k = (vo + i) * 3;
      v.fromBufferAttribute(p, i).applyMatrix4(matrix);
      pos[k] = v.x;
      pos[k + 1] = v.y;
      pos[k + 2] = v.z;
      v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
      nor[k] = v.x;
      nor[k + 1] = v.y;
      nor[k + 2] = v.z;
      if (t) {
        uv[(vo + i) * 2] = t.getX(i);
        uv[(vo + i) * 2 + 1] = t.getY(i);
      }
    }
    if (geo.index) {
      const src = geo.index.array;
      for (let i = 0; i < src.length; i++) index[io + i] = src[i] + vo;
      io += src.length;
    } else {
      for (let i = 0; i < p.count; i++) index[io + i] = vo + i;
      io += p.count;
    }
    vo += p.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  g.computeBoundingSphere();
  return g;
}

export function bakeStatic(root) {
  root.updateMatrixWorld(true);
  const groups = new Map();
  const victims = [];
  const c = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !o.userData.bake || Array.isArray(o.material)) return;
    const g = o.geometry;
    if (!g.attributes.normal) return;
    c.setFromMatrixPosition(o.matrixWorld);
    const key = `${o.material.uuid}|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}|${Math.floor(c.x / CHUNK)},${Math.floor(c.z / CHUNK)}`;
    let list = groups.get(key);
    if (!list) groups.set(key, (list = []));
    list.push({ mesh: o, geo: g, matrix: o.matrixWorld.clone() });
  });
  let merged = 0;
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const first = list[0].mesh;
    const mesh = new THREE.Mesh(merge(list), first.material);
    mesh.castShadow = first.castShadow;
    mesh.receiveShadow = first.receiveShadow;
    mesh.name = 'baked';
    // The merged mesh lives in world space, so it goes straight under the root.
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    mesh.applyMatrix4(inv);
    root.add(mesh);
    for (const it of list) victims.push(it.mesh);
    merged += list.length;
  }
  for (const m of victims) {
    m.parent.remove(m);
    if (!m.geometry.userData.shared) m.geometry.dispose();
  }
  return merged;
}

/**
 * Merges the mesh children of every group in a character rig, per material,
 * in the group's own space, so limbs still animate but cost fewer draw calls.
 * Meshes in `skip` (animated on their own) are left alone.
 */
export function compactRig(root, skip = new Set()) {
  const groups = [];
  root.traverse((o) => {
    if (!o.isMesh) groups.push(o);
  });
  for (const parent of groups) {
    const byMat = new Map();
    for (const child of parent.children) {
      if (!child.isMesh || skip.has(child) || Array.isArray(child.material)) continue;
      child.updateMatrix();
      let list = byMat.get(child.material);
      if (!list) byMat.set(child.material, (list = []));
      list.push({ mesh: child, geo: child.geometry, matrix: child.matrix.clone() });
    }
    for (const [mat, list] of byMat) {
      if (list.length < 2) continue;
      const mesh = new THREE.Mesh(merge(list), mat);
      mesh.castShadow = list[0].mesh.castShadow;
      mesh.receiveShadow = list[0].mesh.receiveShadow;
      parent.add(mesh);
      for (const it of list) parent.remove(it.mesh);
    }
  }
}
