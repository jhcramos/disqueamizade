import test from "node:test";
import assert from "node:assert/strict";
import { BAR_SEATS, normalizeSeat, seatWinner } from "../src/garage/seats.ts";
import {
  inside,
  planRoute,
  START,
  distance,
  personalSpace,
  parsePerson,
  DEMO,
  sameRoom,
} from "../src/garage/model.ts";
import {
  normalizeAppearance,
  appearanceKey,
  DEFAULT_APPEARANCE,
} from "../src/garage/avatarStyle.ts";
import { createAdultAvatar, animateAdult } from "../src/garage/adultAvatar.ts";
test("bar has three tables of four and three independent counter stools", () => {
  assert.equal(BAR_SEATS.length, 15);
  assert.equal(new Set(BAR_SEATS.map((s) => s.id)).size, 15);
  for (let t = 1; t <= 3; t++)
    assert.equal(
      BAR_SEATS.filter((s) => s.id.startsWith(`table-${t}-`)).length,
      4,
    );
  assert.equal(BAR_SEATS.filter((s) => s.id.startsWith("counter")).length, 3);
});
test("all fifteen seats are reachable and distinct without overlap", () => {
  for (const [i, s] of BAR_SEATS.entries()) {
    assert.ok(inside(s.point, "bar"), s.id);
    assert.ok(planRoute(START, s.point, [], "bar").length, s.id);
    for (const other of BAR_SEATS.slice(i + 1))
      assert.ok(distance(s.point, other.point) >= personalSpace("bar"));
  }
  for (const p of [
    { x: 0.664, y: 0.51 },
    { x: 0.325, y: 0.67 },
    { x: 0.683, y: 0.773 },
  ])
    assert.equal(inside(p, "bar"), false);
});
test("seat claims converge regardless of delivery order, release on leaving, reject invalid seats", () => {
  const a = { id: "a", seat: "table-1-1" },
    b = { id: "b", seat: "table-1-1" };
  assert.equal(seatWinner([a, b], a.seat), "a");
  assert.equal(seatWinner([b, a], a.seat), "a");
  assert.equal(seatWinner([b], a.seat), "b");
  assert.equal(normalizeSeat("table-9-1", "bar"), undefined);
  assert.equal(normalizeSeat(a.seat, "living"), undefined);
  const p = parsePerson({
    ...DEMO,
    room: "bar",
    seat: a.seat,
    position: BAR_SEATS[3].point,
  });
  assert.equal(p.seat, a.seat);
  assert.equal(p.room, "bar");
  assert.equal(sameRoom(p, { ...DEMO, room: "garage" }), false);
});
test("intention is optional, whitelisted, included in presence and does not rebuild geometry", () => {
  assert.equal(normalizeAppearance({}).intention, "hidden");
  assert.equal(
    normalizeAppearance({ intention: "__proto__" }).intention,
    "hidden",
  );
  const look = normalizeAppearance({
    ...DEFAULT_APPEARANCE,
    intention: "dating",
  });
  assert.equal(
    parsePerson({ ...DEMO, appearance: look }).appearance.intention,
    "dating",
  );
  assert.equal(
    appearanceKey(look),
    appearanceKey({ ...look, intention: "hidden" }),
  );
});
test("vinyl sitting bends hips and knees and standing restores pose smoothly", () => {
  const model = createAdultAvatar(2);
  assert.equal(model.userData.style, "vinyl");
  for (let i = 0; i < 90; i++) animateAdult(model, false, i / 60, true);
  assert.ok(
    Math.abs(model.getObjectByName("adult-leg-left").rotation.x + Math.PI / 2) <
      0.001,
  );
  assert.ok(
    Math.abs(
      model.getObjectByName("adult-leg-left-knee").rotation.x - Math.PI / 2,
    ) < 0.001,
  );
  for (let i = 0; i < 90; i++) animateAdult(model, false, i / 60, false);
  assert.ok(
    Math.abs(model.getObjectByName("adult-leg-left-knee").rotation.x) < 0.001,
  );
});
