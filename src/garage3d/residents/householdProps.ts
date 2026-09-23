import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {FIXTURES} from '../areas.ts';
import {HOUSEHOLD} from './household.ts';

type HouseholdResident = {id: string; activity: string};
const WOOD = '#b4773f', GOLD = '#eac180', DARK = '#443b32', METAL = '#b7b5a4';

/** All props remain in this owned scene group, even while a resident carries one. */
export function createHouseholdProps(scene: T.Scene) {
  const root = new T.Group();
  root.name = 'household-props';
  const materials = new Map<string, T.MeshStandardMaterial>();
  const geometries = new Set<T.BufferGeometry>();
  const localRotation = new T.Quaternion(), worldRotation = new T.Quaternion();
  const euler = new T.Euler();
  let disposed = false;

  function mesh(parent: T.Object3D, geometry: T.BufferGeometry, color: string, x = 0, y = 0, z = 0) {
    let material = materials.get(color);
    if (!material) {
      material = new T.MeshStandardMaterial({color, roughness: .73});
      materials.set(color, material);
    }
    geometries.add(geometry);
    const object = new T.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  const box = (parent: T.Object3D, color: string, x: number, y: number, z: number, w: number, h: number, d: number) =>
    mesh(parent, new RoundedBoxGeometry(w, h, d, 1, Math.min(w, h, d) * .12), color, x, y, z);
  const cylinder = (parent: T.Object3D, color: string, x: number, y: number, z: number, radius: number, height: number) =>
    mesh(parent, new T.CylinderGeometry(radius, radius, height, 16), color, x, y, z);
  const ring = (parent: T.Object3D, color: string, x: number, y: number, z: number, radius: number, thickness: number) =>
    mesh(parent, new T.TorusGeometry(radius, thickness, 5, 24), color, x, y, z);
  function rod(parent: T.Object3D, color: string, a: number[], b: number[], radius: number) {
    const start = new T.Vector3(...a), end = new T.Vector3(...b), direction = end.sub(start);
    const object = cylinder(parent, color, a[0] + direction.x / 2, a[1] + direction.y / 2, a[2] + direction.z / 2, radius, direction.length());
    object.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize());
    return object;
  }
  // Each rigid prop is merged by material once, keeping the added draw calls bounded.
  function mergeRigid(group: T.Group) {
    const byMaterial = new Map<T.Material, T.BufferGeometry[]>();
    for (const child of [...group.children]) {
      if (!(child instanceof T.Mesh)) continue;
      child.updateMatrix();
      if (child.geometry.index) {
        const source = child.geometry;
        child.geometry = source.toNonIndexed();
        geometries.add(child.geometry);
        source.dispose();
        geometries.delete(source);
      }
      child.geometry.applyMatrix4(child.matrix);
      const list = byMaterial.get(child.material) ?? [];
      list.push(child.geometry);
      byMaterial.set(child.material, list);
      group.remove(child);
    }
    for (const [material, sources] of byMaterial) {
      const geometry = mergeGeometries(sources, false)!;
      geometries.add(geometry);
      for (const source of sources) { source.dispose(); geometries.delete(source); }
      const combined = new T.Mesh(geometry, material);
      combined.castShadow = combined.receiveShadow = true;
      group.add(combined);
    }
  }
  function group(name: string) {
    const result = new T.Group();
    result.name = name;
    root.add(result);
    return result;
  }

  const guitar = group('household-guitar');
  // Offset double cutaways, pickups and controls read as an electric guitar at scene scale.
  const outline = new T.Shape();
  outline.moveTo(0, -.23);
  outline.bezierCurveTo(-.22, -.25, -.26, -.06, -.17, .045);
  outline.bezierCurveTo(-.12, .105, -.19, .255, -.105, .30);
  outline.bezierCurveTo(-.07, .32, -.09, .175, -.044, .175);
  outline.lineTo(-.034, .235);
  outline.lineTo(.034, .235);
  outline.bezierCurveTo(.045, .16, .08, .145, .108, .24);
  outline.bezierCurveTo(.15, .28, .195, .16, .16, .055);
  outline.bezierCurveTo(.26, -.07, .22, -.25, 0, -.23);
  mesh(guitar, new T.ExtrudeGeometry(outline, {depth: .065, bevelEnabled: true, bevelThickness: .009, bevelSize: .009, bevelSegments: 1, curveSegments: 8}), '#b64043');
  const pickguard = new T.Shape();
  pickguard.moveTo(-.065, -.11);
  pickguard.lineTo(-.105, -.025);
  pickguard.lineTo(-.065, .17);
  pickguard.lineTo(.052, .18);
  pickguard.lineTo(.105, .12);
  pickguard.lineTo(.12, -.05);
  pickguard.lineTo(.07, -.115);
  pickguard.closePath();
  mesh(guitar, new T.ExtrudeGeometry(pickguard, {depth: .008, bevelEnabled: false}), DARK, 0, 0, .076);
  for (const y of [.145, .055]) {
    box(guitar, METAL, 0, y, .09, .112, .028, .012);
    box(guitar, DARK, 0, y, .099, .078, .007, .006);
  }
  for (const y of [-.045, -.105]) {
    const control = cylinder(guitar, GOLD, .138, y, .085, .018, .018);
    control.rotation.x = Math.PI / 2;
  }
  box(guitar, DARK, 0, .41, .041, .059, .34, .035);
  box(guitar, WOOD, 0, .615, .043, .095, .13, .044);
  box(guitar, METAL, 0, -.07, .086, .12, .036, .022);
  box(guitar, GOLD, 0, -.065, .102, .105, .007, .008);
  for (let i = 0; i < 6; i++) box(guitar, METAL, -.0175 + i * .007, .27, .11, .002, .70, .002);
  for (let i = 0; i < 7; i++) box(guitar, GOLD, 0, .265 + i * .045, .068, .061, .003, .003);
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) box(guitar, METAL, side * .056, .579 + i * .034, .044, .026, .016, .018);
  mergeRigid(guitar);

  const stand = group('household-guitar-stand');
  rod(stand, DARK, [0, .07, -.09], [0, .66, -.09], .019);
  for (const side of [-1, 1]) {
    rod(stand, DARK, [0, .23, -.09], [side * .19, .026, .11], .019);
    rod(stand, DARK, [side * .11, .26, -.09], [side * .11, .26, .09], .014);
  }
  rod(stand, DARK, [0, .15, -.09], [0, .024, -.26], .019);
  mergeRigid(stand);
  stand.position.set(HOUSEHOLD.guitar.x, 0, HOUSEHOLD.guitar.z);
  stand.rotation.y = -.4;

  const mower = group('household-lawn-mower');
  box(mower, '#4c8670', 0, .23, 0, .52, .19, .62);
  box(mower, DARK, 0, .365, -.025, .28, .14, .27);
  box(mower, METAL, 0, .443, -.025, .15, .025, .18);
  box(mower, DARK, 0, .19, -.36, .34, .22, .23);
  for (const side of [-1, 1]) {
    rod(mower, METAL, [side * .21, .27, -.20], [side * .26, .65, -.46], .018);
    rod(mower, DARK, [side * .26, .65, -.46], [side * .26, .72, -.54], .022);
  }
  rod(mower, DARK, [-.26, .72, -.54], [.26, .72, -.54], .023);
  mergeRigid(mower);
  const wheels: T.Group[] = [];
  for (const side of [-1, 1]) for (const z of [-.215, .215]) {
    const wheel = new T.Group();
    wheel.position.set(side * .286, .135, z);
    mower.add(wheel);
    const tire = cylinder(wheel, DARK, 0, 0, 0, .13, .075);
    tire.rotation.z = Math.PI / 2;
    const hub = cylinder(wheel, GOLD, side * .041, 0, 0, .068, .012);
    hub.rotation.z = Math.PI / 2;
    box(wheel, DARK, side * .05, 0, 0, .012, .016, .115);
    mergeRigid(wheel);
    wheels.push(wheel);
  }
  mower.position.set(HOUSEHOLD.garden.x, 0, HOUSEHOLD.garden.z);
  let lastMowerX = mower.position.x, lastMowerZ = mower.position.z, wasMowing = false;

  const dishes = group('household-dish-rack');
  box(dishes, METAL, 0, .022, 0, .44, .035, .32);
  for (const side of [-1, 1]) box(dishes, WOOD, side * .217, .062, 0, .023, .10, .32);
  for (let i = 0; i < 3; i++) {
    const plate = cylinder(dishes, '#f0e7d3', -.12 + i * .12, .17, 0, .135, .018);
    plate.rotation.z = Math.PI / 2;
  }
  box(dishes, '#78a69b', .31, .022, 0, .15, .028, .24);
  mergeRigid(dishes);
  const island = FIXTURES.find(f => f.kind === 'island')!;
  dishes.position.set(island.x - island.w * .25, island.h + .014, island.z);

  const laundry = group('household-laundry-basket');
  box(laundry, WOOD, 0, .025, 0, .32, .05, .37);
  for (const side of [-1, 1]) {
    box(laundry, GOLD, side * .16, .12, 0, .018, .21, .37);
    box(laundry, GOLD, 0, .12, side * .178, .32, .21, .018);
    box(laundry, WOOD, side * .169, .225, 0, .025, .028, .39);
  }
  for (let i = 0; i < 3; i++) box(laundry, ['#e8ddc6', '#789c99', '#d28b75'][i], (i % 2 ? 1 : -1) * .019, .135 + i * .052, 0, .26, .05, .28);
  mergeRigid(laundry);
  const washer = FIXTURES.find(f => f.kind === 'washer')!;
  laundry.position.set(washer.x, washer.h + .008, washer.z);

  const hands = new Map<string, {plate: T.Group; cloth: T.Group; folded: T.Group; model?: T.Object3D; left?: T.Object3D; right?: T.Object3D}>();
  for (const id of ['dora', 'teo']) {
    const plate = group(`household-${id}-plate`);
    cylinder(plate, '#f0e7d3', 0, 0, 0, .15, .022).rotation.x = Math.PI / 2;
    ring(plate, '#78a69b', 0, 0, .014, .115, .007);
    mergeRigid(plate);
    const cloth = group(`household-${id}-dish-cloth`);
    box(cloth, '#78a69b', 0, 0, 0, .10, .15, .025);
    const folded = group(`household-${id}-folded-laundry`);
    box(folded, '#d28b75', 0, 0, 0, .34, .055, .23);
    box(folded, '#e8ddc6', 0, .033, .005, .28, .021, .22);
    mergeRigid(folded);
    plate.visible = cloth.visible = folded.visible = false;
    hands.set(id, {plate, cloth, folded});
  }
  scene.add(root);

  function atModel(prop: T.Group, model: T.Object3D, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
    prop.position.set(x, y, z).applyMatrix4(model.matrixWorld);
    model.getWorldQuaternion(worldRotation);
    localRotation.setFromEuler(euler.set(rx, ry, rz));
    prop.quaternion.copy(worldRotation).multiply(localRotation);
    prop.scale.setScalar(model.scale.x);
  }
  function atHand(prop: T.Group, model: T.Object3D, arm: T.Object3D, x = 0, y = 0, z = 0) {
    prop.position.set(x, -.307 + y, .015 + z).applyMatrix4(arm.matrixWorld);
    model.getWorldQuaternion(prop.quaternion);
    prop.scale.setScalar(model.scale.x);
  }
  return {
    root,
    sync(residents: readonly HouseholdResident[], roots: ReadonlyMap<string, T.Group>, reduced: boolean) {
      if (disposed) return;
      let playing = false, mowing = false;
      for (const held of hands.values()) held.plate.visible = held.cloth.visible = held.folded.visible = false;
      for (const resident of residents) {
        const actor = roots.get(resident.id), held = hands.get(resident.id);
        if (!actor || !held) continue;
        const model = actor.children[0];
        if (!model) continue;
        if (held.model !== model) {
          held.model = model;
          held.left = model.getObjectByName('adult-arm-left-elbow');
          held.right = model.getObjectByName('adult-arm-right-elbow');
        }
        model.updateWorldMatrix(true, true);
        const activity = String(actor.userData.householdActivity ?? resident.activity);
        held.plate.visible = held.cloth.visible = activity === 'dishes';
        held.folded.visible = activity === 'laundry';
        if (activity === 'dishes' && held.left && held.right) {
          atHand(held.plate, model, held.left, 0, .015, .03);
          atHand(held.cloth, model, held.right, 0, 0, .035);
        } else if (activity === 'laundry') atModel(held.folded, model, 0, 1.03, .43);
        if (resident.id === 'teo' && activity === 'guitar') {
          atModel(guitar, model, .17, .96, .31, 0, 0, 1.10);
          playing = true;
        }
        if (resident.id === 'teo' && activity === 'mow') {
          const yaw = actor.rotation.y;
          mower.position.set(actor.position.x + Math.sin(yaw) * .88, 0, actor.position.z + Math.cos(yaw) * .88);
          mower.rotation.y = yaw;
          if (wasMowing && !reduced) {
            const travel = (mower.position.x - lastMowerX) * Math.sin(yaw) + (mower.position.z - lastMowerZ) * Math.cos(yaw);
            if (Math.abs(travel) < .5) for (const wheel of wheels) wheel.rotation.x += travel / .13;
          }
          mowing = true;
        }
      }
      if (!playing) {
        guitar.position.set(HOUSEHOLD.guitar.x, .50, HOUSEHOLD.guitar.z);
        guitar.rotation.set(-.08, -.4, 0);
        guitar.scale.setScalar(1);
      }
      if (!mowing) {
        mower.position.set(HOUSEHOLD.garden.x, 0, HOUSEHOLD.garden.z);
        mower.rotation.set(0, 0, 0);
      }
      lastMowerX = mower.position.x;
      lastMowerZ = mower.position.z;
      wasMowing = mowing;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(root);
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials.values()) material.dispose();
      geometries.clear();
      materials.clear();
      root.clear();
    },
  };
}
