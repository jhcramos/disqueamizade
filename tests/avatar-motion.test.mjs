import test from 'node:test';import assert from 'node:assert/strict';
import {mapPose,neutralPose,smoothPose} from '../src/garage3d/motion/pose.ts';
import {findThrowTarget} from '../src/garage3d/residents/throwTarget.ts';
import {houseWalkable} from '../src/garage3d/layout.ts';
import {createAdultAvatar,animateAdult} from '../src/garage/adultAvatar.ts';
import {applyBodyPose} from '../src/garage3d/motion/rig.ts';
test('visible arm raises/bends, hidden arm rests and stale pose decays',()=>{
 const p=Array.from({length:33},()=>({x:.5,y:.5,z:0,visibility:0}));
 p[12]={x:.4,y:.4,z:0,visibility:1};p[14]={x:.2,y:.4,z:0,visibility:1};p[16]={x:.2,y:.2,z:0,visibility:1};
 const pose=mapPose(p);assert.ok(pose.left.shoulder< -1.5);assert.ok(pose.left.elbow< -1.5);assert.deepEqual(pose.right,neutralPose().right);
 p[16].visibility=.1;assert.equal(mapPose(p).left.elbow,0);p[14].x=NaN;assert.deepEqual(mapPose(p).left,neutralPose().left);
 for(let i=0;i<120;i++)smoothPose(pose,neutralPose(),1/60);assert.ok(Math.abs(pose.left.shoulder)<.001);
});
test('presets have articulated elbows and stopping restores upper body',()=>{
 for(let i=0;i<10;i++){const avatar=createAdultAvatar(i),pose=neutralPose();pose.left.shoulder=-1;pose.left.elbow=-1;pose.lean=.12;
 assert.ok(avatar.getObjectByName('adult-arm-left-elbow'));applyBodyPose(avatar,pose);assert.equal(avatar.getObjectByName('adult-arm-left-elbow').rotation.z,-1);
 animateAdult(avatar,false,0);applyBodyPose(avatar,neutralPose());assert.equal(avatar.getObjectByName('motion-upper-body').rotation.z,0);assert.equal(avatar.getObjectByName('adult-arm-left-elbow').rotation.z,0);
 }
});
test('long throw has a clear corridor and reachable landing point',()=>{
 const from={x:-6.1,z:2.1},target=findThrowTarget(from,{x:-5.2,z:2.1},[from]);assert.ok(target);assert.ok(target.range>=3);
 for(let t=.02;t<=1;t+=.02)assert.ok(houseWalkable({x:from.x+(target.goal.x-from.x)*t,z:from.z+(target.goal.z-from.z)*t}));
 assert.ok(Math.hypot(target.goal.x-from.x,target.goal.z-from.z)<=5.001);
});
