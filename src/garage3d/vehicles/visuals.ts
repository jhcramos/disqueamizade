import * as T from 'three';
import {BUGGIES,CHECKPOINTS,driveVehicle,type Car,type Fleet} from './model';
/** Four shared-material low-poly UTVs; no physics engine or external model downloads. */
export function createVehicleVisuals(scene:T.Scene){
 const root=new T.Group();root.name='neighborhood-buggies';scene.add(root);
 const geometries:T.BufferGeometry[]=[],materials:T.Material[]=[];
 const material=(color:string)=>{const m=new T.MeshStandardMaterial({color,roughness:.72});materials.push(m);return m;};
 const black=material('#252b2c'),rubber=material('#181b1b'),metal=material('#879398'),seat=material('#343c40'),lamp=material('#fff3b7');
 function box(g:T.Group,m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number){const geo=new T.BoxGeometry(w,h,d);geometries.push(geo);const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);mesh.castShadow=true;g.add(mesh);return mesh;}
 function tube(g:T.Group,a:number[],b:number[],radius=.045){const p=new T.Vector3(...a),q=new T.Vector3(...b),geo=new T.CylinderGeometry(radius,radius,p.distanceTo(q),6);geometries.push(geo);const mesh=new T.Mesh(geo,black);mesh.position.copy(p).add(q).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());g.add(mesh);}
 const cars=new Map<string,{root:T.Group;wheels:T.Group[];front:T.Group[];pose:Car|null}>();
 for(const b of BUGGIES){const g=new T.Group();g.name=`buggy-${b.id}`;g.userData.vehicle=b.id;root.add(g);const paint=material(b.color);
  box(g,black,0,.52,0,1.55,.25,2.6);box(g,paint,0,.87,.98,1.6,.35,.72);box(g,black,0,.64,1.39,1.35,.17,.12);box(g,paint,0,.86,-1.12,1.6,.30,.5);
  for(const x of [-.72,.72]){box(g,paint,x,.80,-.03,.16,.46,1.5);tube(g,[x,1.02,-1],[x,1.92,-.62]);tube(g,[x,1.92,-.62],[x,1.92,.55]);tube(g,[x,1.92,.55],[x,1.05,1.02]);tube(g,[x,1.02,-1],[x,1.05,1.02]);}
  for(const z of [-.62,.55])tube(g,[-.72,1.92,z],[.72,1.92,z]);box(g,black,0,1.96,-.04,1.65,.07,1.4);
  for(const x of [-.40,.40]){box(g,seat,x,.76,-.1,.57,.18,.6);box(g,seat,x,1.12,-.42,.57,.66,.15);box(g,lamp,x,.95,1.355,.35,.10,.06);}
  const steering=new T.TorusGeometry(.16,.025,6,12);geometries.push(steering);const sw=new T.Mesh(steering,black);sw.position.set(.4,1.12,.45);sw.rotation.x=-.5;g.add(sw);
  const wheels:T.Group[]=[],front:T.Group[]=[];
  for(const x of [-.91,.91])for(const z of [-.9,.92]){const pivot=new T.Group();pivot.position.set(x,.44,z);g.add(pivot);if(z>0)front.push(pivot);const wheel=new T.Group();pivot.add(wheel);wheels.push(wheel);
   const geo=new T.CylinderGeometry(.43,.43,.30,12);geometries.push(geo);const tire=new T.Mesh(geo,rubber);tire.rotation.z=Math.PI/2;wheel.add(tire);
   const hub=new T.CylinderGeometry(.23,.23,.32,8);geometries.push(hub);const rim=new T.Mesh(hub,metal);rim.rotation.z=Math.PI/2;wheel.add(rim);
   for(let i=0;i<10;i++){const tread=box(wheel,black,0,Math.cos(i*Math.PI/5)*.425,Math.sin(i*Math.PI/5)*.425,.34,.09,.14);tread.rotation.x=i*Math.PI/5;}
  }
  cars.set(b.id,{root:g,wheels,front,pose:null});
 }
 const markers=CHECKPOINTS.map((p,i)=>{const g=new T.Group();g.position.set(p.x,.02,p.z);root.add(g);const m=material(i===4?'#f2e9cd':'#e4b551');for(let n=-2;n<=2;n++)box(g,m,n*.55,.02,0,.3,.02,2.7);return g;});
 return{cars,root,sync(fleet:Fleet,dt:number,own:string,online:boolean,input:{throttle:number;steer:number},pedestrians:{x:number;z:number}[]=[]){
  for(const c of fleet.cars){const v=cars.get(c.id)!;if(!v.pose)v.pose=structuredClone(c);
   const isDriver=c.driver?.id===own,blocked=!online||!c.driver||!!fleet.race&&Date.now()<fleet.race.starts&&fleet.race.entries.some(e=>e.car===c.id);
   if(Math.hypot(v.pose.x-c.x,v.pose.z-c.z)>4){v.pose=structuredClone(c);}
   if(isDriver&&!blocked){v.pose.input={...input,at:Date.now()};driveVehicle(v.pose,dt,fleet.cars.filter(o=>o.id!==c.id),pedestrians);const correction=Math.min(1,dt*2);v.pose.x+=(c.x-v.pose.x)*correction;v.pose.z+=(c.z-v.pose.z)*correction;}
   else{const smooth=Math.min(1,dt*10);v.pose.x+=(c.x-v.pose.x)*smooth;v.pose.z+=(c.z-v.pose.z)*smooth;v.pose.yaw+=Math.atan2(Math.sin(c.yaw-v.pose.yaw),Math.cos(c.yaw-v.pose.yaw))*smooth;v.pose.speed=blocked?0:c.speed;}
   v.root.position.set(v.pose.x,0,v.pose.z);v.root.rotation.y=v.pose.yaw;
   v.wheels.forEach(w=>w.rotation.x+=v.pose!.speed*dt/.43);v.front.forEach(w=>w.rotation.y=-(isDriver?input.steer:c.input.steer)*.36);
  }
  markers.forEach(m=>m.visible=!!fleet.race&&Date.now()<fleet.race.ends);
 },rider(car:string,passenger:boolean){const v=cars.get(car)!;return v.root.localToWorld(new T.Vector3(passenger?-.4:.4,.78,-.1));},dispose(){scene.remove(root);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
