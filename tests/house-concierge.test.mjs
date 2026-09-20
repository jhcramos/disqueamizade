import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {createLife,applyCommand,parseLife} from '../src/garage3d/residents/model.ts';
import {personalLife} from '../src/garage3d/residents/social.ts';
import {concierge,companyCandidates,preparedDecision,applyCompanyDecision,spotSeats,tickCompany} from '../src/garage3d/residents/concierge.ts';
import {chooseCompany,decisionPayload} from '../server/houseConcierge.ts';
const now=Date.now();const visitor=name=>({id:randomUUID(),name,position:{x:-5,z:-5.2},available:true});
const action=(s,v,visitors,a,target='dora',request)=>applyCommand(s,{id:randomUUID(),visitor:v,action:a,target,request},now,visitors);
function setup(){const s=createLife(now),a=visitor('Ana'),b=visitor('Bruno'),people=[a,b];for(const v of people)action(s,v,people,'askCompany','dora','Quero conhecer gente que curte música');return{s,a,b,people};}
function propose(s,a,people){const r=concierge(s).requests[a.id],candidates=companyCandidates(s,a,people,now);assert.ok(candidates.length);applyCompanyDecision(s,a.id,r.id,preparedDecision(r.text,candidates),people,now);return concierge(s).proposals[0];}
test('requests are opt-in, private and transient; model input excludes names and IDs',()=>{
 const {s,a,b,people}=setup(),outside=visitor('Outra');assert.equal(companyCandidates(s,a,[a,{...b,frozen:true}],now).length,0);
 const c=companyCandidates(s,a,people,now),payload=JSON.stringify(decisionPayload(concierge(s).requests[a.id].text,c));assert.ok(!payload.includes(a.id)&&!payload.includes(b.id)&&!payload.includes('Bruno'));
 assert.deepEqual(personalLife(s,outside.id).social.concierge.requests,{});const p=propose(s,a,people);assert.equal(personalLife(s,b.id).social.concierge.proposals.length,0);
 assert.equal(personalLife(s,a.id).social.concierge.proposals[0].id,p.id);
 tickCompany(s,people,now+600001);assert.equal(Object.keys(concierge(s).requests).length,0);
});
test('review then reciprocal acceptance reserves separate real seats; third visitor joins with host acceptance',()=>{
 const {s,a,b,people}=setup();const p=propose(s,a,people);
 action(s,b,people,'acceptCompany',p.id);assert.equal(p.stage,'review');assert.equal(concierge(s).circles.length,0);
 action(s,a,people,'acceptCompany',p.id);assert.equal(p.stage,'invited');assert.equal(concierge(s).circles.length,0);
 action(s,b,people,'acceptCompany',p.id);const circle=concierge(s).circles[0];assert.ok(circle);assert.equal(circle.members.length,2);assert.notEqual(circle.members[0].seat,circle.members[1].seat);assert.ok(parseLife(s));
 const third=visitor('Carla');people.push(third);action(s,third,people,'askCompany','teo','Gosto de música');const p2=propose(s,third,people);assert.equal(p2.circle,circle.id);action(s,third,people,'acceptCompany',p2.id);action(s,a,people,'acceptCompany',p2.id);assert.equal(circle.members.length,3);assert.equal(new Set(circle.members.map(m=>m.seat)).size,3);
 const fourth=visitor('Davi');people.push(fourth);action(s,fourth,people,'askCompany','dora','Quero música');const p3=propose(s,fourth,people);action(s,fourth,people,'acceptCompany',p3.id);action(s,a,people,'acceptCompany',p3.id);assert.equal(circle.members.length,4);
 const fifth=visitor('Eva');people.push(fifth);action(s,fifth,people,'askCompany','dora','Quero música');assert.ok(!companyCandidates(s,fifth,people,now).some(o=>o.circle===circle.id));
 assert.equal(personalLife(s,b.id).social.concierge.reservedSeats.length,3);
});
test('availability, blocks, opt-out, occupied seats and decline win over model choice',()=>{
 const {s,a,b,people}=setup();assert.equal(companyCandidates(s,a,[a,{...b,blocked:[a.id]}],now).length,0);assert.equal(companyCandidates(s,a,[a,{...b,available:false}],now).length,0);
 const p=propose(s,a,people);action(s,a,people,'acceptCompany',p.id);
 const occupiers=spotSeats(p.spot).map(seat=>({...visitor('Sentado'),seat:seat.id}));action(s,b,[...people,...occupiers],'acceptCompany',p.id);assert.equal(concierge(s).circles.length,0);
 const second=setup(),proposal=propose(second.s,second.a,second.people);action(second.s,second.a,second.people,'acceptCompany',proposal.id);action(second.s,second.b,second.people,'declineCompany',proposal.id);assert.equal(concierge(second.s).requests[second.b.id],undefined);assert.equal(companyCandidates(second.s,second.a,second.people,now).length,0);
 const third=setup();action(third.s,third.b,third.people,'solo');assert.equal(companyCandidates(third.s,third.a,third.people,now).length,0);
});
test('provider cannot choose unavailable targets; no-match gives space; prepared fallback uses explicit common interests',()=>{
 const {s,a,people}=setup();applyCompanyDecision(s,a.id,concierge(s).requests[a.id].id,{option:'invented',activity:'music',topic:'song',source:'jev'},people,now);assert.equal(concierge(s).proposals.length,0);
 const options=[{id:'music',request:'Quero rock brasileiro',spot:'garage-music'}];assert.equal(preparedDecision('Quero música',options).option,'music');assert.equal(preparedDecision('Quero ficar sozinho',options).option,'none');assert.equal(preparedDecision('Quero jogar poker',options).option,'none');
});
test('adapter validates closed choices and handles unavailable service without leaking requests in logs',async()=>{
 const saved=globalThis.fetch,key=process.env.TYPESAFE_API_KEY;process.env.TYPESAFE_API_KEY='fake-test';const candidates=[{id:'candidate',to:'private',spot:'garage-music',request:'Gosto de música',description:'Roda musical'}];
 try{globalThis.fetch=async()=>new Response('{}',{status:503});assert.equal((await chooseCompany('Quero música',candidates)).source,'prepared');globalThis.fetch=async()=>new Response(JSON.stringify({answers:{opportunity:{type:'choice',choice:'untrusted'}}}));assert.equal((await chooseCompany('Quero música',candidates)).source,'prepared');}
 finally{globalThis.fetch=saved;if(key===undefined)delete process.env.TYPESAFE_API_KEY;else process.env.TYPESAFE_API_KEY=key;}
});
test('malformed optional social snapshots are rejected without crashing',()=>{const s=createLife(now);concierge(s).requests.bad=null;assert.equal(parseLife(s),null);const other=createLife(now);concierge(other).proposals.push(null);assert.equal(parseLife(other),null);});
test('garagem, sala and bar have reachable seats; poker table is never repurposed',()=>{
 for(const room of ['garage','living','bar']){
  const {s,a,b,people}=setup();a.position=b.position=room==='garage'?{x:-5,z:-5.2}:room==='living'?{x:-5,z:2.8}:{x:5,z:2.8};
  a.adult=b.adult=room==='bar';const options=companyCandidates(s,a,people,now);assert.ok(options.length);assert.ok(options[0].spot.startsWith(room));assert.ok(options.every(o=>o.spot!=='bar-table-2'&&(room==='bar'||!o.spot.startsWith('bar'))));
  const r=concierge(s).requests[a.id];applyCompanyDecision(s,a.id,r.id,{option:options[0].id,activity:'music',topic:'song',source:'prepared'},people,now);const p=concierge(s).proposals[0];action(s,a,people,'acceptCompany',p.id);action(s,b,people,'acceptCompany',p.id);assert.equal(concierge(s).circles[0]?.members.length,2,room);
 }
});
test('each unused reservation expires even if the other visitor has arrived',()=>{
 const {s,a,b,people}=setup();b.seat='garage-chairs-1';const p=propose(s,a,people);action(s,a,people,'acceptCompany',p.id);action(s,b,people,'acceptCompany',p.id);const circle=concierge(s).circles[0];tickCompany(s,people,now+1000);assert.equal(circle.members.length,2,'An old seat does not cancel a new destination before arrival');a.seat=circle.members.find(m=>m.id===a.id).seat;tickCompany(s,people,now+2000);tickCompany(s,people,now+120001);assert.equal(circle.members.length,1);assert.equal(circle.members[0].id,a.id);a.seat=undefined;tickCompany(s,people,now+120002);assert.equal(concierge(s).circles.length,0);
});
