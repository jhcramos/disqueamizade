import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePlay,
  mergePlay,
  playPosition,
  throwTarget,
  BALL_START,
} from "../src/garage/play.ts";
import { inside, clearPath } from "../src/garage/model.ts";
const now = Date.now();
const action = {
  id: "event-a",
  actor: "visitor-a",
  name: "Alice",
  room: "garage",
  kind: "ball",
  at: now,
  on: true,
  from: { x: 0.58, y: 0.7 },
  to: { x: 0.7, y: 0.75 },
};
test("cosmetic events reject other rooms, future timestamps and malformed coordinates", () => {
  assert.ok(parsePlay(action, "garage", now));
  for (const invalid of [
    { ...action, room: "living" },
    { ...action, kind: "camera" },
    { ...action, at: now + 3000 },
    { ...action, from: { x: Infinity, y: 0.7 } },
    { ...action, on: "yes" },
  ])
    assert.equal(parsePlay(invalid, "garage", now), null);
  assert.equal(
    parsePlay({ ...action, name: "x".repeat(100) }, "garage", now).name.length,
    24,
  );
});
test("concurrent events converge regardless of delivery order", () => {
  const b = { ...action, id: "event-b", to: { x: 0.65, y: 0.8 } };
  assert.deepEqual(
    mergePlay(mergePlay({}, action), b),
    mergePlay(mergePlay({}, b), action),
  );
  assert.equal(mergePlay({ ball: b }, { ...action, at: now - 1 }).ball, b);
});
test("light and ball state merge independently", () => {
  const lights = { ...action, id: "lights", kind: "lights", on: false };
  const merged = mergePlay(mergePlay({}, action), lights);
  assert.equal(merged.ball, action);
  assert.equal(merged.lights, lights);
});
test("late visitors see settled objects rather than replaying old throws", () => {
  assert.deepEqual(playPosition(action, BALL_START, now - 10), action.from);
  assert.deepEqual(playPosition(action, BALL_START, now + 2000), action.to);
  const middle = playPosition(action, BALL_START, now + 500);
  assert.ok(middle.x > action.from.x && middle.x < action.to.x);
});
test("throws stay on floor in both rooms including near furniture", () => {
  for (const room of ["garage", "living"])
    for (const from of [
      { x: 0.58, y: 0.7 },
      { x: 0.6, y: 0.34 },
      { x: 0.7, y: 0.82 },
    ]) {
      const target = throwTarget(from, { x: from.x - 0.12, y: from.y }, room);
      assert.ok(inside(target, room));
      assert.ok(clearPath(from, target, [], room));
    }
});
