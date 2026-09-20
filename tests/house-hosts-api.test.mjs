import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import handler from '../api/house-residents.ts';import {createLife} from '../src/garage3d/residents/model.ts';
test('host invites bind to signed identities, stay personal and preserve poker state',async()=>{
 const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','DEEPINFRA_API_KEY'],saved=Object.fromEntries(keys.map(k=>[k,process.env[k]])),fetch=globalThis.fetch;
 let row={revision:1,payload:{state:createLife(),visitors:{},commands:{},at:Date.now(),nextAI:Date.now()+120000,poker:{sentinel:'keep'},pokerCall:{sentinel:'keep'}}};
 globalThis.fetch=async(url,init)=>{assert.match(String(url),/^https:\/\/hosts-test.invalid\/rest/);if(init?.method==='PATCH'){row={...row,...JSON.parse(init.body)};return new Response(JSON.stringify([{revision:row.revision}]));}return new Response(JSON.stringify(row));};
 const request=async(client,command)=>{for(const entry of Object.values(row.payload.visitors))entry.seen=Date.now()-500;
  const out={};const res={setHeader(){},status(n){out.status=n;return this;},json(body){out.body=body;return this;}};
  await handler({method:'POST',headers:{host:'test.invalid',...(client.token?{'x-resident-session':client.token}:{})},body:{visitor:{id:client.id,name:client.name,position:{x:-5,z:2.8},blocked:client.blocked},command}},res);if(out.body.identity){client.token=out.body.identity.token;client.serverId=out.body.identity.id;}return out;
 };
 const cmd=(action,target)=>({id:randomUUID(),action,target});
 try{
  process.env.SUPABASE_URL='https://hosts-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fake-hosts-test-only';delete process.env.DEEPINFRA_API_KEY;
  const a={id:randomUUID(),name:'Ana'},b={id:randomUUID(),name:'Bia'},other={id:randomUUID(),name:'Outra'};await request(a);await request(b);
  const c=cmd('introduce','dora');const sent=await request(a,c);assert.equal(sent.status,200);const invite=sent.body.state.social.invites.find(i=>i.kind==='meet');assert.equal(invite.from,a.serverId);assert.equal(invite.to,b.serverId);
  await request(a,c);assert.equal(row.payload.state.social.invites.filter(i=>i.kind==='meet').length,1,'Retry does not resend');
  const outsider=await request(other,cmd('acceptHost',invite.id));assert.equal(outsider.body.state.social.invites.some(i=>i.id===invite.id),false);assert.equal(row.payload.state.social.invites.find(i=>i.id===invite.id).stage,'pending');
  const accepted=await request(b,cmd('acceptHost',invite.id));assert.equal(accepted.body.state.social.invites.find(i=>i.id===invite.id).stage,'ready');
  await request(a,cmd('solo','dora'));assert.equal(row.payload.state.social.invites.some(i=>i.id===invite.id),false);const view=await request(other);assert.equal(view.body.state.social.solo[a.serverId],undefined);
  assert.deepEqual(row.payload.poker,{sentinel:'keep'});assert.deepEqual(row.payload.pokerCall,{sentinel:'keep'});
 }finally{globalThis.fetch=fetch;for(const[k,v]of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
