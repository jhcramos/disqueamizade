import type {BallFlight} from './model.ts';
export function ballFlightPose(f:BallFlight,now:number){
 const progress=Math.max(0,Math.min(1,(now-f.start)/f.duration));
 const travel=Math.min(1,progress/.76),bounce=progress>.76?(1-progress)/.24*.19*Math.abs(Math.sin((progress-.76)/.24*Math.PI*2)):0;
 return {x:f.from.x+(f.to.x-f.from.x)*travel,z:f.from.z+(f.to.z-f.from.z)*travel,y:f.fromHeight+(f.toHeight-f.fromHeight)*travel+Math.sin(travel*Math.PI)*.95+bounce};
}
