import { createHair } from "./avatarHair.ts";
import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  normalizeAppearance,
  SKIN_COLORS,
  HAIR_COLORS,
  CLOTH_COLORS,
  type Appearance,
} from "./avatarStyle.ts";
import { OUTFITS, ACCESSORIES } from "./wardrobe.ts";
const rainbow = [
  "#cc5554",
  "#df934d",
  "#e5c859",
  "#6e9962",
  "#568ba6",
  "#96699e",
];
/** Vinyl Club: rounded collectible proportions, modular clothes and articulated knees. */
export function createAdultAvatar(index: number, raw?: Appearance): T.Group {
  const look = normalizeAppearance(raw),
    root = new T.Group();
  root.name = "vinyl-avatar";
  const feminine =
    look.body === "feminine" || (look.body === "auto" && index >= 5);
  const skin =
    SKIN_COLORS[look.skin] ||
    ["#dbb18b", "#a77350", "#edc6a2", "#bf8a60", "#704c39"][index % 5];
  const hair =
    HAIR_COLORS[look.hair] ||
    ["#40302a", "#30292b", "#9a683a", "#b98b4c", "#57392f"][index % 5];
  const mats = new Map<string, T.MeshStandardMaterial>();
  const material = (color: string) => {
    if (!mats.has(color))
      mats.set(color, new T.MeshStandardMaterial({ color, roughness: 0.8 }));
    return mats.get(color)!;
  };
  function mesh(
    parent: T.Object3D,
    geometry: T.BufferGeometry,
    color: string,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const m = new T.Mesh(geometry, material(color));
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function ell(
    parent: T.Object3D,
    color: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) {
    const m = mesh(parent, new T.SphereGeometry(1, 16, 12), color, x, y, z);
    m.scale.set(sx, sy, sz);
    return m;
  }
  function box(
    parent: T.Object3D,
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    return mesh(parent, new T.BoxGeometry(w, h, d), color, x, y, z);
  }
  function ring(
    parent: T.Object3D,
    color: string,
    x: number,
    y: number,
    z: number,
    r: number,
    t = 0.008,
  ) {
    return mesh(parent, new T.TorusGeometry(r, t, 6, 24), color, x, y, z);
  }
  function shell(
    parent: T.Object3D,
    color: string,
    points: number[][],
    depth = 0.62,
  ) {
    const m = mesh(
      parent,
      new T.LatheGeometry(
        points.map(([y, r]) => new T.Vector2(r, y)),
        24,
      ),
      color,
    );
    m.scale.z = depth;
    return m;
  }
  function capsule(
    parent: T.Object3D,
    color: string,
    x: number,
    y: number,
    z: number,
    r: number,
    length: number,
  ) {
    return mesh(
      parent,
      new T.CapsuleGeometry(r, Math.max(0.001, length - 2 * r), 5, 12),
      color,
      x,
      y,
      z,
    );
  }
  function leaf(
    parent: T.Object3D,
    x: number,
    y: number,
    z: number,
    size: number,
    rotation = 0,
  ) {
    const shape = new T.Shape();
    shape.moveTo(0, -1);
    shape.bezierCurveTo(-0.85, -0.25, -0.65, 0.7, 0, 1);
    shape.bezierCurveTo(0.7, 0.4, 0.8, -0.4, 0, -1);
    const m = mesh(
      parent,
      new T.ExtrudeGeometry(shape, {
        depth: 0.05,
        bevelEnabled: false,
        curveSegments: 8,
      }),
      "#58834a",
      x,
      y,
      z,
    );
    m.scale.set(size * 0.7, size, size);
    m.rotation.z = rotation;
    box(m, "#88a466", 0, 0, 0.065, 0.035, 1.5, 0.015);
    return m;
  }
  const torso = new T.Group();
  root.add(torso);
  const shoulder = feminine ? 0.205 : 0.24,
    hip = feminine ? 0.185 : 0.17;
  shell(
    torso,
    skin,
    [
      [0.82, 0.115],
      [0.9, hip],
      [1.02, hip * 0.94],
      [1.16, feminine ? 0.13 : 0.16],
      [1.35, shoulder * 0.9],
      [1.44, shoulder],
      [1.48, 0.09],
    ],
    0.65,
  );
  capsule(root, skin, 0, 1.49, 0, 0.059, 0.16);
  const head = new T.Group();
  head.position.y = 1.567;
  root.add(head);
  mesh(head, new RoundedBoxGeometry(0.275, 0.26, 0.235, 4, 0.075), skin);
  ell(head, skin, 0, -0.051, 0.026, 0.105, 0.088, 0.09);
  ell(head, skin, 0, -0.015, 0.113, 0.014, 0.019, 0.02);
  for (const side of [-1, 1]) {
    ell(head, skin, side * 0.124, -0.005, 0, 0.021, 0.035, 0.022);
    ell(head, "#18191b", side * 0.055, 0.016, 0.111, 0.024, 0.027, 0.012);
    box(head, hair, side * 0.055, 0.065, 0.109, 0.046, 0.012, 0.01);
  }
  const smile = mesh(
    head,
    new T.TorusGeometry(0.027, 0.0035, 5, 16, Math.PI),
    "#83534a",
    0,
    -0.054,
    0.102,
  );
  smile.rotation.z = Math.PI;
  head.add(createHair(look.hairstyle, hair, index));
  const legs: T.Group[] = [],
    arms: T.Group[] = [];
  for (const side of [-1, 1]) {
    const leg = new T.Group();
    leg.name = side < 0 ? "adult-leg-left" : "adult-leg-right";
    leg.position.set(side * 0.091, 0.88, 0);
    root.add(leg);
    legs.push(leg);
    capsule(leg, skin, 0, -0.2, 0, 0.072, 0.43);
    capsule(leg, skin, 0, -0.58, 0, 0.051, 0.4);
    ell(leg, skin, 0, -0.81, 0.043, 0.054, 0.041, 0.1);
    const arm = new T.Group();
    arm.name = side < 0 ? "adult-arm-left" : "adult-arm-right";
    arm.position.set(side * (shoulder + 0.015), 1.405, 0);
    arm.rotation.z = side * 0.08;
    root.add(arm);
    arms.push(arm);
    capsule(arm, skin, 0, -0.15, 0, 0.047, 0.32);
    capsule(arm, skin, 0, -0.43, 0.01, 0.036, 0.3);
    ell(arm, skin, 0, -0.607, 0.015, 0.038, 0.063, 0.026);
  }
  const outfit = OUTFITS.find(
    (o) =>
      o.id ===
      (look.outfit === "leaves"
        ? feminine
          ? "f20"
          : "m20"
        : look.outfit === "base"
          ? feminine
            ? "f1"
            : "m1"
          : look.outfit),
  );
  if (outfit) {
    const top = CLOTH_COLORS[look.shirt] || outfit.color,
      bottom = CLOTH_COLORS[look.pants] || outfit.secondary;
    const short = ["crop", "bikini", "leaf-bikini"].includes(outfit.top);
    if (!["leaf", "leaf-bikini", "bikini"].includes(outfit.top)) {
      shell(
        torso,
        top,
        [
          [short ? 1.22 : 0.97, short ? 0.15 : hip + 0.017],
          [short ? 1.25 : 1.16, 0.17],
          [1.35, shoulder + 0.012],
          [1.445, shoulder + 0.012],
          [1.468, 0.073],
        ],
        0.68,
      );
      if (!["tank", "crop", "overall"].includes(outfit.top))
        for (const arm of arms) {
          const length = ["long", "shirt", "jacket", "hoodie"].includes(
            outfit.top,
          )
            ? 0.56
            : 0.2;
          capsule(arm, top, 0, -length / 2 + 0.015, 0, 0.058, length);
          if (outfit.top === "puff")
            ell(arm, top, 0, -0.06, 0, 0.082, 0.1, 0.075);
        }
    }
    if (outfit.top === "bikini" || outfit.top === "leaf-bikini") {
      for (const side of [-1, 1]) {
        ell(torso, top, side * 0.088, 1.327, 0.128, 0.081, 0.058, 0.018);
        box(torso, top, side * 0.1, 1.413, 0.111, 0.012, 0.13, 0.014);
        if (outfit.top === "leaf-bikini")
          leaf(torso, side * 0.085, 1.33, 0.15, 0.074, side * -0.5);
      }
      const band = ring(torso, top, 0, 1.29, 0, 0.188, 0.009);
      band.rotation.x = Math.PI / 2;
      band.scale.y = 0.66;
    }
    if (outfit.bottom === "leaf" || outfit.bottom === "brief") {
      // Opaque swimsuit support wraps the hips; leaf ornament is small and frontal.
      shell(
        torso,
        bottom,
        [
          [0.855, 0.125],
          [0.915, hip + 0.01],
          [0.955, hip + 0.015],
        ],
        0.69,
      );
      if (outfit.bottom === "leaf") leaf(torso, 0, 0.884, 0.139, 0.112, 0.12);
    } else if (["skirt", "midi", "maxi", "flare"].includes(outfit.bottom)) {
      const y =
        outfit.bottom === "maxi" ? 0.14 : outfit.bottom === "midi" ? 0.4 : 0.64;
      shell(
        torso,
        bottom,
        [
          [y, outfit.bottom === "flare" ? 0.32 : 0.245],
          [0.92, hip + 0.035],
          [1.015, hip + 0.012],
        ],
        0.73,
      );
    } else {
      shell(
        torso,
        bottom,
        [
          [0.855, 0.13],
          [0.93, hip + 0.018],
          [1.015, hip + 0.013],
        ],
        0.7,
      );
      for (const leg of legs) {
        const shorts = outfit.bottom === "shorts";
        capsule(
          leg,
          bottom,
          0,
          shorts ? -0.105 : -0.205,
          0,
          outfit.bottom === "leggings" ? 0.074 : 0.085,
          shorts ? 0.25 : 0.46,
        );
        if (!shorts)
          capsule(
            leg,
            bottom,
            0,
            -0.58,
            0.002,
            outfit.bottom === "leggings" ? 0.054 : 0.067,
            0.4,
          );
        if (outfit.bottom === "cargo")
          box(leg, bottom, 0.074, -0.21, 0.009, 0.034, 0.12, 0.11);
      }
    }
    if (["jacket", "shirt", "overall"].includes(outfit.top)) {
      for (const side of [-1, 1]) {
        const lapel = box(
          torso,
          outfit.top === "overall" ? "#cfb17b" : "#e7ddcb",
          side * 0.07,
          1.34,
          0.157,
          0.04,
          0.19,
          0.012,
        );
        lapel.rotation.z = side * -0.25;
      }
      for (let i = 0; i < 4; i++)
        ell(torso, "#d2b788", 0, 1.12 + i * 0.066, 0.145, 0.008, 0.008, 0.006);
    }
    if (outfit.detail === "hood")
      ell(torso, top, 0, 1.435, -0.1, 0.12, 0.075, 0.075);
    if (outfit.detail === "pockets")
      for (const side of [-1, 1])
        box(torso, bottom, side * 0.11, 1.22, 0.145, 0.065, 0.07, 0.012);
    if (outfit.detail === "zip")
      box(torso, "#b5ab95", 0, 1.23, 0.157, 0.012, 0.35, 0.01);
    if (outfit.detail === "belt")
      box(torso, "#b89a66", 0, 1.015, 0.142, 0.26, 0.025, 0.015);
    if (outfit.detail === "straps")
      for (const side of [-1, 1])
        box(torso, bottom, side * 0.108, 1.335, 0.147, 0.04, 0.26, 0.022);
    if (["pride", "blocks", "stripes", "plaid"].includes(outfit.detail)) {
      const colors =
        outfit.detail === "pride"
          ? rainbow
          : outfit.detail === "blocks"
            ? ["#598e97", "#dba05a", "#794f79"]
            : ["#e4d8bb", "#e4d8bb"];
      colors.forEach((color, i) =>
        box(torso, color, 0, 1.18 + i * 0.035, 0.161, 0.3, 0.031, 0.012),
      );
    }
    if (outfit.detail === "number") {
      box(torso, "#ead8b7", -0.025, 1.27, 0.161, 0.02, 0.12, 0.015);
      box(torso, "#ead8b7", 0.025, 1.31, 0.161, 0.055, 0.02, 0.015);
      box(torso, "#ead8b7", 0.043, 1.26, 0.161, 0.019, 0.11, 0.015);
    }
    if (outfit.detail === "fringe")
      for (let i = 0; i < 9; i++)
        box(torso, top, (i - 4) * 0.033, 1.18, 0.147, 0.012, 0.13, 0.015);
    if (outfit.detail === "bow" || outfit.detail === "tie")
      neck(outfit.detail, "#594251");
  }
  function neck(shape: string, color: string) {
    if (shape === "tie") {
      const m = box(torso, color, 0, 1.32, 0.174, 0.035, 0.22, 0.019);
      m.rotation.z = 0.05;
    } else if (shape === "bow") {
      for (const side of [-1, 1])
        ell(torso, color, side * 0.033, 1.425, 0.132, 0.038, 0.023, 0.017);
    } else if (shape === "scarf") {
      capsule(torso, color, 0, 1.48, 0.005, 0.078, 0.04);
      box(torso, color, 0.07, 1.34, 0.157, 0.05, 0.23, 0.027);
    } else {
      for (let i = 0; i < 14; i++) {
        const a = (i / 13) * Math.PI;
        ell(
          torso,
          color,
          Math.cos(a) * 0.115,
          1.445 - Math.sin(a) * 0.115,
          0.12,
          shape === "pearls" ? 0.014 : 0.008,
          0.012,
          0.009,
        );
      }
    }
  }
  const acc = look.accessories
    .map((id) => ACCESSORIES.find((a) => a.id === id)!)
    .filter(Boolean);
  const footwear = acc.find((a) => a.slot === "feet");
  const shoe = footwear?.shape || outfit?.shoes || "bare",
    shoeColor =
      footwear?.color ||
      (["formal", "boots"].includes(shoe) ? "#4a3a33" : "#e7dfcd");
  if (shoe !== "bare")
    for (const leg of legs) {
      ell(leg, shoeColor, 0, -0.806, 0.055, 0.065, 0.047, 0.119);
      box(leg, "#ddd2bc", 0, -0.843, 0.055, 0.126, 0.018, 0.205);
      if (["boots", "high"].includes(shoe))
        capsule(
          leg,
          shoeColor,
          0,
          -0.728,
          0.004,
          0.065,
          shoe === "boots" ? 0.21 : 0.14,
        );
      if (shoe === "heels")
        box(leg, shoeColor, 0, -0.845, -0.032, 0.038, 0.066, 0.035);
      if (shoe === "sandals") {
        ell(leg, skin, 0, -0.79, 0.055, 0.052, 0.033, 0.1);
        box(leg, shoeColor, 0, -0.779, 0.07, 0.116, 0.022, 0.045);
      }
      if (["sneakers", "high"].includes(shoe))
        for (let i = 0; i < 3; i++)
          box(
            leg,
            "#fcf0d8",
            0,
            -0.768,
            0.045 + i * 0.025,
            0.054,
            0.009,
            0.009,
          );
    }
  for (const a of acc) {
    const c = a.color;
    if (a.slot === "neck") neck(a.shape, c);
    if (a.slot === "hands")
      for (const arm of arms) {
        ell(arm, c, 0, -0.606, 0.015, 0.042, 0.066, 0.031);
        capsule(
          arm,
          c,
          0,
          a.shape === "long" ? -0.48 : -0.565,
          0.01,
          0.041,
          a.shape === "long" ? 0.28 : 0.085,
        );
      }
    if (a.slot === "face") {
      for (const side of [-1, 1]) {
        const r = ring(head, c, side * 0.051, 0.022, 0.121, 0.041, 0.006);
        if (a.shape === "cat") r.scale.set(1.2, 0.78, 1);
        if (a.shape === "aviator") r.scale.y = 1.15;
        if (a.shape === "dark")
          ell(head, "#393b42", side * 0.051, 0.022, 0.121, 0.036, 0.034, 0.006);
      }
      box(head, c, 0, 0.025, 0.124, 0.025, 0.006, 0.01);
    }
    if (a.slot === "head") {
      if (a.shape === "crown")
        for (let i = 0; i < 10; i++) {
          const t = (i / 10) * Math.PI * 2;
          leaf(head, Math.cos(t) * 0.13, 0.1, Math.sin(t) * 0.123, 0.046, t);
        }
      else if (a.shape === "band") {
        const band = ring(head, c, 0, 0.022, 0, 0.133, 0.015);
        band.rotation.x = Math.PI / 2;
        band.scale.y = 0.94;
      } else {
        const h = mesh(
          head,
          new T.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
          c,
          0,
          0.075,
          -0.002,
        );
        h.scale.set(a.shape === "beret" ? 0.164 : 0.143, 0.11, 0.142);
        if (a.shape !== "beanie" && a.shape !== "beret") {
          const brim = mesh(
            head,
            new T.CylinderGeometry(
              a.shape === "straw" ? 0.23 : 0.18,
              a.shape === "straw" ? 0.23 : 0.18,
              0.012,
              24,
            ),
            c,
            0,
            0.083,
            0,
          );
          brim.scale.z = 0.91;
        }
        if (a.shape === "cap") ell(head, c, 0, 0.08, 0.125, 0.12, 0.009, 0.09);
      }
    }
    if (a.slot === "ears")
      for (const side of [-1, 1]) {
        if (a.shape === "hoops")
          ring(head, c, side * 0.14, -0.063, 0.01, 0.031, 0.005);
        else {
          const star = new T.Shape();
          for (let i = 0; i < 10; i++) {
            const t = (i * Math.PI) / 5,
              r = i % 2 ? 0.014 : 0.032;
            i
              ? star.lineTo(Math.sin(t) * r, Math.cos(t) * r)
              : star.moveTo(Math.sin(t) * r, Math.cos(t) * r);
          }
          star.closePath();
          mesh(
            head,
            new T.ExtrudeGeometry(star, { depth: 0.008, bevelEnabled: false }),
            c,
            side * 0.14,
            -0.063,
            0.015,
          );
        }
      }
    if (a.slot === "wrist")
      rainbow.forEach((c, i) => {
        const m = mesh(
          arms[0],
          new T.CylinderGeometry(0.042, 0.042, 0.008, 12),
          c,
          0,
          -0.54 + i * 0.008,
          0.01,
        );
        m.name = "pride-bracelet";
      });
    if (a.slot === "badge") {
      const colors =
        a.shape === "trans"
          ? ["#77bfce", "#d891ac", "#f3eee1", "#d891ac", "#77bfce"]
          : ["#e5c754", "#eee6d5", "#a17cb1", "#3d3941"];
      colors.forEach((c, i) =>
        box(torso, c, -0.127, 1.365 + i * 0.012, 0.159, 0.056, 0.012, 0.016),
      );
    }
    if (a.slot === "bag") {
      const strap = box(torso, c, 0, 1.25, 0.18, 0.018, 0.54, 0.018);
      strap.rotation.z = -0.55;
      box(torso, c, 0.19, 1.01, 0.13, 0.17, 0.15, 0.085);
      box(torso, "#d0ad69", 0.19, 1.03, 0.178, 0.027, 0.024, 0.012);
    }
  }
  // Compact the body and enlarge the expressive head without distorting accessories.
  head.scale.setScalar(2.35);
  head.position.y = 1.56;
  torso.scale.set(1.03, 0.85, 1.1);
  torso.position.y = 0.03;
  const neckMesh = root.children.find((o) => o instanceof T.Mesh);
  if (neckMesh) neckMesh.position.y = 1.3;
  for (const arm of arms) {
    arm.position.y = 1.25;
    arm.position.x *= 1.13;
    arm.scale.set(1.32, 0.86, 1.3);
  }
  for (const leg of legs) {
    const knee = new T.Group();
    knee.name = leg.name + "-knee";
    knee.position.y = -0.4;
    for (const child of [...leg.children])
      if (child.position.y < -0.4) {
        if (child.position.y < -0.75)
          child.scale.multiply(new T.Vector3(1.2, 1.12, 1.2));
        child.position.y += 0.4;
        knee.add(child);
      }
    leg.add(knee);
    leg.position.set(leg.position.x * 1.4, 0.79, 0);
    leg.scale.set(1.38, 0.87, 1.4);
    // A covered joint bridges the seam under pants while allowing a soft knee bend.
    ell(
      leg,
      outfit?.bottom === "shorts"
        ? skin
        : CLOTH_COLORS[look.pants] || outfit?.secondary || skin,
      0,
      -0.4,
      0,
      0.066,
      0.075,
      0.066,
    );
  }
  root.userData.adultProportions = true;
  root.userData.style = "vinyl";
  return root;
}
export function animateAdult(
  model: T.Group,
  moving: boolean,
  time: number,
  seated = false,
  dt = 0.016,
) {
  const blend = 1 - Math.exp(-Math.max(0, dt) * 14),
    phase = time * 8;
  for (const [name, sign] of [
    ["adult-leg-left", 1],
    ["adult-leg-right", -1],
    ["adult-arm-left", -1],
    ["adult-arm-right", 1],
  ] as const) {
    const joint = model.getObjectByName(name);
    if (!joint) continue;
    const leg = name.includes("leg"),
      wave = Math.sin(phase + (sign === 1 ? 0 : Math.PI));
    const target = seated
      ? leg
        ? -Math.PI / 2
        : -0.45
      : moving
        ? wave * (leg ? 0.4 : 0.25)
        : 0;
    joint.rotation.x = T.MathUtils.lerp(joint.rotation.x, target, blend);
    const knee = joint.getObjectByName(name + "-knee");
    if (knee)
      knee.rotation.x = T.MathUtils.lerp(
        knee.rotation.x,
        seated ? Math.PI / 2 : moving ? Math.max(0, -wave) * 0.65 : 0,
        blend,
      );
  }
  // Keep the body's up axis fixed. Only the articulated limbs move.
  model.rotation.x = 0;
  model.rotation.z = 0;
}
