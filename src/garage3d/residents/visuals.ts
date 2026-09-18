import {ballFlightPose} from './ball';
import type {BallFlight} from './model';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createAdultAvatar, animateAdult } from '../../garage/adultAvatar';
import { presetAppearance } from '../../garage/avatarPresets';
import { createResidentMotion } from './motion';
import { type LifeState } from './model';
import { disposeAvatar } from '../remoteActors';

export type VisualResident = {
  id: 'dora' | 'teo' | 'biscoito';
  position: { x: number; z: number };
  angle: number;
  activity: string;
};
export type VisualItem = {
  id: string;
  kind: 'coffee' | 'watering' | 'record' | 'toy';
  position: { x: number; z: number };
  height: number;
  holder?:string;flight?:BallFlight;
};

// Each builder owns its materials; removing one actor never disposes another's.
function shapes() {
  const materials = new Map<string, T.MeshStandardMaterial>();
  function mesh(parent: T.Object3D, geometry: T.BufferGeometry, color: string, x = 0, y = 0, z = 0) {
    let material = materials.get(color);
    if (!material) {
      material = new T.MeshStandardMaterial({ color, roughness: .74 });
      materials.set(color, material);
    }
    const object = new T.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  return {
    box(parent: T.Object3D, color: string, x: number, y: number, z: number, w: number, h: number, d: number) {
      return mesh(parent, new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * .16), color, x, y, z);
    },
    ball(parent: T.Object3D, color: string, x: number, y: number, z: number, w: number, h = w, d = w) {
      const object = mesh(parent, new T.SphereGeometry(1, 16, 12), color, x, y, z);
      object.scale.set(w, h, d);
      return object;
    },
    cylinder(parent: T.Object3D, color: string, x: number, y: number, z: number, radius: number, h: number, bottom = radius) {
      return mesh(parent, new T.CylinderGeometry(radius, bottom, h, 24), color, x, y, z);
    },
    ring(parent: T.Object3D, color: string, x: number, y: number, z: number, radius: number, thickness: number) {
      return mesh(parent, new T.TorusGeometry(radius, thickness, 8, 32), color, x, y, z);
    },
  };
}

function createDog() {
  const model = new T.Group(), s = shapes(), white = '#f3e9d6';
  const body = new T.Group();
  body.name = 'dog-body';
  body.position.y = .35;
  model.add(body);
  s.box(body, white, 0, .015, -.045, .30, .31, .50);
  s.ball(body, '#e8dcc9', 0, -.025, .14, .165, .18, .15);
  const head = new T.Group();
  head.name = 'dog-head';
  head.position.set(0, .16, .225);
  body.add(head);
  s.box(head, white, 0, .025, 0, .34, .28, .26);
  // Wide, short jowls and a flat black nose distinguish the boxer silhouette.
  s.box(head, '#48413b', 0, -.055, .135, .235, .13, .115);
  s.ball(head, '#f8eedb', -.066, -.093, .155, .064, .043, .043);
  s.ball(head, '#f8eedb', .066, -.093, .155, .064, .043, .043);
  s.box(head, '#252627', 0, -.038, .199, .10, .055, .046);
  s.box(head, '#f6eddc', 0, .028, .139, .053, .16, .022);
  for (const side of [-1, 1]) {
    s.ball(head, '#302d2b', side * .098, .053, .133, .024, .03, .014);
    s.ball(head, '#fff8e9', side * .098 - .006, .063, .145, .007, .008, .004);
    const ear = new T.Group();
    ear.name = `dog-ear-${side}`;
    ear.position.set(side * .155, .105, -.035);
    ear.rotation.z = side * .22;
    head.add(ear);
    s.box(ear, '#ddcfb9', side * .023, -.075, 0, .10, .19, .095);
    s.box(ear, '#cba99a', side * .023, -.09, .048, .055, .10, .01);
  }
  const collar = s.ring(body, '#3a8a85', 0, .045, .185, .144, .026);
  collar.scale.x = 1.03;
  s.ball(body, '#d7a14b', 0, -.065, .217, .025, .033, .009);
  for (let i = 0; i < 4; i++) {
    const leg = new T.Group();
    leg.name = `dog-leg-${i}`;
    leg.position.set(i % 2 ? .105 : -.105, .28, i < 2 ? .15 : -.23);
    model.add(leg);
    s.box(leg, white, 0, -.10, 0, .087, .23, .095);
    s.box(leg, '#e6d9c4', 0, -.225, .024, .108, .09, .15);
  }
  const tail = new T.Group();
  tail.name = 'dog-tail';
  tail.position.set(0, .08, -.28);
  tail.rotation.x = -.65;
  body.add(tail);
  s.box(tail, white, 0, .055, -.045, .055, .16, .065);
  return model;
}

