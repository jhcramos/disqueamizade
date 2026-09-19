import test from 'node:test';import assert from 'node:assert/strict';
import {createLife,tickLife,applyCommand,options,NAMES,ITEMS} from '../src/garage3d/residents/model.ts';
test('Layla has a named primary throw action and returns the only ball to its thrower',()=>{
 assert.equal(NAMES.biscoito,'Layla');const s=createLife(10000),v={id:'ana',name:'Ana',position:{...ITEMS.toy.position}},other={id:'bruno',name:'Bruno',position:{x:-7,z:2.7}};s.residents[2].position={x:-5.2,z:2.1};
 applyCommand(s,{id:'pick',visitor:v,action:'pick',target:'toy'},10000,[v]);assert.equal(options(s,'biscoito',v.id)[0].label,'Jogar bolinha para Layla');
 applyCommand(s,{id:'throw',visitor:v,action:'throw',target:'biscoito'},12500,[v]);const ball=s.items.find(i=>i.id==='toy');assert.ok(ball.flight);assert.equal(ball.reserved,'biscoito');assert.equal(options(s,'toy',other.id).length,0);
 let carried=false;for(let i=0;i<350;i++){tickLife(s,.1,[v],12600+i*100);if(ball.holder==='biscoito')carried=true;}
 assert.ok(carried,'She carries the ball back');assert.equal(ball.holder,v.id);assert.equal(s.items.filter(i=>i.id==='toy').length,1);assert.equal(ball.reserved,undefined);assert.ok(s.memories.some(m=>m.includes('Layla devolveu')));
});
