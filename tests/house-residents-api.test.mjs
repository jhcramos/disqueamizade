import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import handler from '../api/house-residents.ts';
import {createLife} from '../src/garage3d/residents/model.ts';

test('resident API guards requests and owns anonymous identity independently of visitor input',async()=>{
 const saved={url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,ai:process.env.DEEPINFRA_API_KEY},originalFetch=globalThis.fetch;
 const generations=[];let providerStatus=200,finishReason='stop';
 let row={revision:0,payload:{network:{seq:7,members:{},packets:[]},state:createLife(),visitors:{},at:Date.now(),nextAI:Date.now()+120000,commands:{}}};
 globalThis.fetch=async(request,init)=>{
  if(String(request)==='https://api.deepinfra.com/v1/openai/chat/completions'){
   generations.push(JSON.parse(init.body));
   return new Response(JSON.stringify(providerStatus===200?{choices:[{finish_reason:finishReason,message:{content:'O café esfriou, mas a fofoca continua quentinha.'}}]}:{error:'unavailable'}),{status:providerStatus});
  }
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
  assert.deepEqual(row.payload.network,{seq:7,members:{},packets:[]},'residents preserve network state');assert.equal(response.body.network,undefined);
  assert.equal(response.status,200);assert.equal(response.body.generative,false);
  assert.notEqual(response.body.identity.id,claimed);
  assert.ok(row.payload.visitors[response.body.identity.id]);assert.equal(row.payload.visitors[claimed],undefined);
  assert.equal((await invoke({headers:{host:'example.invalid','x-resident-session':response.body.identity.token}})).status,429);
  process.env.DEEPINFRA_API_KEY='fake-provider-test-only';row.payload.nextAI=0;delete row.payload.state.speech;
  const generated=await invoke();
  assert.equal(generated.status,200);assert.equal(generated.body.generative,true);
  assert.equal(generations.length,1);
  assert.equal(generations[0].model,'zai-org/GLM-5.3-Flash');
  assert.equal(generations[0].reasoning_effort,'low');assert.equal(generations[0].max_tokens,256);
  assert.equal(generated.body.state.speech.generatedBy,'zai-org/GLM-5.3-Flash');
  assert.equal(generated.body.state.speech.text,'O café esfriou, mas a fofoca continua quentinha.');
  assert.ok(row.payload.nextAI>Date.now()+110000);
  await invoke();assert.equal(generations.length,1,'Other visitors reuse the same generation window');
  row.payload.nextAI=0;
  await invoke();assert.equal(generations.length,1,'An existing bubble is allowed to finish before spending on another line');
  delete row.payload.state.speech;providerStatus=503;
  assert.equal((await invoke()).status,200,'Provider failures do not interrupt household actions');
  await invoke();assert.equal(generations.length,2,'No immediate retries after provider failure');
  providerStatus=200;finishReason='length';row.payload.nextAI=0;delete row.payload.state.speech;
  const truncated=await invoke();assert.equal(truncated.body.state.speech,undefined,'Incomplete output must not be displayed as dialogue');
 }finally{
  globalThis.fetch=originalFetch;
  for(const [key,value]of Object.entries({SUPABASE_URL:saved.url,SUPABASE_SERVICE_ROLE_KEY:saved.key,DEEPINFRA_API_KEY:saved.ai})){if(value===undefined)delete process.env[key];else process.env[key]=value;}
 }
});
