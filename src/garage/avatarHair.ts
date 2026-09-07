import * as T from "three";
export const HAIRSTYLES = {
  auto: "Do modelo",
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
export function createHair(style: HairStyle, color: string, index = 0) {
  const root = new T.Group();
  root.name = "hairstyle";
  const chosen =
    style === "auto"
      ? (["short", "bob", "curls", "medium", "long"] as HairStyle[])[index % 5]
      : style;
  root.userData.style = chosen;
  const mat = new T.MeshStandardMaterial({ color, roughness: 0.52 });
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
      : chosen === "curls"
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
  if (chosen === "ponytail" || chosen === "bun") {
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