function createItem(kind: VisualItem['kind']) {
  const root = new T.Group(), s = shapes();
  if (kind === 'coffee') {
    s.cylinder(root, '#ede1c6', 0, .025, 0, .125, .025);
    s.cylinder(root, '#cc8051', 0, .09, 0, .074, .12, .061);
    s.cylinder(root, '#553527', 0, .152, 0, .059, .004);
    const rim = s.ring(root, '#efd4ac', 0, .152, 0, .068, .007);
    rim.rotation.x = Math.PI / 2;
    s.ring(root, '#cc8051', .079, .095, 0, .044, .012);
  } else if (kind === 'watering') {
    s.cylinder(root, '#428780', 0, .13, 0, .14, .25, .115);
    s.cylinder(root, '#245d58', 0, .261, 0, .107, .008);
    const handle = s.ring(root, '#a0bfa2', -.125, .19, 0, .13, .025);
    handle.scale.x = .7;
    const spout = s.cylinder(root, '#428780', .18, .16, 0, .034, .27);
    spout.rotation.z = -.87;
    const rose = s.cylinder(root, '#ceb986', .29, .257, 0, .065, .034);
    rose.rotation.z = -.87;
  } else if (kind === 'record') {
    const disc = s.cylinder(root, '#242927', 0, .015, 0, .205, .022);
    disc.name = 'resident-vinyl';
    s.cylinder(root, '#dd9e51', 0, .028, 0, .067, .005);
    s.cylinder(root, '#eee1be', 0, .032, 0, .012, .004);
    for (const r of [.12, .145, .174]) {
      const groove = s.ring(root, '#414641', 0, .028, 0, r, .002);
      groove.rotation.x = Math.PI / 2;
    }
  } else {
    s.ball(root, '#418f87', 0, 0, 0, .14);
    for (const angle of [0, Math.PI / 2]) {
      const stripe = s.ring(root, '#e7a65e', 0, 0, 0, .136, .014);
      stripe.rotation.y = angle;
    }
  }
  return root;
}

type Actor = { root: T.Group; model: T.Group; baseY: number; kind: string; stride:number; motion:ReturnType<typeof createResidentMotion> };

