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
  const mat = new T.MeshStandardMaterial({ color, roughness: 0.65 });
  function ell(
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) {
    const m = new T.Mesh(new T.SphereGeometry(1, 14, 10), mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    root.add(m);
    return m;
  }
  function lock(points: number[][], radius: number) {
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(...(p as [number, number, number]))),
    );
    const m = new T.Mesh(new T.TubeGeometry(curve, 14, radius, 7, false), mat);
    root.add(m);
    return m;
  }
  const cap = new T.Mesh(
    new T.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    mat,
  );
  cap.position.set(0, 0.076, -0.006);
  cap.scale.set(0.141, chosen === "shaved" ? 0.083 : 0.115, 0.129);
  root.add(cap);
  // Back shell leaves the eyes, cheeks and ears unobstructed.
  ell(0, 0.033, -0.072, 0.128, 0.111, 0.064);
  if (chosen === "shaved") return root;
  if (chosen === "short" || chosen === "medium")
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 0.048;
      lock(
        [
          [x - 0.025, 0.145, 0.06],
          [x - 0.02, 0.185, 0.045],
          [x + 0.025, 0.181, 0.077],
          [x + 0.045, 0.115, 0.108],
        ],
        chosen === "short" ? 0.028 : 0.038,
      );
    }
  if (chosen === "bob" || chosen === "long" || chosen === "medium") {
    const length = chosen === "long" ? 0.3 : chosen === "bob" ? 0.13 : 0.17;
    for (const side of [-1, 1])
      for (let i = 0; i < 3; i++)
        lock(
          [
            [side * (0.078 + i * 0.02), 0.145, -0.025],
            [side * (0.132 + i * 0.009), 0.05, -0.035],
            [side * (0.14 + i * 0.012), -length * 0.55, -0.045],
            [side * (0.11 + i * 0.021), -length, -0.018],
          ],
          0.027,
        );
    for (let i = 0; i < 5; i++)
      lock(
        [
          [(i - 2) * 0.044, 0.1, -0.1],
          [(i - 2) * 0.054, -0.04, -0.12],
          [(i - 2) * 0.052, -length, -0.095],
        ],
        0.032,
      );
    const fringe = ell(-0.041, 0.13, 0.092, 0.093, 0.047, 0.051);
    fringe.rotation.z = 0.32;
  }
  if (chosen === "curls") {
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 9; i++) {
        const a = (i * Math.PI * 2) / 9;
        ell(
          Math.cos(a) * (0.105 - row * 0.025),
          0.095 + row * 0.047,
          Math.sin(a) * 0.095 - 0.013,
          0.041,
          0.043,
          0.039,
        );
      }
  }
  if (chosen === "spiky" || chosen === "punk") {
    const count = chosen === "punk" ? 7 : 9;
    for (let i = 0; i < count; i++) {
      const m = new T.Mesh(
        new T.ConeGeometry(
          chosen === "punk" ? 0.031 : 0.037,
          chosen === "punk" ? 0.14 : 0.1,
          6,
        ),
        mat,
      );
      m.position.set(
        chosen === "punk" ? 0 : Math.cos(i * 2.4) * 0.095,
        0.2 + (chosen === "punk" ? 0 : Math.sin(i) * 0.016),
        chosen === "punk" ? (i - 3) * 0.036 : Math.sin(i * 2.4) * 0.075,
      );
      m.rotation.z = chosen === "punk" ? 0 : -m.position.x * 3;
      root.add(m);
    }
  }
  if (chosen === "ponytail") {
    ell(0, 0.135, -0.132, 0.049, 0.044, 0.038);
    lock(
      [
        [0, 0.15, -0.12],
        [0, 0.095, -0.2],
        [0.015, -0.06, -0.21],
        [0.035, -0.19, -0.18],
      ],
      0.045,
    );
  }
  if (chosen === "bun") {
    ell(0, 0.19, -0.08, 0.073, 0.073, 0.064);
    ell(-0.065, 0.11, 0.081, 0.075, 0.04, 0.037);
  }
  return root;
}
