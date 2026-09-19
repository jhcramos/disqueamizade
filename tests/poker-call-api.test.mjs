import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {RoomServiceClient} from 'livekit-server-sdk';
import handler from '../api/house-residents.ts';import {createLife} from '../src/garage3d/residents/model.ts';
test('table video is opt-in, seat-authorized, idempotent, scoped, and independent from the hand',async()=>{
 const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','LIVEKIT_URL','LIVEKIT_API_KEY','LIVEKIT_API_SECRET','DEEPINFRA_API_KEY'],env=Object.fromEntries(keys.map(k=>[k,process.env[k]])),fetch=globalThis.fetch;
 const oldCreate=RoomServiceClient.prototype.createRoom,oldRemove=RoomServiceClient.prototype.removeParticipant;const removed=[],rooms=[];
 let row={revision:1,payload:{state:createLife(),visitors:{},commands:{},at:Date.now(),nextAI:Date.now()+120000}},conflicts=0;
 RoomServiceClient.prototype.createRoom=async opts=>{rooms.push(opts);return {};};RoomServiceClient.prototype.removeParticipant=async(room,id)=>{removed.push(id);};
 globalThis.fetch=async(url,init)=>{assert.match(String(url),/^https:\/\/poker-call-test.invalid\/rest/);if(init?.method==='PATCH'){if(conflicts-->0)return new Response('[]');row={...row,...JSON.parse(init.body)};return new Response(JSON.stringify([{revision:row.revision}]));}return new Response(JSON.stringify(row));};
 const req=async(token,extra={})=>{const output={};const res={setHeader(){},status(n){output.status=n;return this;},json(body){output.body=body;return this;}};await handler({method:'POST',headers:{host:'test.invalid',...(token?{'x-resident-session':token}:{})},body:{feature:'poker',visitor:{id:randomUUID(),name:'Pessoa',position:{x:5.35,z:2}},...extra}},res);return output;};
 const command=action=>({command:{action,id:randomUUID()}}),call=action=>({call:{action,id:randomUUID()}});
 try{
  Object.assign(process.env,{SUPABASE_URL:'https://poker-call-test.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only',LIVEKIT_URL:'wss://test.invalid',LIVEKIT_API_KEY:'test-key',LIVEKIT_API_SECRET:'test-secret-not-a-real-key'});delete process.env.DEEPINFRA_API_KEY;
  assert.equal((await req(null,call('join'))).status,403);
  const a=await req(null,command('join')),ta=a.body.identity.token,b=await req(null,command('join')),tb=b.body.identity.token;
  assert.equal(a.body.credentials,undefined);assert.equal(a.body.call.joined,false);
  const join=call('join');conflicts=1;const joined=await req(ta,join);assert.equal(joined.status,200);assert.equal(joined.body.call.count,1);
  const jwt=JSON.parse(Buffer.from(joined.body.credentials.token.split('.')[1],'base64url'));assert.equal(jwt.video.room,row.payload.pokerCall.room);assert.equal(jwt.video.canPublishData,false);assert.deepEqual(jwt.video.canPublishSources,['camera','microphone']);assert.ok(jwt.exp-Math.floor(Date.now()/1000)<=60&&jwt.exp-Math.floor(Date.now()/1000)>=58);assert.equal(rooms.at(-1).maxParticipants,4);
  await req(ta,join);assert.equal(row.payload.pokerCall.members.length,1);
  const other=await req(tb);assert.equal(other.body.credentials,undefined);assert.equal(other.body.call.joined,false);assert.equal(other.body.call.count,1);
  await req(ta,command('deal'));const hand=row.payload.poker.hand,cards=structuredClone(row.payload.poker.players.map(p=>p.cards));
  await req(ta,{visitor:{id:randomUUID(),name:'Pessoa',position:{x:5.35,z:2},frozen:true},callActive:true});assert.equal(row.payload.poker.players[0].left,undefined,'Opening other UI must not leave poker');
  const session=row.payload.pokerCall.members[0].session;await req(ta,call('leave'));assert.equal(row.payload.pokerCall.members.length,0);assert.ok(removed.includes(session));assert.equal(row.payload.poker.hand,hand);assert.deepEqual(row.payload.poker.players.map(p=>p.cards),cards);
  await req(ta,call('join'));await req(tb,call('join'));await req(null,{feature:undefined});assert.equal(row.payload.pokerCall.members.length,2,'Resident writes preserve call membership');
  await req(ta,command('leave'));assert.equal(row.payload.pokerCall.members.length,1);assert.equal(row.payload.pokerCall.members[0].id,b.body.identity.id);
  row.payload.pokerCall.members[0].seen=Date.now()-46000;await req(tb);assert.equal(row.payload.pokerCall.members.length,0,'Call heartbeat expires independently of poker');
  assert.ok(!JSON.stringify(row.payload).includes('test-secret'),'No credentials are persisted');
 }finally{globalThis.fetch=fetch;RoomServiceClient.prototype.createRoom=oldCreate;RoomServiceClient.prototype.removeParticipant=oldRemove;for(const[k,v]of Object.entries(env)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