export function createResidentVisuals(scene: T.Scene) {
  const roots = new Map<string, T.Group>(), actors = new Map<string, Actor>();
  function remove(id: string) {
    const root = roots.get(id);
    if (root) { scene.remove(root); disposeAvatar(root); roots.delete(id); }
    actors.delete(id);
  }
  function add(id: string, model: T.Group, kind: string): Actor {
    const root = new T.Group();
    root.name = `resident-${id}`;
    root.userData.residentTarget = id;
    root.add(model);
    scene.add(root);
    roots.set(id, root);
    const actor = { root, model, baseY: model.position.y, kind, stride: id==='dora'?.7:id==='teo'?2.6:4.1, motion:createResidentMotion() };
    actors.set(id, actor);
    return actor;
  }
  return {
    roots,
    sync(residents: VisualResident[], items: VisualItem[], now: number, dt: number, reduced: boolean) {
      const ids = new Set([...residents, ...items].map(r => r.id));
      for (const id of roots.keys()) if (!ids.has(id)) remove(id);
      const seconds = now / 1000, frameDelta = Number.isFinite(dt) ? Math.max(0, dt) : 0;
      const blend = 1 - Math.exp(-frameDelta * 10);

      for (const resident of residents) {
        let actor = actors.get(resident.id);
        const fresh = !actor;
        if (!actor) {
          let model: T.Group;
          if (resident.id === 'biscoito') model = createDog();
          else {
            const dora = resident.id === 'dora', appearance = presetAppearance(dora ? 5 : 0);
            appearance.shirt = dora ? 'clay' : 'ocean';
            appearance.pants = dora ? 'cream' : 'charcoal';
            model = createAdultAvatar(dora ? 5 : 0, appearance);
            const bounds = new T.Box3().setFromObject(model), scale = 1.5 / (bounds.max.y - bounds.min.y);
            model.scale.setScalar(scale);
            model.position.y = -bounds.min.y * scale;
            model.traverse(o => { if (o instanceof T.Mesh) o.castShadow = true; });
          }
          actor = add(resident.id, model, resident.id);
        }
        const { root, model } = actor;
        actor.motion.sample(resident,now);
        const display=actor.motion.at(now)??resident;
        const distance=Math.hypot(display.position.x-root.position.x,display.position.z-root.position.z);
        const teleport=fresh||distance>3;
        const moving=!teleport&&distance>.0001;
        root.position.set(display.position.x,0,display.position.z);
        if(!teleport)actor.stride+=distance*(resident.id==='biscoito'?17:12);
        if(teleport||reduced)root.rotation.y=display.angle;
        else root.rotation.y+=Math.atan2(Math.sin(display.angle-root.rotation.y),Math.cos(display.angle-root.rotation.y))*blend;
        const activity=display.activity.toLowerCase();
        if (resident.id === 'biscoito') {
          const resting = /rest|sleep|nap|descans|dorm/.test(activity);
          const eager=activity==='eager'&&!moving;
          const happy = /eager|pet|fetch|bring|play|carinh|brinc/.test(activity);
          const phase = actor.stride;
          const hopPhase=seconds%3.4;const hop=eager&&!reduced&&hopPhase<1.1?Math.abs(Math.sin(hopPhase/1.1*Math.PI*2))*.13:0;
          model.position.y=actor.baseY+hop;model.rotation.x=eager&&!reduced&&hopPhase>1.7&&hopPhase<2.7?.1:0;
          for (let i = 0; i < 4; i++) {
            const leg = model.getObjectByName(`dog-leg-${i}`)!;
            const target = moving && !reduced ? Math.sin(phase + (i === 0 || i === 3 ? 0 : Math.PI)) * .42 : resting ? -1.1 : 0;
            leg.rotation.x = T.MathUtils.lerp(leg.rotation.x, target, reduced ? 1 : blend);
            leg.position.y = resting ? .15 : .28;
          }
          const body = model.getObjectByName('dog-body')!;
          body.position.y = resting ? .20 : .35 + (moving && !reduced ? Math.sin(phase * 2) * .012 : 0);
          const head = model.getObjectByName('dog-head')!;
          head.rotation.x = resting ? .15 : happy && !reduced ? -.1 + Math.sin(seconds * 3) * .055 : 0;
          head.rotation.z = happy && !moving && !reduced ? Math.sin(seconds * 2) * .09 : 0;
          model.getObjectByName('dog-tail')!.rotation.z = reduced || resting ? 0 : Math.sin(seconds * (happy ? 13 : 5)) * (happy ? .55 : .18);
          for (const side of [-1, 1]) model.getObjectByName(`dog-ear-${side}`)!.rotation.x = moving && !reduced ? Math.sin(phase) * .1 : 0;
        } else {
          const dancing = !moving && /dance|danç/.test(activity) && !reduced;
          animateAdult(model, (moving || dancing)&&!reduced, dancing ? seconds*1.3+actor.stride/8 : actor.stride/8, false, reduced ? 1 : frameDelta);
          model.position.y = actor.baseY + (moving&&!reduced?Math.abs(Math.sin(actor.stride))*.012:0);
          const right = model.getObjectByName('adult-arm-right')!;
          const carrying = /coffee|drink|water|record|vinyl|caf[eé]|reg|disco/.test(activity);
          const greeting = /greet|wave|hello|saud|cumprim/.test(activity);
          const petting = /pet|carinh/.test(activity);
          if (!moving && (carrying || greeting || petting)) {
            right.rotation.x = carrying ? -.8 : greeting ? -2.1 : -.55;
            right.rotation.z = greeting ? -.32 + (reduced ? 0 : Math.sin(seconds * 6) * .13) : -.08;
          } else right.rotation.z = .08;
          const head = model.getObjectByName('avatar-head')!;
          head.rotation.y = !moving && !reduced && /chat|talk|convers/.test(activity) ? Math.sin(seconds * 1.4) * .10 : 0;
          head.rotation.x = petting ? .14 : 0;
        }
      }
      for (const item of items) {
        let actor = actors.get(item.id);
        if (actor && actor.kind !== item.kind) { remove(item.id); actor = undefined; }
        if (!actor) actor = add(item.id, createItem(item.kind), item.kind);
        const previous = actor.root.position;
        const distance = Math.hypot(previous.x - item.position.x, previous.z - item.position.z);
        if (item.kind === 'toy' && !reduced && distance < 1) {
          actor.model.rotation.x += (item.position.z - previous.z) / .14;
          actor.model.rotation.z -= (item.position.x - previous.x) / .14;
        }
        const dog=item.holder==='biscoito'?roots.get('biscoito'):undefined;
        if(dog){const head=dog.getObjectByName('dog-head')!;head.updateWorldMatrix(true,false);const mouth=new T.Vector3(0,-.09,.25).applyMatrix4(head.matrixWorld);actor.root.position.copy(mouth);}
        else if(item.flight&&Date.now()<item.flight.start+item.flight.duration){const p=ballFlightPose(item.flight,Date.now());actor.root.position.set(p.x,p.y,p.z);}
        else actor.root.position.set(item.position.x, item.height, item.position.z);
      }
    },
    dispose() { for (const id of roots.keys()) remove(id); },
  };
}

