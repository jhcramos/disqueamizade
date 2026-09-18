import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import handler from '../api/house-residents.ts';
import {createLife} from '../src/garage3d/residents/model.ts';

test('resident API guards requests and owns anonymous identity independently of visitor input',async()=>{
 const saved={url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,ai:process.env.DEEPINFRA_API_KEY},originalFetch=globalThis.fetch;
 let row={revision:0,payload:{state:createLife(),visitors:{},at:Date.now(),nextAI:Date.now()+120000,commands:{}}};
 globalThis.fetch=async(request,init)=>{
  assert.match(String(request),/^https:\/\/resident-test\.invalid\/rest\/v1\/house_resident_world/);
  if(init?.method==='PATCH'){row={...row,...JSON.parse(init.body)};return new Response(JSON.stringify([{revision:row.revision}]),{status:200});}
  return new Response(JSON.stringify(row),{status:200});
 };
 const invoke=async(overrides={})=>{
  const output={status:200,body:null};
  const res={setHeader(){},status(n){output.status=n;return this;},json(body){output.body=body;return this;}};
  await handler({method:'POST',headers:{host:'example.invalid',origin:'https://example.invalid'},body:{visitor:{id:randomUUID(),name:'Teste',position:{x:-5,z:2.8}}},...overrides},res);return output;
 };
 try{
  delete process.env.SUPABASE_URL;delete process.env.SUPABASE_SERVICE_ROLE_KEY;delete process.env.DEEPINFRA_API_KEY;
  assert.equal((await invoke()).status,503);
  process.env.SUPABASE_URL='https://resident-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fake-unit-test-only';
  assert.equal((await invoke({method:'GET'})).status,405);
  assert.equal((await invoke({headers:{host:'example.invalid',origin:'https://foreign.invalid'}})).status,403);
  assert.equal((await invoke({body:{}})).status,400);
  assert.equal((await invoke({headers:{host:'example.invalid','x-resident-session':'forged'}})).status,401);
  const claimed=randomUUID();
  const response=await invoke({body:{visitor:{id:claimed,name:'Teste',position:{x:-5,z:2.8}}}});
  assert.equal(response.status,200);assert.equal(response.body.generative,false);
  assert.notEqual(response.body.identity.id,claimed);
  assert.ok(row.payload.visitors[response.body.identity.id]);assert.equal(row.payload.visitors[claimed],undefined);
  assert.equal((await invoke({headers:{host:'example.invalid','x-resident-session':response.body.identity.token}})).status,429);
 }finally{
  globalThis.fetch=originalFetch;
  for(const [key,value]of Object.entries({SUPABASE_URL:saved.url,SUPABASE_SERVICE_ROLE_KEY:saved.key,DEEPINFRA_API_KEY:saved.ai})){if(value===undefined)delete process.env[key];else process.env[key]=value;}
 }
});
