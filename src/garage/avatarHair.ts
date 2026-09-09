import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as T from "three";
export const HAIRSTYLES = {
  auto: "Do modelo",
  blockquiff: "Topete Bloco Pop",
  blockcurls: "Cachos Bloco Pop",
  bald: "Careca",
  afro: "Afro volumoso",
  twinbuns: "Coques espaciais",
  liberty: "Punk explosivo",
  shaved: "Raspado",
  short: "Curto",
  medium: "Médio ondulado",
  long: "Longo",
  bob: "Chanel",
  curls: "Cacheado",
  spiky: "Arrepiado",
  punk: "Punk / moicano",
  ponytail: "Rabo de cavalo",
  bun: "Coque",
};
export type HairStyle = keyof typeof HAIRSTYLES;
export function createHair(
  style: HairStyle,
  color: string,
  index = 0,
  headwear?: string,
) {
  const root = new T.Group();
  root.name = "hairstyle";
  const chosen =
    style === "auto"
      ? (["short", "bob", "curls", "medium", "long"] as HairStyle[])[index % 5]
      : style;
  root.userData.style = chosen;
  if (chosen === "bald") return root;
  const covered = !!headwear && !["band", "crown"].includes(headwear);
  root.userData.fitted = covered;
  const mat = new T.MeshStandardMaterial({ color, roughness: 0.52 });
  if (chosen === "blockquiff" || chosen === "blockcurls") {
    const add = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      tilt = 0,
    ) => {
      const geometry = new RoundedBoxGeometry(
        w,
        h,
        d,
        1,
        Math.min(w, h, d) * 0.18,
      );
      if (covered) {
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          let px = pos.getX(i) + x,
            py = pos.getY(i) + y,
            pz = pos.getZ(i) + z;
          const radius = Math.hypot(px / 0.156, (pz + 0.008) / 0.146);
          if (radius > 1) {
            px /= radius;
            pz = (pz + 0.008) / radius - 0.008;
          }
          py = Math.min(
            py,
            0.065 +
              0.085 * Math.sqrt(Math.max(0, 1 - Math.min(radius, 1) ** 2)),
          );
          pos.setXYZ(i, px, py, pz);
        }
        geometry.computeVertexNormals();
      }
      const m = new T.Mesh(geometry, mat);
      if (!covered) {
        m.position.set(x, y, z);
        m.rotation.z = tilt;
      }
      root.add(m);
    };
    add(0, 0.106, -0.034, 0.29, 0.085, 0.235);
    if (chosen === "blockquiff") {
      for (let i = 0; i < 5; i++)
        add(
          (i - 2) * 0.059,
          0.168 + Math.sin(i * 0.7) * 0.032,
          0.053,
          0.073,
          0.096,
          0.125,
          (i - 2) * -0.13,
        );
      for (const side of [-1, 1])
        add(side * 0.138, 0.038, -0.02, 0.046, 0.1, 0.16);
    } else {
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          if (row > 0 && Math.cos(a) > 0.6) continue;
          add(
            Math.sin(a) * 0.154,
            0.15 - row * 0.083,
            Math.cos(a) * 0.139 - 0.025,
            0.087,
            0.093,
            0.084,
            ((i % 3) - 1) * 0.17,
          );
        }
      for (let i = 0; i < 3; i++)
        add((i - 1) * 0.072, 0.197, 0, 0.095, 0.08, 0.13, (i - 1) * 0.12);
    }
    return root;
  }
  // A continuous sculpted shell replaces separate tubes, beads and cones.
  function surface(
    fn: (u: number, v: number) => T.Vector3,
    cols = 48,
    rows = 24,
  ) {
    const pos: number[] = [],
      indices: number[] = [];
    for (let y = 0; y <= rows; y++)
      for (let x = 0; x <= cols; x++) {
        const p = fn(x / cols, y / rows);
        // Tuck the crown beneath the hat while keeping the lower lengths.
        if (covered) {
          const radius = Math.hypot(p.x / 0.156, (p.z + 0.008) / 0.146);
          if (radius > 1) {
            p.x /= radius;
            p.z = (p.z + 0.008) / radius - 0.008;
          }
          p.y = Math.min(
            p.y,
            0.065 +
              0.085 * Math.sqrt(Math.max(0, 1 - Math.min(radius, 1) ** 2)),
          );
        }
        pos.push(p.x, p.y, p.z);
      }
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const a = y * (cols + 1) + x,
          b = a + cols + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    const m = new T.Mesh(g, mat);
    m.material.side = T.DoubleSide;
    root.add(m);
    return m;
  }
  const signed = (n: number, p: number) => Math.sign(n) * Math.abs(n) ** p;
  const height =
    chosen === "shaved"
      ? 0.125
      : ["curls", "afro"].includes(chosen)
        ? 0.185
        : chosen === "short"
          ? 0.145
          : 0.14;
  surface((u, v) => {
    const a = u * Math.PI * 2,
      edge = 1.22 + (0.9 * (1 - Math.cos(a))) / 2 + 0.2 * Math.abs(Math.sin(a));
    const t = v * edge,
      sin = Math.sin(t),
      ripple =
        chosen === "shaved"
          ? 0
          : chosen === "curls"
            ? 0.007 * Math.sin(a * 14 + t * 4) * Math.sin(t * 12)
            : 0.0018 * Math.sin(a * 18 + t * 4);
    let x = (0.16 + ripple) * signed(Math.sin(a), 0.82) * sin;
    let z = (0.151 + ripple) * signed(Math.cos(a), 0.8) * sin - 0.008;
    let y = 0.052 + height * Math.cos(t);
    if (chosen === "short" || chosen === "medium") {
      y += 0.028 * Math.sin(t) * Math.max(0, Math.cos(a - 0.8));
      x += 0.009 * Math.sin(t) * Math.cos(t);
    }
    if (chosen === "afro") {
      const puff = 1.28 + 0.035 * Math.sin(a * 17 + t * 8) * Math.sin(t * 19);
      x *= puff;
      z = (z + 0.008) * puff - 0.008;
      y = 0.05 + (y - 0.05) * 1.26;
    }
    if (chosen === "liberty")
      y += 0.15 * Math.max(0, Math.sin(a * 5 + t * 3)) ** 8 * Math.sin(t);
    if (chosen === "spiky")
      y += 0.064 * Math.max(0, Math.sin(a * 7 + t * 5)) ** 5 * Math.sin(t);
    if (chosen === "punk")
      y += 0.12 * Math.exp(-((x / 0.029) ** 2)) * Math.sin(t);
    return new T.Vector3(x, y, z);
  });
  if (["long", "bob", "medium"].includes(chosen)) {
    const bottom =
      chosen === "long" ? -0.28 : chosen === "bob" ? -0.112 : -0.18;
    surface((u, v) => {
      const a = 0.69 + u * (Math.PI * 2 - 1.38),
        wave = Math.sin(v * Math.PI * 2.3 + a * 2),
        bend = chosen === "bob" ? -0.012 * v * v : 0.014 * wave * v;
      const rx = 0.151 + bend + 0.007 * Math.sin(a * 17 + v * 2),
        rz = 0.137 + 0.004 * Math.sin(a * 17 + v * 3);
      return new T.Vector3(
        rx * signed(Math.sin(a), 0.75),
        0.1 + (bottom - 0.1) * v + 0.007 * Math.sin(a * 3) * v,
        rz * signed(Math.cos(a), 0.8) - 0.021 - 0.007 * v,
      );
    });
  }
  if (chosen === "twinbuns" && !covered) {
    for (const side of [-1, 1])
      surface(
        (u, v) => {
          const a = u * Math.PI * 2,
            t = v * Math.PI;
          const r = 0.077 * (1 + 0.025 * Math.sin(a * 12 + t * 5));
          return new T.Vector3(
            side * 0.128 + r * Math.cos(a) * Math.sin(t),
            0.19 + r * Math.cos(t),
            -0.04 + r * Math.sin(a) * Math.sin(t),
          );
        },
        32,
        20,
      );
  }
  if ((chosen === "ponytail" || chosen === "bun") && !covered) {
    surface(
      (u, v) => {
        const a = u * Math.PI * 2,
          t = v * Math.PI;
        if (chosen === "bun") {
          const r = 0.066 * (1 + 0.035 * Math.sin(a * 10 + t * 5));
          return new T.Vector3(
            r * Math.cos(a) * Math.sin(t),
            0.178 + r * Math.cos(t),
            -0.1 + r * Math.sin(a) * Math.sin(t),
          );
        }
        const r = 0.055 * Math.sin(t) * (1 - 0.3 * v),
          groove = 1 + 0.025 * Math.sin(a * 12 + v * 4);
        return new T.Vector3(
          0.028 * Math.sin(v * 3) + r * Math.cos(a) * groove,
          0.16 - 0.35 * v,
          -0.125 - 0.085 * Math.sin(v * Math.PI) + r * Math.sin(a) * groove,
        );
      },
      32,
      24,
    );
  }
  return root;
}
