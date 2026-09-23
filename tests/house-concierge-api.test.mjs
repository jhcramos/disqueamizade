import {areaById} from '../src/garage3d/areas.ts';
import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import handler from '../api/house-residents.ts';import {createLife} from '../src/garage3d/residents/model.ts';
test('Jev integration reserves calls before fetch, revalidates consent, survives CAS retry, and keeps seat assignments private',async()=>{
 const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','DEEPINFRA_API_KEY','TYPESAFE_API_KEY'],saved=Object.fromEntries(keys.map(k=>[k,process.env[k]])),fetch=globalThis.fetch;
 let calls=0,failCAS=false;let row={revision:1,payload:{state:createLife(),visitors:{},commands:{},at:Date.now(),nextAI:Date.now()+120000,poker:{sentinel:'keep'}}};
 globalThis.fetch=async(url,init)=>{
  if(String(url).includes('typesafe.ai')){calls++;assert.ok(row.payload.state.cooldown['company-global']>Date.now(),'budget persisted before external call');const body=JSON.parse(init.body);assert.ok(!JSON.stringify(body).includes('Bruno'));const answers={};for(const [id,q]of Object.entries(body.questions)){const choice=id==='opportunity'?'option_0':id==='activity'?'music':'song';answers[id]={type:'choice',choice,confidence:.9,probabilities:Object.fromEntries(Object.keys(q.criteria).map(k=>[k,k===choice?1:0]))};}return new Response(JSON.stringify({answers,usage:{input_tokens:100,output_tokens:10}}));}
  assert.match(String(url),/^https:\/\/concierge-test.invalid\/rest/);if(init?.method==='PATCH'){if(failCAS){failCAS=false;return new Response('[]');}row={...row,...JSON.parse(init.body)};return new Response(JSON.stringify([{revision:row.revision}]));}return new Response(JSON.stringify(row));
 };
 const request=async(client,command)=>{for(const entry of Object.values(row.payload.visitors))entry.seen=Date.now()-500;
  const out={};const res={setHeader(){},status(n){out.status=n;return this;},json(body){out.body=body;return this;}};
  await handler({method:'POST',headers:{host:'test.invalid',...(client.token?{'x-resident-session':client.token}:{})},body:{visitor:{id:client.id,name:client.name,position:{...areaById('living').arrival},blocked:client.blocked},command}},res);if(out.body.identity){client.token=out.body.identity.token;client.serverId=out.body.identity.id;}return out;
 };
 const cmd=(action,target='dora',text)=>({id:randomUUID(),action,target,request:text});
 try{
  process.env.SUPABASE_URL='https://concierge-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fake-concierge-test-only';process.env.TYPESAFE_API_KEY='fake-test-only';delete process.env.DEEPINFRA_API_KEY;
  const a={id:randomUUID(),name:'Ana'},b={id:randomUUID(),name:'Bruno'},other={id:randomUUID(),name:'Outra'};await request(a);await request(b);
  await request(a,cmd('askCompany','dora','Gosto de música'));assert.equal(calls,0,'No model call with no candidates');
  const ask=cmd('askCompany','teo','Quero música');failCAS=true;const sent=await request(b,ask);assert.equal(sent.status,200);assert.equal(calls,1,'CAS retry cannot duplicate evaluation');const proposal=sent.body.state.social.concierge.proposals[0];assert.equal(proposal.source,'jev');
  await request(b,ask);assert.equal(calls,1,'Network retry cannot duplicate evaluation');
  assert.equal((await request(other)).body.state.social.concierge.proposals.length,0);
  assert.equal((await request(a)).body.state.social.concierge.proposals.length,0,'Review hidden until requester agrees');
  await request(b,cmd('acceptCompany',proposal.id));await request(other,cmd('acceptCompany',proposal.id));assert.equal(row.payload.state.social.concierge.circles.length,0);
  await request(a,cmd('acceptCompany',proposal.id));assert.equal(row.payload.state.social.concierge.circles[0].members.length,2);
  const view=await request(other);assert.deepEqual(view.body.state.social.concierge.circles,[]);assert.equal(view.body.state.social.concierge.reservedSeats.length,2);assert.deepEqual(row.payload.poker,{sentinel:'keep'});
  const invalid=await request(a,cmd('askCompany','dora','x'.repeat(241)));assert.equal(invalid.status,400);
  const c={id:randomUUID(),name:'Carla'},d={id:randomUUID(),name:'Davi'};await request(c);await request(d);await request(c,cmd('askCompany','dora','Papo tranquilo'));const quick=await request(d,cmd('askCompany','dora','Topo qualquer coisa'));assert.equal(calls,1,'Quick choices do not call Jev even when configured');assert.equal(quick.body.state.social.concierge.proposals[0].source,'prepared');
 }finally{globalThis.fetch=fetch;for(const[k,v]of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