/** Fixtures are one owned group, independent of the moving/pickable items. */
export function addResidentFixtures(scene: T.Scene) {
  const root = new T.Group(), s = shapes();
  root.name = 'resident-household-fixtures';
  scene.add(root);
  const tray = new T.Group();
  tray.position.set(-5.3, .492, .85);
  root.add(tray);
  s.box(tray, '#b47d47', 0, .017, 0, .60, .03, .43);
  for (const z of [-.21, .21]) s.box(tray, '#93603a', 0, .037, z, .61, .05, .025);
  for (const x of [-.30, .30]) s.box(tray, '#93603a', x, .037, 0, .025, .05, .42);
  // A slim stand supports the crate at the console's front edge.
  const records = new T.Group();
  records.position.set(-7.8, 0, -10.85);
  root.add(records);
  for (const x of [-.22, .22]) for (const z of [-.19, .19]) s.box(records, '#62492f', x, .44, z, .045, .88, .045);
  s.box(records, '#a37645', 0, .90, 0, .55, .045, .48);
  for (const y of [.96, 1.045]) {
    for (const x of [-.26, .26]) s.box(records, '#a37645', x, y, 0, .025, .065, .48);
    for (const z of [-.225, .225]) s.box(records, '#a37645', 0, y, z, .55, .065, .025);
  }
  for (let i = 0; i < 5; i++) s.box(records, ['#54776b', '#bf8150', '#e1c08b'][i % 3], 0, 1.005, -.14 + i * .065, .38, .23, .018);
  const bed = new T.Group();
  bed.position.set(-1.4, 0, 1.85);bed.userData.residentTarget='bed';
  root.add(bed);
  s.box(bed, '#927153', 0, .07, 0, .96, .13, .73);
  s.box(bed, '#b7b798', 0, .13, 0, .80, .14, .59);
  for (const x of [-.43, .43]) s.box(bed, '#7b957f', x, .17, 0, .13, .22, .73);
  s.box(bed, '#7b957f', 0, .17, -.31, .95, .22, .13);
  const bowl = new T.Group();
  bowl.position.set(-1.25, 0, 2.5);bowl.userData.residentTarget='bowl';
  root.add(bowl);
  s.cylinder(bowl, '#4f8b81', 0, .066, 0, .17, .13, .21);
  s.cylinder(bowl, '#87b6b4', 0, .135, 0, .145, .007);
  const rim = s.ring(bowl, '#c9c6a8', 0, .14, 0, .162, .013);
  rim.rotation.x = Math.PI / 2;
  let disposed = false;
  return { root, sync(state:LifeState,carrier?:T.Object3D){const p=carrier?.position??state.bed.position;const yaw=carrier?.rotation.y??0;bed.position.set(p.x+(state.bed.holder?Math.sin(yaw)*.42:0),state.bed.holder?.6:0,p.z+(state.bed.holder?Math.cos(yaw)*.42:0));bed.rotation.y=state.bed.holder?yaw:0;bed.rotation.z=state.bed.holder?-.12:0;}, dispose() { if (!disposed) { disposed = true; scene.remove(root); disposeAvatar(root); } } };
}
