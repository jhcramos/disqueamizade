import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  normalizeAppearance,
  DEFAULT_APPEARANCE,
  appearanceKey,
  readSavedAvatar,
  saveAvatar,
} from "../src/garage/avatarStyle.ts";
import { applyAppearance } from "../src/garage/avatarAppearance.ts";
import { parsePerson, DEMO } from "../src/garage/model.ts";
test("appearance accepts only known options and cannot inject assets or transparency", () => {
  assert.deepEqual(
    normalizeAppearance({
      skin: "url(secret)",
      hair: "__proto__",
      costume: "nude",
      accessory: "external",
    }),
    DEFAULT_APPEARANCE,
  );
  assert.deepEqual(normalizeAppearance(null), DEFAULT_APPEARANCE);
  assert.equal(
    appearanceKey({ hair: "pink", skin: "deep" }),
    appearanceKey({ skin: "deep", hair: "pink" }),
  );
});
test("presence carries the sanitized appearance without changing identity or location", () => {
  const p = parsePerson({
    ...DEMO,
    appearance: { costume: "leaves", skin: "golden", accessory: "crown" },
  });
  assert.equal(p.id, DEMO.id);
  assert.deepEqual(p.position, DEMO.position);
  assert.equal(p.appearance.costume, "leaves");
  assert.equal(p.appearance.skin, "golden");
});
test("leaf costume keeps original opaque clothes and adds leaves on torso", () => {
  const model = new THREE.Group(),
    torso = new THREE.Bone();
  torso.name = "torso";
  model.add(torso);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, 0.25, 0, 0.1, 0.25, 0, 0, 0.3, 0], 3),
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      [0.71875, 0.6, 0.71875, 0.6, 0.71875, 0.6],
      2,
    ),
  );
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  mesh.name = "body-mesh";
  model.add(mesh);
  applyAppearance(model, 0, { ...DEFAULT_APPEARANCE, costume: "leaves" });
  assert.ok(model.children.includes(mesh));
  assert.equal(mesh.material.transparent, false);
  assert.equal(mesh.material.opacity, 1);
  assert.equal(torso.children.length, 13);
  assert.notEqual(mesh.geometry, geometry);
  assert.equal(mesh.geometry.getAttribute("position").count, 3);
  assert.ok(
    Math.abs(mesh.geometry.getAttribute("uv").getX(0) - 0.59375) < 0.0001,
  );
});
test("saved appearance survives reload and malformed storage safely resets", () => {
  const data = new Map();
  globalThis.localStorage = {
    getItem: (key) => data.get(key) || null,
    setItem: (key, value) => data.set(key, value),
  };
  assert.equal(saveAvatar(7, { ...DEFAULT_APPEARANCE, hair: "copper" }), true);
  assert.equal(readSavedAvatar().avatar, 7);
  assert.equal(readSavedAvatar().appearance.hair, "copper");
  data.set("garage-avatar-v1", "{broken");
  assert.equal(readSavedAvatar().avatar, 0);
  delete globalThis.localStorage;
  assert.equal(saveAvatar(0, DEFAULT_APPEARANCE), false);
});

test("changing hair color preserves dark facial details", () => {
  const model = new THREE.Group(),
    geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0.08, 0.51, 0.168, 0.08, 0.69, 0.21], 3),
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute([0.09375, 0.8, 0.09375, 0.8], 2),
  );
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  mesh.name = "head-mesh";
  model.add(mesh);
  applyAppearance(model, 0, { ...DEFAULT_APPEARANCE, hair: "pink" });
  assert.ok(
    Math.abs(mesh.geometry.getAttribute("uv").getX(0) - 0.09375) < 0.00001,
  );
  assert.ok(
    Math.abs(mesh.geometry.getAttribute("uv").getX(1) - 0.59375) < 0.00001,
  );
});

