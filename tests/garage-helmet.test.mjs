import test from "node:test";
import assert from "node:assert/strict";
import { safeHelmetPose } from "../src/garage/helmetCoverage.ts";
const pose = {
  cx: 320,
  cy: 160,
  faceW: 120,
  faceH: 150,
  roll: 0,
  yaw: 0,
  box: { x: 260, y: 100, w: 120, h: 150 },
};
test("helmet accepts a visible centered face and blocks profile, edge, tiny and invalid poses", () => {
  assert.equal(safeHelmetPose(pose, 640, 360), true);
  for (const patch of [
    { yaw: 0.7 },
    { roll: 1.3 },
    { faceW: 20 },
    { faceH: 30 },
    { cx: NaN },
    { box: { x: -1, y: 30, w: 120, h: 150 } },
    { box: { x: 540, y: 30, w: 120, h: 150 } },
  ])
    assert.equal(safeHelmetPose({ ...pose, ...patch }, 640, 360), false);
});
