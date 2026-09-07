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
test("wardrobe contains exactly 20 unique outfits and accessories per collection", () => {
  for (const catalog of [OUTFITS, ACCESSORIES]) {
    assert.equal(new Set(catalog.map((x) => x.id)).size, 40);
    for (const collection of ["masculine", "feminine"])
      assert.equal(
        catalog.filter((x) => x.collection === collection).length,
        20,
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
      assert.ok(bounds.max.y > 1.7 && bounds.max.y < 2.1);
      assert.ok(bounds.max.x - bounds.min.x < 1);
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
