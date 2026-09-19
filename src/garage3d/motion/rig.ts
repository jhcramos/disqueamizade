import {Group} from 'three';
import type {BodyPose} from './pose';
/** Lazy grouping only on the local test avatar; normal NPC/mask rigs stay untouched. */
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
  if(arm)arm.rotation.z=sign*.08+pose[side].shoulder;
  if(elbow)elbow.rotation.z=pose[side].elbow;
 }
}