const { OUTFITS, ACCESSORIES, toggleAccessory } = await import(
  "../src/garage/wardrobe.ts"
);
const { createAdultAvatar, animateAdult } = await import(
  "../src/garage/adultAvatar.ts"
);
test("wardrobe contains 21 unique outfits and accessories per collection, including construction", () => {
  for (const catalog of [OUTFITS, ACCESSORIES]) {
    assert.equal(new Set(catalog.map((x) => x.id)).size, 42);
    for (const collection of ["masculine", "feminine"])
      assert.equal(
        catalog.filter((x) => x.collection === collection).length,
        21,
      );
  }
});
test("accessory selection replaces the same slot, toggles off, caps six, and rejects unknown IDs", () => {
  assert.deepEqual(toggleAccessory(["am1", "af11"], "af4"), ["af4", "af11"]);
  assert.deepEqual(toggleAccessory(["am1"], "am1"), []);
  const normalized = normalizeAppearance({
    accessories: ACCESSORIES.map((x) => x.id).concat("https://bad.test"),
  });
  assert.equal(normalized.accessories.length, 6);
  assert.equal(
    new Set(
      normalized.accessories.map(
        (id) => ACCESSORIES.find((a) => a.id === id).slot,
      ),
    ).size,
    6,
  );
});
test("every outfit and accessory builds a bounded opaque adult mannequin for both silhouettes", () => {
  for (const body of ["masculine", "feminine"])
    for (const variant of [
      { outfit: "base" },
      ...OUTFITS.map((o) => ({ outfit: o.id })),
      ...ACCESSORIES.map((a) => ({ outfit: "f19", accessories: [a.id] })),
    ]) {
      const model = createAdultAvatar(6, {
        ...DEFAULT_APPEARANCE,
        body,
        ...variant,
      });
      assert.equal(model.userData.adultProportions, true);
      const bounds = new THREE.Box3().setFromObject(model);
      assert.ok(bounds.max.y > 1.7 && bounds.max.y < 2.5);
      assert.ok(bounds.max.x - bounds.min.x < 1.15);
      model.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          assert.equal(o.material.opacity, 1);
          assert.equal(o.material.transparent, false);
          assert.ok(
            [...o.geometry.attributes.position.array].every(Number.isFinite),
          );
          o.geometry.dispose();
          o.material.dispose();
        }
      });
    }
});
test("walking moves adult limbs and idle resets them", () => {
  const model = createAdultAvatar(0);
  animateAdult(model, true, 0.2);
  assert.notEqual(model.getObjectByName("adult-leg-left").rotation.x, 0);
  for (let i = 0; i < 90; i++) animateAdult(model, false, 0.3 + i / 60);
  assert.ok(
    Math.abs(model.getObjectByName("adult-leg-left").rotation.x) < 0.00001,
  );
});

const { HAIRSTYLES, createHair } = await import("../src/garage/avatarHair.ts");
test("all haircuts build distinct finite geometry; bald is an empty scalp", () => {
  const fingerprints = new Set();
  for (const style of Object.keys(HAIRSTYLES).filter((x) => x !== "auto")) {
    const look = normalizeAppearance({
      ...DEFAULT_APPEARANCE,
      hairstyle: style,
    });
    assert.equal(look.hairstyle, style);
    const h = createHair(style, "#443322");
    if (style === "bald") {
      assert.equal(h.children.length, 0);
      continue;
    }
    const b = new THREE.Box3().setFromObject(h);
    assert.ok(Number.isFinite(b.max.y));
    let vertices = 0;
    h.traverse((o) => {
      if (o instanceof THREE.Mesh)
        vertices += o.geometry.attributes.position.count;
    });
    fingerprints.add(`${vertices}:${b.min.y.toFixed(4)}:${b.max.y.toFixed(4)}`);
  }
  assert.equal(fingerprints.size, Object.keys(HAIRSTYLES).length - 2);
  assert.equal(
    normalizeAppearance({ hairstyle: "url(external)" }).hairstyle,
    "auto",
  );
  assert.equal(normalizeAppearance({}).hairstyle, "auto");
});
test("walking keeps the body vertical in every direction, including transitions to idle", () => {
  const model = createAdultAvatar(0);
  const holder = new THREE.Group();
  holder.add(model);
  for (let i = 0; i < 120; i++) {
    holder.rotation.y = (i / 120) * Math.PI * 2;
    animateAdult(model, i < 90, i / 60, false);
    model.updateWorldMatrix(true, true);
    const up = new THREE.Vector3(0, 1, 0).transformDirection(model.matrixWorld);
    assert.ok(up.distanceTo(new THREE.Vector3(0, 1, 0)) < 0.00001);
  }
});

test("ten presets include five of each silhouette and ten distinct full looks", async () => {
  const { AVATAR_PRESETS, presetAppearance } = await import(
    "../src/garage/avatarPresets.ts"
  );
  assert.equal(AVATAR_PRESETS.length, 10);
  for (const body of ["masculine", "feminine"])
    assert.equal(
      AVATAR_PRESETS.filter((p) => p.appearance.body === body).length,
      5,
    );
  assert.equal(
    new Set(AVATAR_PRESETS.map((p) => appearanceKey(p.appearance))).size,
    10,
  );
  assert.equal(
    AVATAR_PRESETS.filter((p) => p.appearance.hairstyle === "bald").length,
    2,
  );
  const copy = presetAppearance(0);
  copy.accessories.push("af21");
  assert.ok(!presetAppearance(0).accessories.includes("af21"));
});
test("all voluminous hair fits beneath every covered head accessory without changing the saved cut", () => {
  for (const style of Object.keys(HAIRSTYLES))
    for (const hat of ACCESSORIES.filter(
      (a) => a.slot === "head" && !["band", "crown"].includes(a.shape),
    )) {
      const hair = createHair(style, "#443322", 0, hat.shape);
      hair.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        const pos = o.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i),
            y = pos.getY(i),
            z = pos.getZ(i);
          assert.ok(y <= 0.15001, `${style} / ${hat.shape}: crown above hat`);
          assert.ok(
            Math.hypot(x / 0.156, (z + 0.008) / 0.146) <= 1.00001,
            `${style}: wider than hat`,
          );
        }
      });
      assert.equal(hair.userData.style, style === "auto" ? "short" : style);
    }
});
