import { houseRoute, type Place } from '../layout.ts';

type Snapshot = { position:Place; angle:number; activity:string };
type Sample = Snapshot & { at:number; route:Place[]; length:number };
const distance=(a:Place,b:Place)=>Math.hypot(a.x-b.x,a.z-b.z);
/** Render behind the network clock, traversing each route at a steady speed.
 * Never extrapolate into furniture or start a new authoritative routine locally. */
export function createResidentMotion(delay=2000) {
  const samples:Sample[]=[];
  let last:Snapshot|undefined,lastPosition:Place|undefined,lastActivity:string|undefined;
  return {
    sample(state:Snapshot,now:number) {
      if(last===state&&lastPosition===state.position&&lastActivity===state.activity)return;
      last=state;lastPosition=state.position;lastActivity=state.activity;
      const previous=samples[samples.length-1], gap=previous?distance(previous.position,state.position):0;
      let route:Place[]=[];
      if(previous&&gap>.001&&gap<6)route=houseRoute(previous.position,state.position);
      const points=previous?[previous.position,...route]:[];
      const length=points.reduce((sum,p,i)=>i?sum+distance(points[i-1],p):sum,0);
      samples.push({...state,position:{...state.position},at:now,route,length});
      if(samples.length>12)samples.shift();
    },
    at(now:number):Snapshot|null {
      if(!samples.length)return null;
      const time=now-delay;
      while(samples.length>2&&samples[1].at<=time)samples.shift();
      const a=samples[0],b=samples[1];
      if(!b||time<=a.at)return a;
      if(time>=b.at||!b.route.length)return time>=b.at?b:a;
      let remaining=b.length*Math.max(0,Math.min(1,(time-a.at)/(b.at-a.at)));
      let p=a.position;
      for(const next of b.route){
        const length=distance(p,next);
        if(remaining<=length&&length>0){const f=remaining/length;return {position:{x:p.x+(next.x-p.x)*f,z:p.z+(next.z-p.z)*f},angle:Math.atan2(next.x-p.x,next.z-p.z),activity:b.activity==='mow'?'mow':'walk'};}
        remaining-=length;p=next;
      }
      return b;
    },
  };
}
