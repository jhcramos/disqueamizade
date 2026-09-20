import test from 'node:test';
import assert from 'node:assert/strict';
import { CONVERSATION_SPOTS, normalizeGathering } from '../src/garage/gatherings.ts';
import { inside } from '../src/garage/model.ts';

test('every gathering starts on walkable ground in its environment', () => {
  for (const [room, spots] of Object.entries(CONVERSATION_SPOTS)) {
    for (const spot of spots) assert.ok(inside(spot.point, room), spot.id);
  }
});
test('presence rejects invalid, cross-room and over-capacity advertisements', () => {
  const good = { spot: 'living-sofa', open: true, count: 3 };
  assert.deepEqual(normalizeGathering(good, 'living'), good);
  assert.equal(normalizeGathering(good, 'garage'), undefined);
  for (const count of [0, 5, 1.5, '2', NaN]) {
    assert.equal(normalizeGathering({ ...good, count }, 'living'), undefined);
  }
  assert.equal(normalizeGathering({ ...good, open: 'yes' }, 'living'), undefined);
  assert.equal(normalizeGathering(null, 'living'), undefined);
});
