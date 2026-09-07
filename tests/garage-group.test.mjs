import test from "node:test";
import assert from "node:assert/strict";
import { validGroup, canAddMember } from "../src/garage/groupRules.ts";
const group = { id: "call", host: "a", members: ["a", "b"], revision: 1 };
test("group membership is unique, bounded, and controlled by its first member", () => {
  assert.ok(validGroup(group));
  assert.ok(validGroup({ ...group, members: ["a", "b", "c", "d"] }));
  for (const members of [
    ["a"],
    ["a", "b", "c", "d", "e"],
    ["a", "b", "b"],
    ["b", "a"],
    ["a", null],
  ])
    assert.equal(validGroup({ ...group, members }), false);
  for (const revision of [0, -1, NaN, Infinity, 1.1])
    assert.equal(validGroup({ ...group, revision }), false);
  assert.equal(validGroup(null), false);
});
test("a pending invitation reserves the remaining place and a fifth guest cannot be invited", () => {
  assert.equal(canAddMember(null, false), true);
  assert.equal(canAddMember(group, true), false);
  assert.equal(
    canAddMember({ ...group, members: ["a", "b", "c"] }, false),
    true,
  );
  assert.equal(
    canAddMember({ ...group, members: ["a", "b", "c", "d"] }, false),
    false,
  );
});
