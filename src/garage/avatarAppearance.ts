import * as THREE from "three";
import {
  normalizeAppearance,
  SKIN_COLORS,
  HAIR_COLORS,
  CLOTH_COLORS,
  type Appearance,
} from "./avatarStyle.ts";
const SKIN_U = [
  0.84375, 0.96875, 0.71875, 0.96875, 0.96875, 0.84375, 0.96875, 0.96875,
  0.96875, 0.96875,
];
const HAIR_U = [
  0.09375, 0.71875, 0.21875, 0.71875, 0.09375, 0.09375, 0.71875, 0.71875,
  0.71875, 0.84375,
];
// Recolor the existing clothed mesh, preserving its skeleton, shading and face.
export function applyAppearance(
  model: THREE.Object3D,
  index: number,
  raw?: Appearance,
) {
  const look = normalizeAppearance(raw);
  model.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.geometry = o.geometry.clone();
    const uv = o.geometry.getAttribute("uv"),
      pos = o.geometry.getAttribute("position");
    if (!uv || !pos) return;
    const colors = new Float32Array(pos.count * 3),
      head = o.name.includes("head");
    for (let i = 0; i < pos.count; i++) {
      const u = uv.getX(i),
        v = uv.getY(i),
        skin = v > 0.75 && Math.abs(u - SKIN_U[index]) < 0.006;
      let hex = "";
      if (skin) hex = SKIN_COLORS[look.skin];
      else if (
        head &&
        v > 0.75 &&
        Math.abs(u - HAIR_U[index]) < 0.006 &&
        (pos.getY(i) > 0.635 ||
          pos.getY(i) < 0.4 ||
          pos.getZ(i) < 0.15 ||
          pos.getZ(i) > 0.19 ||
          Math.abs(pos.getX(i)) > 0.16)
      )
        hex = HAIR_COLORS[look.hair];
      else if (!head && pos.getY(i) > 0.06) {
        hex =
          look.costume === "leaves"
            ? pos.getY(i) > 0.19
              ? "#54854a"
              : "#3e6a3a"
            : CLOTH_COLORS[pos.getY(i) > 0.19 ? look.shirt : look.pants];
      }
      const color = new THREE.Color(hex || "#ffffff");
      if (hex) {
        color.multiplyScalar(v > 0.75 ? 1 - Math.max(0, v - 0.775) * 1.2 : 1);
        uv.setXY(i, 0.59375, 0.775);
      }
      color.toArray(colors, i * 3);
    }
    o.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const recolor = (m: THREE.Material) => {
      const copy = m.clone() as THREE.MeshStandardMaterial;
      copy.vertexColors = true;
      return copy;
    };
    o.material = Array.isArray(o.material)
      ? o.material.map(recolor)
      : recolor(o.material);
  });
  const head = model.getObjectByName("head"),
    torso = model.getObjectByName("torso");
  function leaf(x: number, y: number, z: number, rotation = 0) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.11);
    shape.bezierCurveTo(0.09, 0.025, 0.065, -0.075, 0, -0.12);
    shape.bezierCurveTo(-0.065, -0.075, -0.09, 0.025, 0, 0.11);
    const mesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.007,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.003,
        bevelThickness: 0.003,
        curveSegments: 5,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x57834b,
        roughness: 0.95,
        side: THREE.DoubleSide,
      }),
    );
    mesh.position.set(x, y, z);
    mesh.rotation.z = rotation;
    return mesh;
  }
  if (look.costume === "leaves" && torso) {
    // The opaque original top and trousers remain underneath these leaf layers.
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5,
        l = leaf(
          Math.sin(a) * 0.12,
          0.025,
          Math.cos(a) * 0.115,
          0.12 * Math.sin(a),
        );
      l.rotation.y = a;
      torso.add(l);
    }
    for (let i = 0; i < 3; i++)
      torso.add(leaf((i - 1) * 0.064, 0.13, 0.13, (i - 1) * -0.35));
  }
  if (look.accessory === "crown" && head) {
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5,
        l = leaf(Math.sin(a) * 0.16, 0.365, Math.cos(a) * 0.16 - 0.03, a * 0.2);
      l.scale.setScalar(0.58);
      l.rotation.y = a;
      head.add(l);
    }
  }
  if (look.accessory === "glasses" && head) {
    const frame = new THREE.MeshStandardMaterial({
      color: 0x574635,
      metalness: 0.3,
      roughness: 0.5,
    });
    for (const x of [-0.078, 0.078]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.052, 0.008, 6, 16),
        frame,
      );
      ring.position.set(x, 0.165, 0.175);
      head.add(ring);
    }
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.058, 0.011, 0.012),
      frame,
    );
    bridge.position.set(0, 0.17, 0.175);
    head.add(bridge);
  }
}
