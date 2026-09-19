import assert from 'node:assert/strict';
import residents from '../api/house-residents.ts';import {createLife} from '../src/garage3d/residents/model.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
process.env.SUPABASE_URL='https://network-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fake-network-unit-only';delete process.env.DEEPINFRA_API_KEY;delete process.env.TYPESAFE_API_KEY;
let row={revision:1,payload:{state:createLife(),visitors:{},commands:{},at:Date.now(),nextAI:Date.now()+120000}};
const original=globalThis.fetch;
globalThis.fetch=async(url,init)=>{if(String(url).startsWith('https://network-test.invalid/rest/v1/house_resident_world')){
 if(init?.method==='PATCH'){const expected=new URL(url).searchParams.get('revision');if(expected&&Number(expected.slice(3))!==row.revision)return new Response('[]');row={...row,...JSON.parse(init.body)};return new Response(JSON.stringify([{revision:row.revision}]));}return new Response(JSON.stringify(row));}return original(url,init);};
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],packets=[],blocked=new Set();let pages=[];
try{
 for(const name of ['Ana Rede','Bruno Rede','Cris Rede']){
  // Separate storage/network contexts: BroadcastChannel cannot connect these sessions.
  const context=await browser.newContext({viewport:{width:1440,height:1100}});
  await context.route('**/api/house-residents',async route=>{
   const isNetwork=route.request().postDataJSON()?.feature==='network';
   if(isNetwork&&blocked.has(name)){await route.abort();return;}
   const req=route.request(),out={status:200};await residents({method:'POST',headers:{...req.headers(),host:'localhost:3000'},body:req.postDataJSON()},{setHeader(){},status(n){out.status=n;return this;},json(body){out.body=body;return this;}});
   if(isNetwork)packets.push({name,body:out.body});await route.fulfill({status:out.status,contentType:'application/json',body:JSON.stringify(out.body)});
  });
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:3000/garagem?network=1');
  await p.getByRole('textbox',{name:'Como podemos chamar você?'}).fill(name);await p.getByRole('button',{name:'Entrar na casa',exact:true}).click();pages.push(p);
 }
 const [a,b,c]=pages;
 await a.locator('.house3d-person[aria-label="Ver Bruno Rede"]').waitFor({state:'attached'});
 await b.locator('.house3d-person[aria-label="Ver Ana Rede"]').waitFor({state:'attached'});
 await a.locator('.house3d-person[aria-label="Ver Cris Rede"]').waitFor({state:'attached'});
 assert.equal(await a.locator('.house3d-person').count(),3);
 await a.getByRole('textbox',{name:'Mensagem pública'}).fill('Teste de sala entre computadores');await a.getByRole('button',{name:'Enviar mensagem',exact:true}).click();
 await b.locator('.room-chat-message').filter({hasText:'Teste de sala entre computadores'}).waitFor();
 await a.getByRole('button',{name:'Ver pessoas em lista'}).click();await a.locator('.garage-people button').filter({hasText:'Bruno Rede'}).click();
 await a.getByRole('button',{name:'Mandar mensagem',exact:true}).click();await b.getByRole('button',{name:'Aceitar mensagem',exact:true}).click();
 await a.getByRole('textbox',{name:'Mensagem privada',exact:true}).fill('Teste privado isolado');await a.getByRole('button',{name:'Enviar privada',exact:true}).click();
 await b.getByRole('log',{name:'Mensagens privadas'}).getByText('Teste privado isolado',{exact:false}).waitFor();
 assert.ok(!packets.filter(p=>p.name==='Cris Rede').some(p=>JSON.stringify(p.body).includes('Teste privado isolado')));
 assert.equal(await c.getByText('Teste privado isolado',{exact:false}).count(),0);
 await b.getByRole('button',{name:'Encerrar mensagens',exact:true}).click();
 await b.getByRole('button',{name:/Sala de estar/}).first().click();
 await b.waitForTimeout(2200);assert.equal(await a.locator('.house3d-person').count(),3);
 await b.getByRole('button',{name:'Primeira pessoa',exact:true}).click();
 const before=await b.locator('.garage3d-canvas').getAttribute('data-position');
 await b.keyboard.down('s');await b.waitForTimeout(1200);await b.keyboard.up('s');
 assert.notEqual(await b.locator('.garage3d-canvas').getAttribute('data-position'),before);
 await b.waitForTimeout(2500);assert.equal(await a.locator('.house3d-person').count(),3);
 const latest=packets.filter(p=>p.name==='Ana Rede'&&p.body.roster).at(-1).body.roster.find(p=>p.name==='Bruno Rede');
 assert.deepEqual(latest.position,Object.values(row.payload.network.members).find(m=>m.person.name==='Bruno Rede').person.position);
 blocked.add('Bruno Rede');await b.waitForTimeout(4000);
 assert.equal(await a.locator('.house3d-person').count(),3,'a brief network interruption preserves presence');
 blocked.delete('Bruno Rede');await b.waitForTimeout(4000);
 assert.equal(await b.locator('.house3d-person').count(),3);
 await b.getByRole('button',{name:'Sair da casa',exact:true}).click();
 await a.locator('.house3d-person[aria-label="Ver Bruno Rede"]').waitFor({state:'detached',timeout:15000});
 assert.deepEqual(errors,[]);console.log('PASS isolated contexts: presence, room chat, consent/private isolation, movement, reconnect, room switch and departure.');
}catch(e){if(pages[0])await pages[0].screenshot({path:'/tmp/network-failure.png'});throw e;}finally{await browser.close();}
