import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { HOUSE_SEATS } from './seats';
import { HOUSE_PHONES } from './phoneModel';
import type { RoomId } from './model';

/** Small shared meshes, lit by the same lights as the avatars. */
export function createSceneFurniture(scene: THREE.Scene, room: RoomId) {
  const root = new THREE.Group();
  const box = new RoundedBoxGeometry(1, 1, 1, 2, .055);
  const wood = new THREE.MeshStandardMaterial({ color: '#68432b', roughness: .88 });
  const trim = new THREE.MeshStandardMaterial({ color: '#b78550', roughness: .8 });
  const cloth = new THREE.MeshStandardMaterial({ color: room === 'living' ? '#a6a17a' : '#c08046', roughness: 1 });
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: '#24170f', transparent: true, opacity: .22, depthWrite: false });
  const shadowGeometry = new THREE.CircleGeometry(1, 24);
  function part(group: THREE.Group, material: THREE.Material, size: number[], pos: number[]) {
    const mesh = new THREE.Mesh(box, material);
    mesh.scale.set(size[0], size[1], size[2]);
    mesh.position.set(pos[0], pos[1], pos[2]); group.add(mesh);
  }
  function base(x: number, y: number, width: number) {
    const group = new THREE.Group();
    group.position.set(x * 10, (1 - y) * 20 / 3, 2 - y);
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.scale.set(width, .09, 1); shadow.position.set(.03, .01, -.35);
    group.add(shadow); root.add(group); return group;
  }
  for (const seat of HOUSE_SEATS.filter(s => s.room === room)) {
    const group = base(seat.point.x, seat.point.y, .35);
    const chair = new THREE.Group(); group.add(chair);
    chair.rotation.set(.48, seat.rotation + .32, 0);
    chair.position.z = -.32;
    for (const x of [-.21, .21]) for (const z of [-.16, .16])
      part(chair, wood, [.055, .40, .055], [x, .20, z]);
    part(chair, wood, [.53, .08, .44], [0, .40, 0]);
    part(chair, cloth, [.48, .10, .40], [0, .47, .01]);
    for (const x of [-.22, .22]) part(chair, wood, [.06, .50, .06], [x, .65, -.19]);
    part(chair, cloth, [.48, .29, .09], [0, .76, -.19]);
    if (room === 'living') {
      for (const x of [-.25, .25]) {
        part(chair, cloth, [.11, .24, .44], [x, .57, 0]);
      }
    }
  }
  for (const phone of HOUSE_PHONES[room]) {
    // The phone overlay sits directly on the tabletop, with feet below it.
    const group = base(phone.x, phone.y + .115, .36);
    const cabinet = new THREE.Group();
    cabinet.rotation.set(.35, .4, 0); group.add(cabinet);
    for (const x of [-.24, .24]) for (const z of [-.13, .13])
      part(cabinet, wood, [.07, .64, .07], [x, .32, z]);
    part(cabinet, wood, [.59, .20, .35], [0, .51, 0]);
    part(cabinet, trim, [.67, .075, .42], [0, .65, 0]);
    part(cabinet, trim, [.10, .035, .04], [0, .51, .19]);
    part(cabinet, wood, [.53, .06, .30], [0, .14, 0]);
  }
  scene.add(root);
  return { dispose() { scene.remove(root); box.dispose(); shadowGeometry.dispose();
    [wood, trim, cloth, shadowMaterial].forEach(material => material.dispose()); } };
}
