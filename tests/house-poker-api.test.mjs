import {areaById,planPoint,POOL,OPENINGS} from '../src/garage3d/areas.ts';
import {TABLE} from '../src/garage3d/poker/model.ts';
import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import handler from '../api/house-residents.ts';import {createLife} from '../src/garage3d/residents/model.ts';
test('poker endpoint uses signed identities, private hands, deduplication and preserves resident state across CAS',async()=>{
 const saved={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY,DEEPINFRA_API_KEY:process.env.DEEPINFRA_API_KEY},original=globalThis.fetch;
 let row={revision:1,payload:{state:createLife(),visitors:{},commands:{},at:Date.now(),nextAI:Date.now()+120000}},conflicts=0;
 globalThis.fetch=async(url,init)=>{
  assert.match(String(url),/^https:\/\/poker-test.invalid\/rest\/v1\/house_resident_world/);
  if(init?.method==='PATCH'){if(conflicts-->0)return new Response('[]');row={...row,...JSON.parse(init.body)};return new Response(JSON.stringify([{revision:row.revision}]));}
  return new Response(JSON.stringify(row));
 };
 const request=async(token,action,extra={})=>{
  const output={status:200};const res={setHeader(){},status(n){output.status=n;return this;},json(body){output.body=body;return this;}};
  const body={feature:'poker',visitor:{id:randomUUID(),name:'Jogador',position:{x:TABLE.x,z:TABLE.z+1.3}},...(action?{command:{id:randomUUID(),action}}:{}),...extra};
  await handler({method:'POST',headers:{host:'test.invalid',...(token?{'x-resident-session':token}:{})},body},res);return output;
 };
 try{
  process.env.SUPABASE_URL='https://poker-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fake-poker-test-only';delete process.env.DEEPINFRA_API_KEY;
  assert.equal((await request('forged','join')).status,401);
  assert.equal((await request(null,'join',{visitor:{id:randomUUID(),name:'Teste',position:areaById('garage').arrival}})).status,400);
  const a=await request(null,'join'),b=await request(null,'join');assert.equal(a.status,200);assert.equal(b.body.game.players.length,2);
  const ta=a.body.identity.token,tb=b.body.identity.token;
  const cmd={id:randomUUID(),action:'deal'};conflicts=1;
  const dealt=await request(ta,null,{command:cmd});assert.equal(dealt.body.game.hand,1);assert.equal(dealt.body.game.players[0].cards.length,2);assert.equal(dealt.body.game.players[1].cards.length,0);
  const again=await request(ta,null,{command:cmd});assert.equal(again.body.game.hand,1);
  const opponent=await request(tb);assert.equal(opponent.body.game.players[0].cards.length,0);assert.equal(opponent.body.game.players[1].cards.length,2);
  assert.equal(dealt.body.game.deck,undefined);assert.equal(row.payload.state.residents.length,3);
  const oldPoker=structuredClone(row.payload.poker);await request(null,null,{feature:undefined});assert.deepEqual(row.payload.poker,oldPoker,'Resident endpoint preserves private poker state without returning it');
  const publicLife=await request(null,null,{feature:undefined});assert.equal(publicLife.body.poker,undefined);assert.equal(publicLife.body.state.poker,undefined);
  assert.equal((await request(ta,null,{command:{id:randomUUID(),action:'invent-cards'}})).status,400);
 }finally{globalThis.fetch=original;for(const[k,v]of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
