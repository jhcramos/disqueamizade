import * as T from 'three';
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WebGLNodesHandler } from 'three/addons/tsl/WebGLNodesHandler.js';
import { attribute, float, mix, positionLocal, sin } from 'three/tsl';
import { HAIR_COLORS, SKIN_COLORS, normalizeAppearance, type Appearance } from '../garage/avatarStyle';

export const avatarTslEnabled = import.meta.env.VITE_ENABLE_AVATAR_TSL !== 'false';

type Surface = 'skin' | 'hair' | 'eye' | 'cloth' | 'shoe';
type Entry = { material: MeshPhysicalNodeMaterial; owners: number; key: string; scope: AvatarMaterialScope };

// Node-material uniform state belongs to one WebGL context. Never share this
// scope across renderers, even though colors and appearances may be identical.
export class AvatarMaterialScope { readonly materials = new Map<string, Entry>(); }

// Color is a vertex attribute: visitors share five surface shaders regardless of
// their palette. A material per visitor would exhaust WebGL uniform bindings.
const pooled = new WeakMap<T.Material, Entry>();
const ownership = new WeakMap<T.Object3D, Set<Entry>>();
const installed = new WeakMap<T.WebGLRenderer, AvatarMaterialScope>();

export function installAvatarNodeMaterials(renderer: T.WebGLRenderer) {
  const existing = installed.get(renderer);
  if (existing) return existing;
  if (avatarTslEnabled) renderer.setNodesHandler(new WebGLNodesHandler());
  const scope = new AvatarMaterialScope();
  installed.set(renderer, scope);
  return scope;
}

function ancestryHas(object: T.Object3D, pattern: RegExp): boolean {
  for (let node: T.Object3D | null = object; node; node = node.parent) {
    if (pattern.test(node.name)) return true;
  }
  return false;
}

function materialFor(surface: Surface, original: T.MeshStandardMaterial, scope: AvatarMaterialScope): Entry {
  const pool = scope.materials;
  const key = `${surface}:${original.side}:${original.opacity}:${original.transparent}:${original.metalness}:${original.depthWrite}`;
  const cached = pool.get(key);
  if (cached) return cached;
  const material = new MeshPhysicalNodeMaterial();
  material.name = `avatar-tsl-${surface}`;
  material.color.set(0xffffff);
  material.side = original.side;
  material.transparent = original.transparent;
  material.opacity = original.opacity;
  material.metalness = original.metalness;
  material.depthWrite = original.depthWrite;
  material.colorNode = attribute('color', 'vec3');
  if (surface === 'skin') {
    material.roughnessNode = float(.72);
    material.specularIntensity = .32;
  } else if (surface === 'hair') {
    material.roughnessNode = mix(float(.38), float(.49), sin(positionLocal.y.mul(30)).mul(.5).add(.5));
    material.clearcoat = .18;
    material.clearcoatRoughness = .42;
  } else if (surface === 'eye') {
    material.roughnessNode = float(.16);
    material.clearcoat = .65;
    material.clearcoatRoughness = .12;
  } else if (surface === 'shoe') {
    material.roughnessNode = float(.57);
  } else {
    const weave = sin(positionLocal.x.mul(160)).mul(sin(positionLocal.y.mul(160))).mul(.5).add(.5);
    material.roughnessNode = mix(float(.78), float(.9), weave);
    material.sheen = .35;
    material.sheenColor.set('#e3d3c2');
    material.sheenRoughness = .85;
  }
  const entry = { material, owners: 0, key, scope };
  pool.set(key, entry);
  pooled.set(material, entry);
  return entry;
}

