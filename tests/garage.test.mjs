import test from "node:test";
import assert from "node:assert/strict";
import {
  inside,
  nearby,
  step,
  parsePerson,
  START,
  DEMO,
} from "../src/garage/model.ts";
test("spawn and guide must be on walkable floor so peers can discover them", () => {
  assert.equal(inside(START), true);
  assert.equal(inside(DEMO.position), true);
  assert.ok(parsePerson({ ...DEMO, position: START }));
});
test("walls, furniture perimeter and malformed positions cannot be movement targets", () => {
  for (const p of [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 0.1, y: 0.5 },
    { x: NaN, y: 0.6 },
    { x: 0.5, y: Infinity },
  ])
    assert.equal(inside(p), false);
});
test("movement stops at destination without overshooting or jumping on long frames", () => {
  const goal = { x: 0.6, y: 0.6 };
  const next = step(START, goal, 0.05);
  assert.ok(next.x > START.x && next.x < goal.x);
  assert.deepEqual(step(goal, goal, 0.05), goal);
  assert.deepEqual(step(START, goal, 100), goal);
  assert.deepEqual(step(START, goal, -1), START);
});
test("invitation proximity separates near and distant participants", () => {
  assert.equal(nearby(START, START), true);
  assert.equal(nearby({ x: 0.3, y: 0.6 }, { x: 0.79, y: 0.75 }), false);
});
test("untrusted presence has bounded names avatars and finite walkable coordinates", () => {
  assert.equal(parsePerson(null), null);
  assert.equal(parsePerson({ ...DEMO, position: { x: "0.5", y: 0.6 } }), null);
  assert.equal(parsePerson({ ...DEMO, avatar: 99 }).avatar, 0);
  assert.equal(parsePerson({ ...DEMO, name: "a".repeat(100) }).name.length, 24);
});

import { AnimationClip, NumberKeyframeTrack } from "three";
import { completeClip } from "../src/garage/animation.ts";
test("idle restores sparse leg channels after a walking animation", () => {
  const rest = new AnimationClip("static", 1, [
    new NumberKeyframeTrack("leg-left.scale", [0], [1]),
    new NumberKeyframeTrack("head.scale", [0], [1]),
  ]);
  const idle = new AnimationClip("idle", 2, [
    new NumberKeyframeTrack("head.scale", [0, 2], [0.9, 1]),
  ]);
  const result = completeClip([rest, idle], "idle");
  assert.equal(result.tracks.length, 2);
  assert.equal(
    result.tracks.find((t) => t.name === "head.scale"),
    idle.tracks[0],
  );
  assert.equal(completeClip([rest], "absent"), undefined);
});

import {
  safeStep,
  distance,
  PERSONAL_SPACE,
  freeSpawn,
  sameRoom,
} from "../src/garage/model.ts";
test("swept collision prevents walking through someone even on a long frame", () => {
  const a = { x: 0.45, y: 0.65 },
    b = { x: 0.74, y: 0.65 },
    obstacle = { x: 0.6, y: 0.65 };
  assert.deepEqual(safeStep(a, b, 10, [obstacle]), a);
  let current = a;
  for (let i = 0; i < 300; i++) {
    current = safeStep(current, b, 0.05, [obstacle]);
    assert.ok(distance(current, obstacle) >= PERSONAL_SPACE);
  }
  assert.ok(current.x < obstacle.x);
});
test("head-on walkers stop with personal space and can back away", () => {
  let a = { x: 0.45, y: 0.65 },
    b = { x: 0.74, y: 0.65 };
  for (let i = 0; i < 300; i++) {
    a = safeStep(a, { x: 0.74, y: 0.65 }, 0.05, [b]);
    b = safeStep(b, { x: 0.45, y: 0.65 }, 0.05, [a]);
    assert.ok(distance(a, b) >= PERSONAL_SPACE);
  }
  assert.ok(safeStep(a, { x: 0.45, y: 0.65 }, 0.05, [b]).x < a.x);
});
test("arrivals choose free floor space and report a full floor", () => {
  const positions = [];
  for (let i = 0; i < 6; i++) {
    const p = freeSpawn(positions);
    assert.ok(p);
    assert.ok(inside(p));
    assert.ok(positions.every((q) => distance(p, q) >= PERSONAL_SPACE));
    positions.push(p);
  }
  while (freeSpawn(positions)) positions.push(freeSpawn(positions));
  assert.equal(freeSpawn(positions), null);
});
test("separate rooms cannot initiate proximity conversations", () => {
  assert.equal(
    sameRoom({ ...DEMO, room: "living" }, { ...DEMO, room: "garage" }),
    false,
  );
  assert.equal(sameRoom(DEMO, { ...DEMO, room: "garage" }), true);
  assert.equal(parsePerson({ ...DEMO, room: "living" }).room, "living");
});

test("visible side, back and front floor is walkable in both rooms", () => {
  for (const room of ["garage", "living"]) {
    for (const point of [
      { x: 0.28, y: 0.6 },
      { x: 0.6, y: 0.34 },
      { x: 0.65, y: 0.93 },
    ])
      assert.equal(
        inside(point, room),
        true,
        `${room}: ${JSON.stringify(point)}`,
      );
  }
  assert.equal(
    inside({ x: 0.76, y: 0.4 }, "living"),
    false,
    "sofa stays blocked",
  );
});

import { planRoute, clearPath } from "../src/garage/model.ts";
test("route goes around another avatar instead of stopping on a direct line", () => {
  const from = { x: 0.34, y: 0.6 },
    to = { x: 0.7, y: 0.6 },
    obstacles = [{ x: 0.52, y: 0.6 }];
  for (const room of ["garage", "living"]) {
    const path = planRoute(from, to, obstacles, room);
    assert.ok(path.length > 1);
    let previous = from;
    for (const next of path) {
      assert.ok(clearPath(previous, next, obstacles, room));
      previous = next;
    }
    assert.deepEqual(path.at(-1), to);
  }
});
test("route around living room furniture stays on the floor", () => {
  const from = { x: 0.6, y: 0.34 },
    to = { x: 0.84, y: 0.61 };
  const path = planRoute(from, to, [], "living");
  assert.ok(path.length > 1);
  let previous = from;
  for (const next of path) {
    assert.ok(clearPath(previous, next, [], "living"));
    previous = next;
  }
  assert.deepEqual(path.at(-1), to);
  assert.deepEqual(planRoute(from, { x: 0.76, y: 0.4 }, [], "living"), []);
});
test("room arrivals can accommodate twelve initial visitors without overlap", () => {
  for (const room of ["garage", "living"]) {
    const people = [];
    for (let i = 0; i < 12; i++) {
      const p = freeSpawn(people, START, room);
      assert.ok(p);
      people.push(p);
    }
  }
});
