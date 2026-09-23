import {areaById,planPoint,POOL,OPENINGS} from '../src/garage3d/areas.ts';
import {toShared} from '../src/garage3d/coordinates.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import handler from '../api/house-residents.ts';

test('relay requires a signed session, preserves other world domains and retries concurrent writes',async()=>{
 const saved={url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY},original=globalThis.fetch;
 let row={revision:1,payload:{state:{marker:'resident state'},poker:{marker:'poker state'}}},conflict=true,reads=0;
 process.env.SUPABASE_URL='https://network-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fake-network-unit-only';
 globalThis.fetch=async(url,init)=>{
  assert.ok(String(url).startsWith('https://network-test.invalid/rest/v1/house_resident_world'));
  if(init?.method==='PATCH'){
   if(conflict){conflict=false;row.revision++;row.payload.poker.marker='concurrent poker state';return new Response('[]');}
   row={...row,...JSON.parse(init.body)};return new Response(JSON.stringify([{revision:row.revision}]));
  }
  reads++;return new Response(JSON.stringify(row));
 };
 const invoke=async(body,token,extra={})=>{
  const out={status:200};await handler({method:'POST',headers:{host:'example.invalid',origin:'https://example.invalid',...(token?{'x-house-session':token}:{})},body:{...body,feature:"network"},...extra},{setHeader(){},status(n){out.status=n;return this;},json(value){out.body=value;return this;}});return out;
 };
 try{
  const id=randomUUID(),body={id,messages:[],channels:['disque-house-3d-v1'],cursor:0};
  assert.equal((await invoke(body)).status,401);
  assert.equal((await invoke(body,'forged')).status,401);
  assert.equal((await invoke({hello:true},undefined,{headers:{host:'example.invalid',origin:'https://foreign.invalid'}})).status,403);
  const hello=await invoke({hello:true});assert.equal(hello.status,200);assert.equal(reads,0,'handshake does not claim an avatar before the client receives its token');
  body.messages=[{id:randomUUID(),channel:'disque-house-3d-v1',data:{event:'hello',data:{id,name:'Teste',avatar:0,room:'garage',position:toShared(areaById('garage').arrival,'garage'),busy:false}}}];
  const reply=await invoke(body,hello.body.token);assert.equal(reply.status,200);assert.equal(reads,2);
  assert.deepEqual(row.payload.state,{marker:'resident state'});assert.equal(row.payload.poker.marker,'concurrent poker state');
  assert.equal(row.payload.network.members[id].person.name,'Teste');assert.equal(JSON.stringify(reply.body).includes(hello.body.token),false);
  const other=await invoke({hello:true});assert.equal((await invoke(body,other.body.token)).status,403);
 }finally{globalThis.fetch=original;for(const [key,value]of Object.entries({SUPABASE_URL:saved.url,SUPABASE_SERVICE_ROLE_KEY:saved.key})){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
