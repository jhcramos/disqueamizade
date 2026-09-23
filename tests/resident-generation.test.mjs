import test from 'node:test';import assert from 'node:assert/strict';
import {improviseEpisode} from '../server/domesticDialogue.ts';
import {freshDomestic,EPISODES} from '../src/garage3d/residents/domestic.ts';
test('an episode response after four seconds is retained; truncated reasoning is never spoken',async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.DEEPINFRA_API_KEY;process.env.DEEPINFRA_API_KEY='fake-test-only';
 const scene=freshDomestic(0);scene.phase='gather';const lines=EPISODES[scene.episode].beats.map(b=>b.text);
 try{globalThis.fetch=async(_url,{signal})=>{await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,4200);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(signal.reason);},{once:true});});return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({lines})}}]}));};
 const result=await improviseEpisode(scene);assert.equal(result.generatedBy,'zai-org/GLM-5.3-Flash');assert.deepEqual(result.lines,lines);
 globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:'<think>raciocínio'}}]}));assert.equal(await improviseEpisode(scene),null);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.DEEPINFRA_API_KEY;else process.env.DEEPINFRA_API_KEY=oldKey;}
});
