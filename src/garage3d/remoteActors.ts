import * as T from 'three';
import { createAdultAvatar, animateAdult } from '../garage/adultAvatar';
import { appearanceKey } from '../garage/avatarStyle';
import { seatsForRoom } from '../garage/seats';
import type { Person } from '../garage/model';
import { seatsFor, worldPoint, seatedOrigin } from './layout';
import type { PlayAction } from '../garage/play';
import { toWorld } from './coordinates';
export function disposeAvatar(model:T.Object3D){const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();model.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
export function createRemoteActors(scene:T.Scene){
  const actors=new Map<string,{root:T.Group;model:T.Group;key:string;hip:number}>();
  function remove(id:string){const a=actors.get(id);if(a){scene.remove(a.root);disposeAvatar(a.model);actors.delete(id);}}
  return {actors,sync(people:Person[],now:number,dt:number,reduced:boolean,perform?:PlayAction){
    const ids=new Set(people.map(p=>p.id));for(const id of actors.keys())if(!ids.has(id))remove(id);
    for(const person of people){const room=person.room??'garage',key=`${person.avatar}:${appearanceKey(person.appearance)}`;let a=actors.get(person.id);
      if(a&&a.key!==key){remove(person.id);a=undefined;}
      if(!a){const model=createAdultAvatar(person.avatar,person.appearance),root=new T.Group(),bounds=new T.Box3().setFromObject(model),scale=1.5/(bounds.max.y-bounds.min.y);model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;root.add(model);const p=toWorld(person.position,room);root.position.set(p.x,0,p.z);scene.add(root);a={root,model,key,hip:model.position.y+model.getObjectByName('adult-leg-left')!.position.y*scale};actors.set(person.id,a);}
      const seat=seatsForRoom(room).find(s=>s.id===person.seat),p=toWorld(person.position,room);let moving=false;
      if(a.root.userData.room!==room){a.root.position.set(p.x,0,p.z);a.root.userData.room=room;}
      if(seat){const s=seatsFor(room)[seat.worldIndex],v=worldPoint(s,room);a.root.position.set(v.x+Math.sin(s.angle)*.18,seatedOrigin(s.height,a.hip),v.z+Math.cos(s.angle)*.18);a.root.rotation.y=s.angle;}
      else{const dx=p.x-a.root.position.x,dz=p.z-a.root.position.z;moving=Math.hypot(dx,dz)>.02;if(moving)a.root.rotation.y=Math.atan2(dx,dz);a.root.position.lerp(new T.Vector3(p.x,0,p.z),Math.min(1,dt*12));}
      const dance=perform?.actor===person.id&&perform.on&&!moving&&!seat&&Date.now()-perform.at<15000;
      animateAdult(a.model,(moving||dance)&&!reduced,now/1000*(dance?1.6:1),!!seat,dt);
      a.model.rotation.z=dance&&!reduced?Math.sin(now*.007)*.07:0;
    }
  },dispose(){for(const id of actors.keys())remove(id);}};
}
