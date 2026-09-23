import {planPoint,areaById} from '../src/garage3d/areas.ts';
import {toShared} from '../src/garage3d/coordinates.ts';
const point=(room,x,y)=>toShared(planPoint(x,y),room);
const lanes={garage:[[857,671],[957,671],[907,671]],living:[[423,425],[519,425],[471,425]],bar:[[435,544],[530,544],[482,544]]};
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
    point('garage',1200,820),
    point('garage',905,744),
    point('garage',819,650),
    { x: NaN, y: 0.6 },
    { x: 0.5, y: Infinity },
  ])
    assert.equal(inside(p), false);
});
test("movement stops at destination without overshooting or jumping on long frames", () => {
  const goal = point('garage',960,675);
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
  const [a,b,obstacle]=lanes.garage.map(([x,y])=>point('garage',x,y));
  assert.ok(clearPath(a,b,[],'garage'),'the blocking condition is the other body, not a wall');
  assert.deepEqual(safeStep(a, b, 10, [obstacle]), a);
  let current = a;
  for (let i = 0; i < 300; i++) {
    current = safeStep(current, b, 0.05, [obstacle]);
    assert.ok(distance(current, obstacle) >= PERSONAL_SPACE);
  }
  assert.ok(current.x < obstacle.x);
});
test("head-on walkers stop with personal space and can back away", () => {
  const [left,right]=lanes.garage.map(([x,y])=>point('garage',x,y));
  let a={...left},b={...right};
  assert.ok(clearPath(left,right,[],'garage'));
  for (let i = 0; i < 300; i++) {
    a = safeStep(a, right, 0.05, [b]);
    b = safeStep(b, left, 0.05, [a]);
    assert.ok(distance(a, b) >= PERSONAL_SPACE);
  }
  assert.ok(safeStep(a, left, 0.05, [b]).x < a.x);
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
  assert.equal(parsePerson({ ...DEMO, room: "living",position:toShared(areaById("living").arrival,"living") }).room, "living");
});

test("measured entrances and open floor stay walkable in both rooms", () => {
  const floor={garage:[[840,548],[900,600],[960,700]],living:[[469,350],[469,425],[515,482]]};
  for (const room of ["garage", "living"]) for(const [x,y] of floor[room]) {
    const p=point(room,x,y);assert.equal(inside(p,room),true,`${room}: ${x},${y}`);
  }
  assert.equal(inside(point('living',533,364),'living'),false,'the measured living sofa stays blocked');
});

import { planRoute, clearPath } from "../src/garage/model.ts";
test("route goes around another avatar instead of stopping on a direct line", () => {
  for (const room of ["garage", "living"]) {
    const [from,to,other]=lanes[room].map(([x,y])=>point(room,x,y)),obstacles=[other];
    assert.ok(clearPath(from,to,[],room),"direct floor is clear before adding the other avatar");
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
  const from = point('living',424,416),to=point('living',405,305);
  assert.ok(inside(from,'living')&&inside(to,'living'));
  assert.equal(clearPath(from,to,[],'living'),false,'the direct line intersects the sofa');
  const path = planRoute(from, to, [], "living");
  assert.ok(path.length > 1);
  let previous = from;
  for (const next of path) {
    assert.ok(clearPath(previous, next, [], "living"));
    previous = next;
  }
  assert.deepEqual(path.at(-1), to);
  assert.deepEqual(planRoute(from, point('living',405,364), [], 'living'), []);
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

const { approachRadius, personalSpace } = await import(
  "../src/garage/model.ts"
);
test("close conversation approach is reachable while bodies still cannot overlap", () => {
  for (const room of ["garage", "living", "bar"]) {
    const [from,,other]=lanes[room].map(([x,y])=>point(room,x,y)),
      goal = { x: other.x - approachRadius(room), y: other.y };
    assert.ok(inside(from,room)&&inside(goal,room)&&inside(other,room));
    assert.ok(approachRadius(room) <= 0.061);
    assert.ok(approachRadius(room) > personalSpace(room));
    assert.ok(nearby(goal, other));
    assert.ok(planRoute(from, goal, [other], room).length);
    let current = goal;
    for (let i = 0; i < 100; i++) {
      current = safeStep(current, other, 0.016, [other], room);
      assert.ok(distance(current, other) >= personalSpace(room) - 0.00001);
    }
  }
});
