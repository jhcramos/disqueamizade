import {Group} from 'three';
import type {BodyPose} from './pose';
/** Lazy grouping for opted-in visitor motion; NPC and camera-mask rigs stay untouched. */
export function applyBodyPose(model:Group,pose:BodyPose){
 let upper=model.getObjectByName('motion-upper-body');
 if(!upper){
  upper=new Group();upper.name='motion-upper-body';upper.position.y=.79;
  const legs=new Set(['adult-leg-left','adult-leg-right']);
  for(const child of [...model.children])if(!legs.has(child.name)){child.position.y-=.79;upper.add(child);}
  model.add(upper);
 }
 upper.rotation.z=pose.lean;
 for(const [side,sign] of [['left',-1],['right',1]] as const){
  const arm=model.getObjectByName(`adult-arm-${side}`),elbow=model.getObjectByName(`adult-arm-${side}-elbow`);
  if(arm){
   let pivot=model.getObjectByName(`motion-arm-${side}`);
   if(!pivot){
    pivot=new Group();pivot.name=`motion-arm-${side}`;pivot.position.copy(arm.position);
    arm.parent!.add(pivot);pivot.add(arm);arm.position.set(0,0,0);
   }
   // Separate from animateAdult's walking/seated rotation: no accumulated pitch.
   pivot.rotation.set(pose[side].forward,0,pose[side].shoulder,'ZXY');
   arm.rotation.z=sign*.08;
  }
  if(elbow)elbow.rotation.set(pose[side].elbowForward,0,pose[side].elbow,'ZXY');
 }
}
