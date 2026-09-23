import {areaById,planPoint,POOL,OPENINGS} from '../src/garage3d/areas.ts';
import test from 'node:test';import assert from 'node:assert/strict';
import {createLife,applyCommand,parseLife,bedFits,releaseBed,tickLife,BED,residentSpeed,residentPause} from '../src/garage3d/residents/model.ts';
import {createResidentMotion} from '../src/garage3d/residents/motion.ts';
import {houseWalkable} from '../src/garage3d/layout.ts';
const v={id:'ana',name:'Ana',position:{...BED}};
const act=(s,action,target='bed',now=100000,visitor=v)=>applyCommand(s,{id:'test',visitor,action,target},now);
test('one bed carrier, placement footprint and passage validation, persisted move and dog destination',()=>{
 const s=createLife(0);act(s,'moveBed');assert.equal(s.bed.holder,'ana');
 assert.match(act(s,'moveBed','bed',103000,{...v,id:'bob'}),/uso/);assert.equal(s.bed.holder,'ana');
 assert.equal(bedFits({...POOL}),false);assert.equal(bedFits({...OPENINGS.find(o=>o.kind==='door')}),false);assert.equal(bedFits({...POOL}),false);
 assert.match(act(s,'placeBed','bed',106000,{...v,position:{...OPENINGS.find(o=>o.kind==='door')}}),/livre/);assert.equal(s.bed.holder,'ana');
 const place=planPoint(476,480);assert.ok(bedFits(place));act(s,'placeBed','bed',109000,{...v,position:place});assert.equal(s.bed.holder,undefined);assert.deepEqual(s.bed.position,place);assert.ok(parseLife(s));
 act(s,'rest','bed',112000,{...v,position:place});assert.deepEqual(s.residents[2].path.at(-1),place);
});
test('carrying follows visitor; cancellation and disconnect release at last placed home',()=>{
 const s=createLife(0);act(s,'moveBed');tickLife(s,.1,[{...v,position:{x:-5,z:2.8}}],100001);assert.equal(s.bed.position.x,-5);
 releaseBed(s,'bob');assert.equal(s.bed.holder,'ana');releaseBed(s,'ana');assert.deepEqual(s.bed.position,BED);
 act(s,'moveBed','bed',103000);act(s,'cancelBed','bed',106000);assert.equal(s.bed.holder,undefined);assert.deepEqual(s.bed.position,BED);
 const legacy=createLife();delete legacy.bed;assert.deepEqual(parseLife(legacy).bed.position,BED);
 const bad=createLife();bad.bed.home={...OPENINGS.find(o=>o.kind==='door')};assert.equal(parseLife(bad),null);
});
test('Layla speaks in first person and routines have independent rhythms',()=>{
 const s=createLife(0),visitor={...v,position:s.residents[2].position};act(s,'talk','biscoito',100000,visitor);assert.equal(s.speech.owner,'biscoito');const first=s.speech.text;
 act(s,'talk','biscoito',103000,visitor);assert.notEqual(s.speech.text,first);
 assert.equal(new Set(s.residents.map(r=>residentSpeed(r.id))).size,3);assert.equal(new Set(s.residents.map(r=>residentPause(r.id,2))).size,3);
});
test('network movement follows floor at steady pace; stops when no snapshot is available',()=>{
 const m=createResidentMotion(2000),snap=(x,z)=>({position:{x,z},angle:0,activity:'walk'});
 m.sample(snap(6,3.6),0);m.sample(snap(6,4.6),1800);
 const a=m.at(2400),b=m.at(2800),c=m.at(3200);
 assert.ok(Math.abs((b.position.z-a.position.z)-(c.position.z-b.position.z))<.001);
 for(let t=2000;t<=4000;t+=30)assert.ok(houseWalkable(m.at(t).position));
 assert.deepEqual(m.at(8000).position,{x:6,z:4.6});
 const mutable=snap(6,3.6),local=createResidentMotion(0);local.sample(mutable,0);mutable.position={x:6,z:3.8};local.sample(mutable,100);assert.equal(local.at(100).position.z,3.8);
});
