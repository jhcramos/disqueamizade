import test from 'node:test';
import assert from 'node:assert/strict';
import {createLife,applyCommand,heldItem,ITEMS,tickLife,approach,parseLife} from '../src/garage3d/residents/model.ts';
const visitor=(id,position)=>({id,name:id,position});
const act=(s,visitor,action,target,now=100000)=>applyCommand(s,{id:'command',visitor,action,target},now);
test('all new props have reachable approaches through real furniture',()=>{
 for(const item of Object.values(ITEMS))assert.ok(approach({x:-5,z:2.8},item.position).length,item.name);
});
test('reject distant pickup, double ownership and busy visitors',()=>{
 const s=createLife(0),a=visitor('ana',{x:-5,z:2.8}),b=visitor('bia',ITEMS.coffee.position);
 act(s,a,'pick','record');assert.equal(heldItem(s,'ana'),undefined);
 act(s,b,'pick','coffee');assert.equal(heldItem(s,'bia')?.id,'coffee');
 act(s,visitor('ana',ITEMS.coffee.position),'pick','coffee');assert.equal(heldItem(s,'ana'),undefined);
 act(s,{...a,frozen:true},'pick','toy');assert.equal(heldItem(s,'ana'),undefined);
});
test('deliver coffee near a resident updates memory and frees cup; distant return rejected',()=>{
 const s=createLife(0),a=visitor('ana',ITEMS.coffee.position);act(s,a,'pick','coffee');
 a.position=s.residents[0].position;act(s,a,'coffee','dora',103000);
 assert.equal(s.coffees,1);assert.equal(heldItem(s,'ana'),undefined);assert.match(s.memories.at(-1),/ana/);
 a.position=ITEMS.record.position;act(s,a,'pick','record',106000);a.position={x:-5,z:2.8};
 act(s,a,'return','record',109000);assert.equal(heldItem(s,'ana')?.id,'record');
});
test('dog fetch returns one shared toy and pet pauses movement',()=>{
 const s=createLife(0),a=visitor('ana',ITEMS.toy.position),dog=s.residents[2];dog.position={x:a.position.x+.7,z:a.position.z};
 act(s,a,'pick','toy');act(s,a,'throw','biscoito',103000);
 assert.equal(dog.activity,'fetch');assert.equal(s.fetches,1);
 for(let i=0;i<220;i++)tickLife(s,.1,[a],103100+i*100);
 assert.equal(heldItem(s,'ana')?.id,'toy');assert.equal(s.items.filter(i=>i.id==='toy').length,1);
 a.position={x:dog.position.x+.6,z:dog.position.z};act(s,a,'pet','biscoito',130000);assert.equal(dog.activity,'pet');assert.equal(dog.path.length,0);
});
test('malformed snapshots rejected; memory bounded; routines advance without an API',()=>{
 const s=createLife(0);assert.ok(parseLife(s));assert.equal(parseLife({...s,items:[]}),null);
 const bad=structuredClone(s);bad.residents[0].position.x=NaN;assert.equal(parseLife(bad),null);
 tickLife(s,.1,[],20000);assert.ok(s.residents.some(r=>r.path.length));
 assert.equal(parseLife({...s,memories:Array(20).fill('spam')}),null);
});
test('fetch reservation prevents theft and interruption without losing the toy',()=>{
 const s=createLife(0),a=visitor('ana',ITEMS.toy.position),dog=s.residents[2];dog.position={x:a.position.x+.7,z:a.position.z};
 act(s,a,'pick','toy');act(s,a,'throw','biscoito',103000);const toy=s.items.find(i=>i.id==='toy');
 assert.equal(toy.reserved,'biscoito');act(s,visitor('bia',toy.position),'pick','toy',105000);assert.equal(heldItem(s,'bia'),undefined);
 act(s,visitor('bia',dog.position),'pet','biscoito',106000);assert.equal(dog.activity,'fetch');
 for(let i=0;i<220;i++)tickLife(s,.1,[a],103100+i*100);
 assert.equal(toy.holder,'ana');assert.equal(toy.reserved,undefined);
});
test('prepared chores reserve and hold actual objects, then release after interruption',()=>{
 const s=createLife(0);tickLife(s,.1,[],20000);
 assert.equal(s.items.find(i=>i.id==='record').reserved,'teo');
 for(let i=0;i<250;i++)tickLife(s,.1,[],20100+i*100);
 assert.ok(s.memories.some(m=>m.includes('organizou os discos')));assert.ok(parseLife(s));
 const dora=s.residents[0],a=visitor('ana',dora.position);act(s,a,'greet','dora',50000);
 assert.ok(!s.items.some(i=>i.holder==='dora'||i.reserved==='dora'));
});
test('snapshots reject duplicate ownership, impossible activities and off-floor actors',()=>{
 for(const mutate of [s=>{s.items[0].holder='ana';s.items[1].holder='ana';},s=>{s.residents[0].activity='nonsense';},s=>{s.residents[0].position={x:10.5,z:4.5};}]){const s=createLife();mutate(s);assert.equal(parseLife(s),null);}
});
test('watering and preparing dog rest require the appropriate object and proximity',()=>{
 const s=createLife(0),a=visitor('ana',{x:-1.25,z:2.5});
 assert.match(act(s,a,'fill','bowl'),/objeto/);
 a.position=ITEMS.watering.position;act(s,a,'pick','watering',103000);
 a.position={x:-1.25,z:2.5};act(s,a,'fill','bowl',106000);assert.match(s.memories.at(-1),/água/);
 a.position={x:-1.4,z:1.85};act(s,a,'rest','bed',109000);assert.equal(s.residents[2].activity,'walk');assert.ok(s.residents[2].path.length);
});
