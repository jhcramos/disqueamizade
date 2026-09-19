import test from 'node:test';import assert from 'node:assert/strict';
import {improvise} from '../api/house-residents.ts';import {createLife} from '../src/garage3d/residents/model.ts';
test('a valid response after four seconds is retained; truncated reasoning is never spoken',async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.DEEPINFRA_API_KEY;process.env.DEEPINFRA_API_KEY='fake-test-only';
 try{globalThis.fetch=async(_url,{signal})=>{await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,4200);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(signal.reason);},{once:true});});return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'Quem topa escolher uma música comigo?'}}]}));};
 const speech=await improvise(createLife());assert.equal(speech.generatedBy,'zai-org/GLM-5.3-Flash');
 globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:'<think>raciocínio'}}]}));assert.equal(await improvise(createLife()),null);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.DEEPINFRA_API_KEY;else process.env.DEEPINFRA_API_KEY=oldKey;}
});
