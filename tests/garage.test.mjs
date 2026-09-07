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
