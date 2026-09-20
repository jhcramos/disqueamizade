import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import handler from '../api/house-residents.ts';
import {createLife} from '../src/garage3d/residents/model.ts';
process.env.SUPABASE_URL='https://browser-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fake-browser-test-only';delete process.env.DEEPINFRA_API_KEY;delete process.env.TYPESAFE_API_KEY;
let row={revision:1,payload:{state:createLife(),visitors:{},commands:{},at:Date.now(),nextAI:Date.now()+120000}};
const original=globalThis.fetch;
globalThis.fetch=async(url,init)=>{if(String(url).startsWith('https://browser-test.invalid/rest/v1/house_resident_world')){if(init?.method==='PATCH'){const expected=new URL(url).searchParams.get('revision');if(expected&&Number(expected.slice(3))!==row.revision)return new Response('[]');row={...row,...JSON.parse(init.body)};return new Response(JSON.stringify([{revision:row.revision}]));}return new Response(JSON.stringify(row));}return original(url,init);};
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];let page;
async function enter(name){
 const context=await browser.newContext({viewport:{width:390,height:844}});await context.route('**/api/house-residents',async route=>{const req=route.request(),output={status:200};const res={setHeader(){},status(n){output.status=n;return this;},json(body){output.body=body;return this;}};await handler({method:'POST',headers:{host:'localhost:3000','x-resident-session':req.headers()['x-resident-session']},body:req.postDataJSON()},res);await route.fulfill({status:output.status,contentType:'application/json',body:JSON.stringify(output.body)});});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(`${process.env.BASE_URL||'http://localhost:3000'}/garagem`);await p.getByRole('textbox',{name:'Como podemos chamar você?'}).fill(name);await p.getByRole('button',{name:'Entrar na casa',exact:true}).click();await p.locator('.garage3d-canvas[data-resident-mode=online]').waitFor({timeout:30000});return p;
}
try{
 page=await enter('Ana');const b=await enter('Bruno');await b.getByRole('combobox',{name:'Escolher ambiente'}).selectOption('living');
 const deadline=Date.now()+12000;while(Date.now()<deadline&&!Object.values(row.payload.visitors).some(p=>p.visitor.name==='Bruno'&&p.visitor.position.z>0))await new Promise(r=>setTimeout(r,250));
 for(const p of [page,b]){
  if(await p.getByRole('button',{name:'Quero companhia',exact:true}).isVisible())await p.getByRole('button',{name:'Quero companhia',exact:true}).click();else{await p.getByRole('button',{name:/Moradores e objetos/}).click();await p.locator('.resident-picker select').selectOption('dora');}
  assert.equal(await p.locator('.resident-picker').count(),0,'Host picker is removed');assert.equal(await p.getByRole('complementary',{name:'Convite dos moradores'}).count(),0,'Welcome does not compete with the open host panel');assert.equal(await p.getByRole('textbox',{name:'O que você tem vontade de fazer?'}).count(),0,'Text input is secondary');
  await p.getByRole('button',{name:p===page?'Topo qualquer coisa':'Ouvir música juntos',exact:true}).click();if(p===page){const submit=await p.getByRole('button',{name:'Encontrar companhia',exact:true}).boundingBox();assert.ok(submit&&submit.y+submit.height<780,'CTA is visible above navigation');}if(p===page)await p.screenshot({path:'/tmp/house-quick-choices.png'});
  await p.getByRole('button',{name:'Encontrar companhia',exact:true}).click();
  if(p===page){await p.getByRole('button',{name:'Continuar passeando',exact:true}).click();await p.getByRole('button',{name:'Ver busca por companhia',exact:true}).waitFor();await p.screenshot({path:'/tmp/house-quick-waiting.png'});}
 }
 await b.getByRole('button',{name:'Gostei, enviar convite',exact:true}).waitFor({timeout:15000});
 assert.equal(await page.getByRole('button',{name:'Aceitar encontro',exact:true}).count(),0,'Review is private');
 await b.getByRole('button',{name:'Gostei, enviar convite',exact:true}).click();
 await page.getByRole('button',{name:'Aceitar encontro',exact:true}).waitFor({timeout:15000});
 assert.equal(await b.getByRole('button',{name:'Ir para a roda',exact:true}).count(),0,'No seat reservation before bilateral consent');
 await page.getByRole('button',{name:'Aceitar encontro',exact:true}).click();
 for(const p of [page,b])await p.getByRole('button',{name:'Ir para a roda',exact:true}).waitFor({timeout:15000});
 for(const p of [page,b])await p.getByRole('button',{name:'Ir para a roda',exact:true}).click();
 const seatedDeadline=Date.now()+20000;while(Date.now()<seatedDeadline&&!['Ana','Bruno'].every(name=>Object.values(row.payload.visitors).some(p=>p.visitor.name===name&&p.visitor.seat)))await new Promise(r=>setTimeout(r,300));
 const seated=Object.values(row.payload.visitors).filter(p=>p.visitor.seat);assert.equal(seated.length,2,'Visitors from different rooms reached real seats after one explicit click');assert.notEqual(seated[0].visitor.seat,seated[1].visitor.seat);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/house-company-mobile.png'});const card=await page.getByRole('complementary',{name:'Sua roda',exact:true}).boundingBox();assert.ok(card.x>=0&&card.x+card.width<=390,'Suggestion fits mobile');
 await page.getByRole('button',{name:/Ver encontro/}).click();await page.getByRole('button',{name:'Encerrar minha participação',exact:true}).click();await page.getByRole('complementary',{name:'Sua roda',exact:true}).waitFor({state:'hidden',timeout:10000});
 assert.deepEqual(errors,[]);console.log('PASS quick choices, compact waiting, cross-room consent and one-click real seating on mobile.');
}catch(e){if(page)await page.screenshot({path:'/tmp/house-quick-failure.png'});console.error(e);console.log(Object.values(row.payload.visitors).map(p=>({name:p.visitor.name,position:p.visitor.position,frozen:p.visitor.frozen})),row.payload.state.social);process.exitCode=1;}finally{await browser.close();}
