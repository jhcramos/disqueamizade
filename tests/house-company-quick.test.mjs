import {areaById} from '../src/garage3d/areas.ts';
import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {createLife,applyCommand} from '../src/garage3d/residents/model.ts';
import {concierge,companyCandidates,preparedDecision,applyCompanyDecision,tickCompany} from '../src/garage3d/residents/concierge.ts';
const now=Date.now(),v=(name,position={...areaById('living').arrival})=>({id:randomUUID(),name,position,available:true});
const ask=(s,p,people,text)=>applyCommand(s,{id:randomUUID(),visitor:p,action:'askCompany',target:'dora',request:text},now,people);
test('quick any preference accepts music and cross-room options without overriding a refusal',()=>{
 const s=createLife(),a=v('Ana'),b=v('Bruno',{...areaById('garage').arrival}),people=[a,b];ask(s,a,people,'Topo qualquer coisa');ask(s,b,people,'Ouvir música juntos');
 const options=companyCandidates(s,a,people,now);assert.ok(options.length);const d=preparedDecision('Topo qualquer coisa',options);assert.notEqual(d.option,'none');assert.equal(d.activity,'music');assert.equal(preparedDecision('Quero ficar sozinho',options).option,'none');
});
test('waiting requests retry when someone becomes available, stay private and cancel cleanly',()=>{
 const s=createLife(),a=v('Ana'),b=v('Bruno'),people=[a,b];ask(s,a,people,'Papo tranquilo');ask(s,b,people,'Papo tranquilo');
 b.frozen=true;for(const p of people){const r=concierge(s).requests[p.id];applyCompanyDecision(s,p.id,r.id,preparedDecision(r.text,companyCandidates(s,p,people,now)),people,now);}
 assert.equal(concierge(s).proposals.length,0);b.frozen=false;tickCompany(s,people,now+6000);assert.equal(concierge(s).proposals.length,1);assert.equal(concierge(s).proposals[0].stage,'review');assert.equal(concierge(s).circles.length,0);
 applyCommand(s,{id:randomUUID(),visitor:a,action:'cancelCompany',target:'dora'},now+7000,people);tickCompany(s,people,now+14000);assert.equal(concierge(s).proposals.length,0);
});
test('bar requires both visitors to have confirmed adult access',()=>{
 const s=createLife(),a=v('Ana'),b=v('Bruno',{...areaById('dining').arrival}),people=[a,b];ask(s,a,people,'Topo qualquer coisa');ask(s,b,people,'Topo qualquer coisa');assert.equal(companyCandidates(s,a,people,now).length,0);
 a.adult=true;b.adult=true;const choices=companyCandidates(s,a,people,now);assert.ok(choices.some(c=>c.spot.startsWith('bar')));b.blocked=[a.id];assert.equal(companyCandidates(s,a,people,now).length,0);
});
test('cross-room accepted reservation survives travel but expires without arrival',()=>{
 const s=createLife(),a=v('Ana'),b=v('Bruno',{...areaById('garage').arrival}),people=[a,b];ask(s,a,people,'Topo qualquer coisa');ask(s,b,people,'Topo qualquer coisa');const r=concierge(s).requests[a.id],d=preparedDecision(r.text,companyCandidates(s,a,people,now));applyCompanyDecision(s,a.id,r.id,d,people,now);const p=concierge(s).proposals[0];assert.ok(p);
 for(const person of [a,b])applyCommand(s,{id:randomUUID(),visitor:person,action:'acceptCompany',target:p.id},now,people);
 assert.equal(concierge(s).circles.length,1);tickCompany(s,people,now+1000);assert.equal(concierge(s).circles[0].members.length,2);tickCompany(s,people,now+120001);assert.equal(concierge(s).circles.length,0);
});

test('matching visitors are not hidden by the candidate limit; circles respect their actual activity',()=>{
 const s=createLife(),a=v('Ana'),others=Array.from({length:7},(_,i)=>v('Visitante '+i)),b=v('Bruno'),people=[a,...others,b];ask(s,a,people,'Ouvir música juntos');for(const p of others)ask(s,p,people,'Papo tranquilo');ask(s,b,people,'Ouvir música juntos');const options=companyCandidates(s,a,people,now);assert.equal(options[0].to,b.id);
 assert.equal(preparedDecision('Papo tranquilo',[{id:'circle',circle:'a',activity:'music',request:'Topo qualquer coisa',spot:'garage-music'}]).option,'none');
});
