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
test('3D arms reach forward, wave to both sides and ignore hidden depth',()=>{
 const image=Array.from({length:33},()=>({x:.5,y:.5,z:0,visibility:1}));
 const world=image.map(p=>({...p}));
 world[12]={x:-.2,y:0,z:0,visibility:1};world[14]={x:-.24,y:.16,z:-.22,visibility:1};world[16]={x:-.24,y:.02,z:-.45,visibility:1};
 const front=mapPose(image,world);assert.ok(front.left.forward<-.5,'arm reaches towards camera');assert.ok(Math.abs(front.left.elbowForward)>.1,'elbow bends in depth');
 world[14]={x:-.4,y:0,z:0,visibility:1};world[16]={x:-.5,y:-.25,z:0,visibility:1};const out=mapPose(image,world);
 world[16].x=-.3;const inward=mapPose(image,world);assert.ok(Math.abs(out.left.elbow-inward.left.elbow)>.5,'forearm follows a wave instead of fixing one angle');
 image[16].visibility=.1;assert.equal(mapPose(image,world).left.elbowForward,0);assert.equal(mapPose(image,world).left.elbow,0);
 image[14].visibility=.1;assert.deepEqual(mapPose(image,world).left,neutralPose().left);
});
test('forward tracking resets without overriding walking or sitting arms',()=>{
 const avatar=createAdultAvatar(0),pose=neutralPose();pose.left.forward=-1;pose.left.elbowForward=-.8;
 applyBodyPose(avatar,pose);const pivot=avatar.getObjectByName('motion-arm-left');assert.ok(pivot);assert.equal(pivot.rotation.x,-1);
 for(let i=0;i<60;i++){animateAdult(avatar,true,.2);applyBodyPose(avatar,neutralPose());}
 assert.equal(pivot.rotation.x,0);assert.ok(Math.abs(avatar.getObjectByName('adult-arm-left').rotation.x)>.2);
 assert.equal(avatar.getObjectByName('adult-arm-left-elbow').rotation.x,0);
});
