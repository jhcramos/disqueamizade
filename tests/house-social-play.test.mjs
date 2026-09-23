import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {createLife,tickLife,applyCommand,parseLife,ITEMS} from '../src/garage3d/residents/model.ts';
import {personalLife,tickSocial} from '../src/garage3d/residents/social.ts';
import {ballFlightPose} from '../src/garage3d/residents/ball.ts';
const visitor=(id,x=-5,z=2.8)=>({id,name:id,position:{x,z}}),a=()=>visitor('Ana'),b=()=>visitor('Bia',-4,2.8);
const command=(s,v,action,target,now,visitors)=>applyCommand(s,{id:randomUUID(),visitor:v,action,target},now,visitors);
test('Layla approaches the holder and waits eagerly, with exactly one reserved fetch and return',()=>{
 const s=createLife(10000),v=visitor('Ana',ITEMS.toy.position.x,ITEMS.toy.position.z);s.residents[2].position={x:-5,z:-1};
 command(s,v,'pick','toy',10000,[v]);tickLife(s,.1,[v],10100);assert.equal(s.residents[2].activity,'eager');
 command(s,v,'throw','biscoito',12500,[v]);const ball=s.items.find(i=>i.id==='toy');assert.ok(ball.flight);assert.equal(ball.reserved,'biscoito');
 const start=ballFlightPose(ball.flight,12500),mid=ballFlightPose(ball.flight,13500),end=ballFlightPose(ball.flight,16000);assert.equal(start.x,v.position.x);assert.ok(mid.y>.9);assert.ok(Math.abs(end.y-.14)<1e-8);
 for(let i=0;i<220;i++)tickLife(s,.1,[v],12600+i*100);assert.equal(ball.holder,v.id);assert.equal(s.residents[2].activity,'eager');assert.equal(s.items.filter(i=>i.id==='toy').length,1);
 tickLife(s,.1,[{...v,frozen:true}],36000);assert.notEqual(s.residents[2].activity,'eager');assert.ok(parseLife(s));
});
test('introductions require recipient consent and do not expose invitations to other visitors',()=>{
 const s=createLife(),one=a(),two=b(),others=[one,two];
 command(s,one,'introduce','dora',10000,others);let invitation=s.social.invites[0];assert.equal(invitation.stage,'pending');assert.equal(s.speech,undefined);
 assert.equal(personalLife(s,'Other').social.invites.length,0);assert.equal(personalLife(s,one.id).social.invites.length,1);
 assert.match(command(s,one,'acceptHost',invitation.id,11000,others),/não está disponível/);
 command(s,two,'acceptHost',invitation.id,12000,others);assert.equal(invitation.stage,'ready');assert.ok(invitation.point);assert.ok(s.speech.text.includes('Ana'));assert.ok(parseLife(s));
 command(s,one,'dismissHost',invitation.id,13000,others);assert.equal(s.social.invites.length,0);
});
test('solo mode, blocking, different rooms, busy and stale presence exclude candidates',()=>{
 for(const alter of [v=>{v.frozen=true;},v=>{v.available=false;},v=>{v.position={x:-5,z:-7};},v=>{v.blocked=['Ana'];}]){
  const s=createLife(),one=a(),two=b();alter(two);command(s,one,'introduce','dora',10000,[one,two]);assert.equal(s.social.invites.length,0);
 }
 const s=createLife(),one=a(),two=b();command(s,two,'solo','dora',9000,[one,two]);command(s,one,'introduce','dora',10000,[one,two]);assert.equal(s.social.invites.length,0);
 command(s,two,'socialOn','dora',11000,[one,two]);command(s,one,'introduce','dora',12000,[one,two]);assert.equal(s.social.invites.length,1);
 command(s,two,'solo','dora',13000,[one,two]);assert.equal(s.social.invites.length,0);
});
test('expiry, disconnect and busy transitions clear invitations without public rejection messages',()=>{
 for(const finish of ['expire','leave','busy']){const s=createLife(),one=a(),two=b();command(s,one,'introduce','teo',10000,[one,two]);s.social.welcomed={Ana:10000,Bia:10000};tickSocial(s,finish==='leave'?[one]:[one,{...two,frozen:finish==='busy'}],finish==='expire'?41000:11000);assert.equal(s.social.invites.length,0);assert.equal(s.speech,undefined);}
});
test('passing the ball keeps ownership until acceptance and never takes an occupied hand',()=>{
 const s=createLife(),one=a(),two=b(),ball=s.items.find(i=>i.id==='toy');ball.holder=one.id;
 command(s,one,'passToy','biscoito',10000,[one,two]);const offer=s.social.invites[0];assert.equal(ball.holder,one.id);
 command(s,two,'acceptHost',offer.id,12000,[one,two]);assert.equal(ball.holder,two.id);assert.ok(ball.flight);assert.equal(s.social.invites.length,0);
 const another=createLife(),toy=another.items.find(i=>i.id==='toy');toy.holder=one.id;command(another,one,'passToy','biscoito',10000,[one,two]);another.items[0].holder=two.id;command(another,two,'acceptHost',another.social.invites[0].id,12000,[one,two]);assert.equal(toy.holder,one.id);assert.equal(another.social.invites.length,0);
});
test('one invitation at a time, refusals throttle repeat requests and welcomes happen once',()=>{
 const s=createLife(),one=a(),two=b();tickSocial(s,[one,two],10000);assert.equal(s.social.invites.length,2);command(s,one,'introduce','dora',11000,[one,two]);assert.equal(s.social.invites.length,1);
 command(s,one,'together','teo',12000,[one,two]);assert.equal(s.social.invites.length,1);
 command(s,two,'declineHost',s.social.invites[0].id,13000,[one,two]);assert.equal(s.speech,undefined);command(s,one,'introduce','teo',14000,[one,two]);assert.equal(s.social.invites.length,0);tickSocial(s,[one,two],15000);assert.equal(s.social.invites.length,0);
});
test('legacy snapshots migrate and malformed flights or invitation destinations are rejected',()=>{
 const s=createLife();delete s.social;assert.ok(parseLife(s).social);const bad=createLife();bad.items[3].flight={from:{x:NaN,z:0},to:{x:0,z:0},start:0,duration:1};assert.equal(parseLife(bad),null);
 const good=createLife(),one=a(),two=b();command(good,one,'introduce','dora',10000,[one,two]);good.social.invites[0].point={x:100,z:100};assert.equal(parseLife(good),null);
});
