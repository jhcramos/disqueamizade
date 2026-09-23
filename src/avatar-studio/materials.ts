import * as T from 'three';
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import { attribute, float, mix, positionLocal, sin } from 'three/tsl';
import { HAIR_COLORS, SKIN_COLORS, type Appearance } from '../garage/avatarStyle';

type Surface = 'skin' | 'hair' | 'eye' | 'cloth' | 'shoe';

function ancestryHas(object: T.Object3D, pattern: RegExp): boolean {
  for (let node: T.Object3D | null = object; node; node = node.parent) {
    if (pattern.test(node.name)) return true;
  }
  return false;
}

/** Experimental materials only. The source avatar geometry and palette are preserved. */
export function applyStudioMaterials(root: T.Group, look: Appearance) {
  const skin = new T.Color(SKIN_COLORS[look.skin] || '#bf8757');
  const hair = new T.Color(HAIR_COLORS[look.hair] || '#292526');
  const originals = new Set<T.Material>();
  const variants = new Map<string, MeshPhysicalNodeMaterial>();
  root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    const convert = (original: T.Material): T.Material => {
      if (!(original instanceof T.MeshStandardMaterial)) return original;
      originals.add(original);
      const surface: Surface = ancestryHas(object, /^eye-/) ? 'eye'
        : ancestryHas(object, /^hairstyle$/) || original.color.equals(hair) ? 'hair'
        : original.color.equals(skin) ? 'skin'
        : ancestryHas(object, /^avatar-shoe$/) ? 'shoe' : 'cloth';
      // One shared material per surface avoids exhausting WebGL uniform bindings.
      // Store each mesh's original linear color on its vertices instead.
      const geometry = object.geometry;
      const positions = geometry.getAttribute('position');
      const colors = new Float32Array(positions.count * 3);
      for (let i = 0; i < positions.count; i++) original.color.toArray(colors, i * 3);
      geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
      const key = `${surface}:${original.side}:${original.opacity}`;
      const cached = variants.get(key);
      if (cached) return cached;
      const material = new MeshPhysicalNodeMaterial();
      material.name = `studio-${surface}`;
      material.color.set(0xffffff);
      material.side = original.side;
      material.transparent = original.transparent;
      material.opacity = original.opacity;
      material.metalness = original.metalness;
      material.colorNode = attribute('color', 'vec3');
      if (surface === 'skin') {
        material.roughnessNode = float(.72);
        material.specularIntensity = .32;
      } else if (surface === 'hair') {
        // Broad restrained highlights define the existing sculpted blocks.
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
        // Texture-free weave changes roughness subtly, without noisy color stripes.
        const weave = sin(positionLocal.x.mul(160)).mul(sin(positionLocal.y.mul(160))).mul(.5).add(.5);
        material.roughnessNode = mix(float(.78), float(.9), weave);
        material.sheen = .35;
        material.sheenColor.set('#e3d3c2');
        material.sheenRoughness = .85;
      }
      variants.set(key, material);
      return material;
    };
    object.material = Array.isArray(object.material) ? object.material.map(convert) : convert(object.material);
  });
  originals.forEach(material => material.dispose());
}

export function disposeStudioObject(root: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>();
  const materials = new Set<T.Material>();
  root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}
