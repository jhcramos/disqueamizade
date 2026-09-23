import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, parseLife, routinePoints, ITEMS, BED, BOWL, PLANT, bedFits, approach } from '../src/garage3d/residents/model.ts';
import { houseWalkable, houseRoute } from '../src/garage3d/layout.ts';
import { HOUSE_AREAS, areaById, POOL } from '../src/garage3d/areas.ts';

test('residents spawn on valid floors and all routine destinations are mutually reachable', () => {
  const state = createLife(0);
  assert.ok(parseLife(state));
  assert.ok(bedFits(BED), 'Entire bed fits outside walls, furniture and doorways');
  for (const resident of state.residents) {
    assert.ok(houseWalkable(resident.position), resident.id);
    const stops = [resident.position, ...routinePoints[resident.id]];
    for (let i = 0; i < stops.length; i++) {
      const next = stops[(i + 1) % stops.length];
      const path = houseRoute(stops[i], next);
      assert.ok(path.length, `${resident.id} can reach routine stop ${i}`);
      assert.ok(path.every(houseWalkable));
    }
  }
});

test('every social area can reach actual chore objects, Layla bed and water bowl', () => {
  const targets = [...Object.values(ITEMS).map(item => item.position), BED, BOWL, PLANT];
  for (const area of HOUSE_AREAS) {
    assert.ok(houseWalkable(area.arrival), area.name);
    for (const target of targets) {
      const path = approach(area.arrival, target);
      assert.ok(path.length, `${area.name} reaches ${JSON.stringify(target)}`);
      assert.ok(path.every(houseWalkable), `${area.name} approach avoids obstacles`);
    }
  }
});

test('snapshots from the old floor plan are reset; new outdoor snapshots remain valid', () => {
  const old = createLife(0);
  delete old.layoutVersion;
  assert.equal(parseLife(old), null, 'Old coordinates must not survive the plan migration');
  const state = createLife(0);
  state.residents[0].position = {...areaById('alfresco').arrival};
  state.residents[0].path = houseRoute(state.residents[0].position, areaById('pool').arrival);
  assert.ok(parseLife(state), 'Alfresco and pool deck belong to the valid world');
  state.residents[0].position = {...POOL};
  assert.equal(parseLife(state), null, 'The water surface is not a walking destination');
});
