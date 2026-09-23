import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createAdultAvatar} from '../src/garage/adultAvatar.ts';
import {createHouseholdProps} from '../src/garage3d/residents/householdProps.ts';
import {HOUSEHOLD} from '../src/garage3d/residents/household.ts';

function fixture() {
  const scene = new T.Scene(), props = createHouseholdProps(scene), roots = new Map();
  for (const [id, index] of [['dora', 5], ['teo', 0]]) {
    const root = new T.Group(), avatar = createAdultAvatar(index);
    avatar.scale.setScalar(.8); root.add(avatar); scene.add(root); roots.set(id, root);
  }
  return {scene, props, roots, find: name => props.root.getObjectByName(`household-${name}`)};
}

test('props park in their shared locations and attach visually without becoming avatar children', () => {
  const {props, roots, find} = fixture();
  props.sync([], roots, false);
  assert.equal(find('guitar').position.x, HOUSEHOLD.guitar.x);
  assert.equal(find('lawn-mower').position.z, HOUSEHOLD.garden.z);
  const harold = roots.get('teo'); harold.position.set(4, 0, 3); harold.rotation.y = Math.PI / 2;
  props.sync([{id: 'teo', activity: 'guitar'}], roots, false);
  assert.ok(find('guitar').position.distanceTo(harold.position) < 1.2);
  assert.equal(find('guitar').parent, props.root);
  assert.ok(!harold.getObjectByName('household-guitar'));
  props.sync([{id: 'dora', activity: 'dishes'}, {id: 'teo', activity: 'laundry'}], roots, false);
  assert.equal(find('dora-plate').visible, true); assert.equal(find('dora-dish-cloth').visible, true);
  assert.equal(find('teo-folded-laundry').visible, true); assert.equal(find('teo-plate').visible, false);
  props.sync([], roots, false);
  assert.equal(find('dora-plate').visible, false); assert.equal(find('teo-folded-laundry').visible, false);
  props.dispose();
});

test('mower follows the rendered actor, rolls only during movement and respects reduced motion', () => {
  const {props, roots, find} = fixture(), harold = roots.get('teo');
  const residents = [{id: 'teo', activity: 'mow'}], mower = find('lawn-mower');
  harold.position.set(2, 0, 1); harold.rotation.y = Math.PI / 2;
  props.sync(residents, roots, false);
  assert.ok(Math.abs(mower.position.x - 2.88) < 1e-8);
  assert.ok(Math.abs(mower.position.z - 1) < 1e-8);
  const wheel = mower.children.find(child => child instanceof T.Group);
  harold.position.x += .1; props.sync(residents, roots, false);
  assert.ok(Math.abs(wheel.rotation.x) > .5);
  const spin = wheel.rotation.x;
  harold.position.x += .1; props.sync(residents, roots, true);
  assert.equal(wheel.rotation.x, spin);
  props.sync([], roots, false);
  assert.equal(mower.position.x, HOUSEHOLD.garden.x);
  props.dispose();
});

test('geometry count remains bounded across activity changes and disposal touches only owned resources', () => {
  const {scene, props, roots} = fixture(), geometry = new Set(), materials = new Set();
  props.root.traverse(object => { if (object instanceof T.Mesh) { geometry.add(object.geometry); materials.add(object.material); } });
  assert.ok(geometry.size < 45, `bounded prop mesh count: ${geometry.size}`);
  let geometryDisposed = 0, materialDisposed = 0, avatarDisposed = 0;
  geometry.forEach(value => value.addEventListener('dispose', () => geometryDisposed++));
  materials.forEach(value => value.addEventListener('dispose', () => materialDisposed++));
  roots.get('teo').traverse(object => { if (object instanceof T.Mesh) object.geometry.addEventListener('dispose', () => avatarDisposed++); });
  const activities = ['guitar', 'dishes', 'laundry', 'mow', 'chat'];
  for (let i = 0; i < 100; i++) props.sync([{id: 'teo', activity: activities[i % activities.length]}], roots, i % 2 === 0);
  const finalGeometry = new Set(); props.root.traverse(object => { if (object instanceof T.Mesh) finalGeometry.add(object.geometry); });
  assert.deepEqual(finalGeometry, geometry);
  props.dispose(); props.dispose();
  assert.equal(geometryDisposed, geometry.size); assert.equal(materialDisposed, materials.size);
  assert.equal(avatarDisposed, 0); assert.ok(!scene.children.includes(props.root));
});
