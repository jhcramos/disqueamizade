import {roomAt,type Place} from '../layout.ts';
export type NearbyHost='dora'|'teo';
type Host={id:string;position:Place};
/** Dwell, hysteresis and a per-host cooldown keep walking past someone unobtrusive. */
export function createHostProximity(){
 let current:NearbyHost|null=null,candidate:NearbyHost|null=null,since=0,holdUntil=0;let origin:Place|null=null;
 const dismissed=new Map<NearbyHost,number>();
 return{
  update(visitor:Place,hosts:Host[],now:number,allowed=true):NearbyHost|null{
   if(!allowed){current=null;candidate=null;return null;}
   const nearby=hosts.filter(h=>(h.id==='dora'||h.id==='teo')&&roomAt(h.position)===roomAt(visitor)&&(dismissed.get(h.id)??0)<=now).map(h=>({...h,distance:Math.hypot(h.position.x-visitor.x,h.position.z-visitor.z)}));
   if(current&&nearby.some(h=>h.id===current&&(h.distance<2.35||(now<holdUntil&&origin&&Math.hypot(visitor.x-origin.x,visitor.z-origin.z)<.75))))return current;
   current=null;const next=nearby.filter(h=>h.distance<1.8).sort((a,b)=>a.distance-b.distance)[0]?.id as NearbyHost|undefined;
   if(!next){candidate=null;return null;}if(candidate!==next){candidate=next;since=now;return null;}
   if(now-since>=400){current=next;holdUntil=now+12000;origin={...visitor};}return current;
  },
  dismiss(now:number,id:NearbyHost|null=current){if(id)dismissed.set(id,now+45000);current=null;candidate=null;},
 };
}
