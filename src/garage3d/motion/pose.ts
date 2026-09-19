export type Point={x:number;y:number;z:number;visibility?:number};
export type ArmPose={shoulder:number;elbow:number;forward:number;elbowForward:number};
export type BodyPose={left:ArmPose;right:ArmPose;lean:number};
export const neutralPose=():BodyPose=>({left:{shoulder:0,elbow:0,forward:0,elbowForward:0},right:{shoulder:0,elbow:0,forward:0,elbowForward:0},lean:0});
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const visible=(p:Point|undefined):p is Point=>!!p&&[p.x,p.y,p.z].every(Number.isFinite)&&(p.visibility??0)>=.65;
/** Frontal, mirrored upper-body mapping. Hidden joints return to rest independently. */
export function mapPose(points:Point[],world:Point[]=[] ):BodyPose{
 const pose=neutralPose();
 for(const [side,s,e,w,sign] of [['left',12,14,16,-1],['right',11,13,15,1]] as const){
  const shoulder=points[s],elbow=points[e],wrist=points[w];
  if(!visible(shoulder)||!visible(elbow))continue;
  // World landmarks come from the same Lite inference, in metres. Never send them.
  // Image visibility still gates occluded joints, even if world depth was inferred.
  const ws=world[s],we=world[e],ww=world[w];
  if(visible(ws)&&visible(we)){
   const dx=we.x-ws.x,dy=we.y-ws.y,dz=we.z-ws.z;
   if(Math.hypot(dx,dy,dz)<.025)continue;
   const lateral=clamp(Math.atan2(dx,dy),-2.65,2.65);
   const forward=clamp(Math.atan2(dz,Math.hypot(dx,dy)),-1.5,1.2);
   pose[side].shoulder=lateral;pose[side].forward=forward;
   if(visible(wrist)&&visible(ww)){
    const fx=ww.x-we.x,fy=-(ww.y-we.y),fz=-(ww.z-we.z);
    if(Math.hypot(fx,fy,fz)>.025){
     // Forearm direction in the upper arm's local frame: inverse Rz * Rx.
     const x=Math.cos(lateral)*fx+Math.sin(lateral)*fy;
     const y=-Math.sin(lateral)*fx+Math.cos(lateral)*fy;
     const localY=Math.cos(forward)*y+Math.sin(forward)*fz;
     const localZ=-Math.sin(forward)*y+Math.cos(forward)*fz;
     pose[side].elbow=clamp(Math.atan2(x,-localY),-2.3,2.3);
     pose[side].elbowForward=clamp(Math.atan2(-localZ,Math.hypot(x,localY)),-1.5,1.5);
    }
   }
   continue;
  }
  const dx=elbow.x-shoulder.x,dy=elbow.y-shoulder.y;
  if(Math.hypot(dx,dy)<.025)continue;
  pose[side].shoulder=sign*clamp(Math.atan2(Math.abs(dx),dy),0,2.65);
  if(visible(wrist)){
   const ax=shoulder.x-elbow.x,ay=shoulder.y-elbow.y,bx=wrist.x-elbow.x,by=wrist.y-elbow.y;
   const length=Math.hypot(ax,ay)*Math.hypot(bx,by);
   if(length>.001)pose[side].elbow=sign*clamp(Math.PI-Math.acos(clamp((ax*bx+ay*by)/length,-1,1)),0,2.3);
  }
 }
 if(visible(points[11])&&visible(points[12]))pose.lean=clamp(Math.atan2(points[12].y-points[11].y,Math.abs(points[12].x-points[11].x)),-.14,.14);
 return pose;
}
export function smoothPose(current:BodyPose,target:BodyPose,dt:number){
 const a=1-Math.exp(-Math.min(.1,Math.max(0,dt))*9);
 for(const side of ['left','right'] as const)for(const joint of ['shoulder','elbow','forward','elbowForward'] as const)current[side][joint]+=(target[side][joint]-current[side][joint])*a;
 current.lean+=(target.lean-current.lean)*a;return current;
}