/** Merge only anonymous static siblings. Named rig and expression hooks stay intact. */
function batchAvatarMeshes(root: T.Group) {
  const parents: T.Object3D[] = [];
  root.traverse(object => { if (object.children.length > 1) parents.push(object); });
  const removedGeometry = new Set<T.BufferGeometry>();
  for (const parent of parents) {
    const batches = new Map<string, T.Mesh[]>();
    for (const child of parent.children) {
      if (!(child instanceof T.Mesh) || child.name || child.children.length || !child.visible ||
          child instanceof T.SkinnedMesh || Array.isArray(child.material) || !pooled.has(child.material) ||
          Object.keys(child.userData).length || Object.keys(child.geometry.morphAttributes).length) continue;
      const attributes = Object.keys(child.geometry.attributes).map(name => { const a = child.geometry.getAttribute(name); return `${name}:${a.itemSize}:${a.normalized}`; }).sort().join(',');
      const key = `${child.material.uuid}:${child.castShadow}:${child.receiveShadow}:${child.renderOrder}:${attributes}`;
      const batch = batches.get(key) ?? [];
      batch.push(child); batches.set(key, batch);
    }
    for (const children of batches.values()) {
      if (children.length < 2) continue;
      const geometries = children.map(child => {
        child.updateMatrix();
        const geometry = child.geometry.clone().applyMatrix4(child.matrix);
        if (!geometry.index) geometry.setIndex(Array.from({ length: geometry.getAttribute('position').count }, (_, i) => i));
        return geometry;
      });
      const geometry = mergeGeometries(geometries, false);
      geometries.forEach(g => g.dispose());
      if (!geometry) continue;
      const first = children[0], combined = new T.Mesh(geometry, first.material);
      combined.castShadow = first.castShadow; combined.receiveShadow = first.receiveShadow;
      combined.renderOrder = first.renderOrder;
      for (const child of children) { parent.remove(child); removedGeometry.add(child.geometry); }
      parent.add(combined);
    }
  }
  const remaining = new Set<T.BufferGeometry>();
  root.traverse(object => { if (object instanceof T.Mesh) remaining.add(object.geometry); });
  removedGeometry.forEach(geometry => { if (!remaining.has(geometry)) geometry.dispose(); });
}

/** Apply only to a newly built avatar in a renderer with the TSL adapter installed. */
export function applyAvatarMaterials(root: T.Group, raw?: Appearance, avatarIndex = 0, scope = new AvatarMaterialScope()) {
  if (!avatarTslEnabled || ownership.has(root)) return;
  const look = normalizeAppearance(raw);
  const skin = new T.Color(SKIN_COLORS[look.skin] || ['#dbb18b', '#a77350', '#edc6a2', '#bf8a60', '#704c39'][avatarIndex % 5]);
  const hair = new T.Color(HAIR_COLORS[look.hair] || ['#40302a', '#30292b', '#9a683a', '#b98b4c', '#57392f'][avatarIndex % 5]);
  const originals = new Set<T.Material>(), retained = new Set<T.Material>(), entries = new Set<Entry>();
  root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    const original = object.material;
    // The avatar builder uses one plain material per mesh. Keep unsupported
    // textured/multi-material additions intact instead of corrupting their UVs.
    if (Array.isArray(original) || !(original instanceof T.MeshStandardMaterial) || original.map || original.alphaMap) {
      (Array.isArray(original) ? original : [original]).forEach(material => retained.add(material));
      return;
    }
    originals.add(original);
    const surface: Surface = ancestryHas(object, /^eye-/) ? 'eye'
      : ancestryHas(object, /^hairstyle$/) || original.color.equals(hair) ? 'hair'
      : original.color.equals(skin) ? 'skin'
      : ancestryHas(object, /^avatar-shoe$/) ? 'shoe' : 'cloth';
    const positions = object.geometry.getAttribute('position');
    const colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) original.color.toArray(colors, i * 3);
    object.geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
    const entry = materialFor(surface, original, scope);
    if (!entries.has(entry)) { entry.owners++; entries.add(entry); }
    object.material = entry.material;
    // A consistent shadow variant also keeps the adapter's shader/buffer pool bounded.
    object.receiveShadow = true;
  });
  ownership.set(root, entries);
  batchAvatarMeshes(root);
  originals.forEach(material => { if (!retained.has(material)) material.dispose(); });
}

/** Handles a model or a container of models, releasing pooled materials once. */
export function disposeAvatarObject(root: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
  root.traverse(object => {
    const entries = ownership.get(object);
    if (entries) {
      ownership.delete(object);
      for (const entry of entries) {
        entry.owners--;
        if (entry.owners === 0) {
          entry.scope.materials.delete(entry.key);
          entry.material.dispose();
        }
      }
    }
    if (!(object instanceof T.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!pooled.has(material)) materials.add(material);
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}
