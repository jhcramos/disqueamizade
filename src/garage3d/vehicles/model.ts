export const VEHICLE_CHANNEL='disque-vehicles-v1';
export const BUGGIES=[{id:'orange',name:'Laranja',color:'#ef7027'},{id:'blue',name:'Azul',color:'#3188d5'},{id:'red',name:'Vermelho',color:'#cc4243'},{id:'green',name:'Verde',color:'#59a065'}];
export type XY={x:number;z:number};
export type Rider={id:string;name:string;seen:number};
export type Car=XY&{id:string;yaw:number;speed:number;driver:Rider|null;passenger:Rider|null;ready:boolean;input:{throttle:number;steer:number;at:number}};
export type RaceEntry={car:string;driver:string;name:string;next:number;finished?:number;dnf?:boolean};
export type Fleet={at:number;cars:Car[];race:{starts:number;ends:number;entries:RaceEntry[]}|null};
export const CHECKPOINTS:XY[]=[{x:-48,z:-42},{x:-48,z:42},{x:48,z:42},{x:48,z:-42},{x:0,z:-42}];
export function createVehicles(now=Date.now()):Fleet{return{at:now,cars:BUGGIES.map((b,i)=>({id:b.id,x:-8+i*5,z:-43,yaw:-Math.PI/2,speed:0,driver:null,passenger:null,ready:false,input:{throttle:0,steer:0,at:now}})),race:null};}
export const riding=(s:Fleet,id:string)=>s.cars.find(c=>c.driver?.id===id||c.passenger?.id===id);
export function roadPoint(p:XY){return Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<=50.8&&Math.abs(p.z)<=44.8&&(Math.abs(p.x)>=47.2||Math.abs(p.z)>=41.2);}
export function exitPoint(c:Car):XY{
 // Inward verge of the road, safely away from the vehicle body.
 return Math.abs(c.z)>40?{x:c.x,z:Math.sign(c.z)*39.2}:{x:Math.sign(c.x)*44.2,z:c.z};
}
export function driveVehicle(c:Car,dt:number,others:XY[],people:XY[]=[]){
 dt=Math.max(0,Math.min(.05,dt));const throttle=c.input.throttle;
 // Opposing input brakes to rest before engaging the other direction.
 const braking=c.speed*throttle<0;
 const desired=braking?0:throttle*(throttle<0?3:8),change=dt*(throttle===0||braking?16:6);
 c.speed+=Math.max(-change,Math.min(change,desired-c.speed));
 if(Math.abs(c.speed)<.015)c.speed=0;
 const yaw=c.yaw-c.input.steer*dt*1.4*Math.min(1,Math.abs(c.speed)/1.6)*Math.sign(c.speed);
 const p={x:c.x+Math.sin(yaw)*c.speed*dt,z:c.z+Math.cos(yaw)*c.speed*dt};
 if(roadPoint(p)&&others.every(o=>Math.hypot(o.x-p.x,o.z-p.z)>2.5)&&people.every(o=>Math.hypot(o.x-p.x,o.z-p.z)>1.35)){c.x=p.x;c.z=p.z;c.yaw=yaw;}else c.speed=0;
}
export function vehicleCommand(s:Fleet,me:XY&{id:string;name:string;blocked?:boolean},action:string,id:string,now:number,input?:{throttle:number;steer:number}){
 const c=s.cars.find(c=>c.id===id);if(!c)return 'Veículo não encontrado.';
 if(action==='leave'){
  if(c.driver?.id===me.id){c.driver=null;c.ready=false;c.speed=0;c.input={throttle:0,steer:0,at:now};const entry=s.race?.entries.find(e=>e.car===id);if(entry&&!entry.finished)entry.dnf=true;}
  if(c.passenger?.id===me.id)c.passenger=null;return 'Pronto.';
 }
 if(me.blocked)return 'Encerre a atividade atual antes de dirigir.';
 if(action==='drive'||action==='ride'){
  if(riding(s,me.id))return 'Saia do veículo atual primeiro.';
  if(Math.hypot(me.x-c.x,me.z-c.z)>4.2)return 'Chegue mais perto do buggy.';
  if(Math.abs(c.speed)>.2)return 'Espere o buggy parar para entrar.';
  if(s.race&&now<s.race.ends&&s.race.entries.some(e=>e.car===id&&!e.dnf&&!e.finished))return 'Aguarde esta corrida terminar.';
  const role=action==='drive'?'driver':'passenger';if(c[role])return 'Este lugar está ocupado.';
  c[role]={id:me.id,name:me.name.slice(0,24),seen:now};return 'Pronto.';
 }
 if(c.driver?.id!==me.id)return 'Só o motorista controla o buggy.';
 if(action==='input'){
  if(!input||![input.throttle,input.steer].every(Number.isFinite))return 'Controle inválido.';
  c.input={throttle:Math.max(-1,Math.min(1,input.throttle)),steer:Math.max(-1,Math.min(1,input.steer)),at:now};return 'Pronto.';
 }
 if(action==='ready'){if(s.race&&now<s.race.ends)return 'Já existe uma corrida em andamento.';c.ready=!c.ready;return 'Pronto.';}
 if(action==='start'){
  if(s.race&&now<s.race.ends)return 'Já existe uma corrida em andamento.';
  const cars=s.cars.filter(c=>c.driver&&c.ready);if(cars.length<2)return 'Precisamos de dois motoristas prontos.';
  if(!cars.includes(c))return 'Marque “Pronto para correr” primeiro.';
  s.race={starts:now+3000,ends:now+303000,entries:cars.map(c=>({car:c.id,driver:c.driver!.id,name:c.driver!.name,next:0}))};
  cars.forEach((c,i)=>{c.x=-8+i*5;c.z=-43;c.yaw=-Math.PI/2;c.speed=0;c.input={throttle:0,steer:0,at:now};c.ready=false;});return 'Pronto.';
 }
 return 'Ação desconhecida.';
}
export function tickVehicles(s:Fleet,now:number,active:Set<string>,people:XY[]=[]){
 const elapsed=Math.max(0,Math.min(1500,now-s.at));s.at=now;
 for(const c of s.cars){
  for(const role of ['driver','passenger'] as const){const r=c[role];if(r){if(active.has(r.id))r.seen=now;else if(now-r.seen>20000){vehicleCommand(s,{...c,id:r.id,name:r.name},'leave',c.id,now);}}}
  const race=s.race,entry=race?.entries.find(e=>e.car===c.id);
  if(!c.driver||now-c.input.at>1400||race&&entry&&now<race.starts){c.speed=0;c.input.throttle=0;continue;}
  for(let t=0;t<elapsed;t+=50)driveVehicle(c,Math.min(50,elapsed-t)/1000,s.cars.filter(o=>o!==c),people);
 }
 if(s.race){const r=s.race;
  if(now>=r.starts&&now<r.ends)for(const e of r.entries){const c=s.cars.find(c=>c.id===e.car)!;if(e.dnf||e.finished)continue;if(c.driver?.id!==e.driver){e.dnf=true;continue;}const checkpoint=CHECKPOINTS[e.next];if(checkpoint&&Math.hypot(c.x-checkpoint.x,c.z-checkpoint.z)<4.5){e.next++;if(e.next===CHECKPOINTS.length)e.finished=now;}}
  if(now>=r.ends)r.entries.forEach(e=>{if(!e.finished)e.dnf=true;});
  if(r.entries.every(e=>e.finished||e.dnf))r.ends=Math.min(r.ends,now);
 }
}
