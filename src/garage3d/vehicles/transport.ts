import {HouseChannel,usesHouseNetwork} from '../../garage/network/HouseChannel';
import {createVehicles,tickVehicles,vehicleCommand,VEHICLE_CHANNEL,type Fleet} from './model';
export type VehicleVisitor={id:string;name:string;x:number;z:number;blocked?:boolean};
/** Online uses authenticated shared authority. Local previews elect one coordinator. */
export function createVehicleTransport(visitor:()=>VehicleVisitor,onState:(s:Fleet,online:boolean)=>void,onResult:(text:string)=>void){
 const online=usesHouseNetwork(),channel=new HouseChannel(VEHICLE_CHANNEL,visitor().id);
 let state=createVehicles(),closed=false,leader=false,release:(()=>void)|undefined,last=0;
 const visitors=new Map<string,{v:VehicleVisitor;seen:number}>();
 const emit=()=>onState(structuredClone(state),online?channel.connected:true);
 const send=(data:Record<string,unknown>)=>channel.postMessage(data);
 function accept(v:VehicleVisitor,d:{action:string;car:string;input?:{throttle:number;steer:number}}){const result=vehicleCommand(state,v,d.action,d.car,Date.now(),d.input);if(d.action!=='input'){if(v.id===visitor().id)onResult(result);else send({type:'result',to:v.id,result});}}
 channel.onmessage=({data:d})=>{
  if(d.type==='snapshot'&&d.state?.cars?.length===4){if(online||!leader){state=d.state;last=performance.now();emit();}}
  else if(d.type==='result'&&(!d.to||d.to===visitor().id)&&d.action!=='input')onResult(d.result);
  else if(!online){if(d.type==='visitor'&&d.visitor?.id)visitors.set(d.visitor.id,{v:d.visitor,seen:Date.now()});if(d.type==='command'&&leader){const known=visitors.get(d.from);if(known)accept(known.v,d);}if(d.type==='hello'&&leader)send({type:'snapshot',state});}
 };
 channel.onconnectionchange=()=>emit();
 async function elect(){if(online||closed||leader)return;if(!navigator.locks)return;await navigator.locks.request('house-vehicles-authority',{ifAvailable:true},async lock=>{if(!lock||closed)return;leader=true;await new Promise<void>(r=>release=r);leader=false;});}
 const timer=setInterval(()=>{
  if(closed)return;
  if(!online){const v=visitor();visitors.set(v.id,{v,seen:Date.now()});send({type:'visitor',visitor:v});void elect();
   if(leader){tickVehicles(state,Date.now(),new Set([...visitors].filter(([,p])=>Date.now()-p.seen<3000).map(([id])=>id)));send({type:'snapshot',state});last=performance.now();emit();}}
  if(last&&performance.now()-last>3000)onState(structuredClone(state),false);
 },100);
 if(!online){send({type:'hello'});void elect();}
 return{get state(){return state;},command(action:string,car:string,input?:{throttle:number;steer:number}){const v=visitor();if(online){if(channel.connected)send({type:'command',action,car,input});else onResult('Reconectando os buggies. Aguarde um instante.');}else if(leader)accept(v,{action,car,input});else{send({type:'visitor',visitor:v});send({type:'command',from:v.id,action,car,input});}},dispose(){const v=visitor();for(const c of state.cars)if(c.driver?.id===v.id||c.passenger?.id===v.id){if(online)send({type:'command',action:'leave',car:c.id});else if(leader)vehicleCommand(state,v,'leave',c.id,Date.now());}closed=true;release?.();clearInterval(timer);channel.close();}};
}
