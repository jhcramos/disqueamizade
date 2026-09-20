import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import handler from '../api/house-residents.ts';
import {createLife} from '../src/garage3d/residents/model.ts';
process.env.SUPABASE_URL='https://browser-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fake-browser-test-only';delete process.env.DEEPINFRA_API_KEY;
let row={revision:1,payload:{state:createLife(),visitors:{},commands:{},at:Date.now(),nextAI:Date.now()+120000}};
const original=globalThis.fetch;
globalThis.fetch=async(url,init)=>{if(String(url).startsWith('https://browser-test.invalid/rest/v1/house_resident_world')){if(init?.method==='PATCH'){const expected=new URL(url).searchParams.get('revision');if(expected&&Number(expected.slice(3))!==row.revision)return new Response('[]');row={...row,...JSON.parse(init.body)};return new Response(JSON.stringify([{revision:row.revision}]));}return new Response(JSON.stringify(row));}return original(url,init);};
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];let page;
async function enter(name){
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.route('**/api/house-residents',async route=>{const req=route.request(),output={status:200};const res={setHeader(){},status(n){output.status=n;return this;},json(body){output.body=body;return this;}};await handler({method:'POST',headers:{host:'localhost:3000','x-resident-session':req.headers()['x-resident-session']},body:req.postDataJSON()},res);await route.fulfill({status:output.status,contentType:'application/json',body:JSON.stringify(output.body)});});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(`${process.env.BASE_URL||'http://localhost:3000'}/garagem`);await p.getByRole('textbox',{name:'Como podemos chamar você?'}).fill(name);await p.getByRole('button',{name:'Entrar na casa',exact:true}).click();await p.locator('.garage3d-canvas[data-resident-mode=online]').waitFor({timeout:30000});return p;
}
try{
 page=await enter('Ana');const b=await enter('Bruno');
 const deadline=Date.now()+12000;while(Date.now()<deadline&&!['Ana','Bruno'].every(name=>Object.values(row.payload.visitors).some(p=>p.visitor.name===name&&p.visitor.position.z< -4&&Date.now()-p.seen<2500)))await new Promise(r=>setTimeout(r,250));
 await page.getByRole('button',{name:/Moradores e objetos/}).click();await page.locator('.resident-picker select').selectOption('dora');
 await page.getByRole('button',{name:'Me apresente alguém',exact:true}).click();
 await b.getByRole('button',{name:'Quero participar',exact:true}).waitFor({timeout:15000});
 assert.equal(await page.getByRole('button',{name:'Ir ao encontro',exact:true}).count(),0,'No meeting before acceptance');
 await b.getByRole('button',{name:'Quero participar',exact:true}).click();
 await page.getByRole('button',{name:'Ir ao encontro',exact:true}).waitFor({timeout:15000});await b.getByRole('button',{name:'Ir ao encontro',exact:true}).waitFor({timeout:15000});
 await b.getByRole('button',{name:'Ir ao encontro',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/house-hosts-mobile.png'});const card=await page.locator('.host-invitation').boundingBox();assert.ok(card.x>=0&&card.x+card.width<=390,'Invitation fits mobile');
 await page.getByRole('button',{name:'Já nos encontramos',exact:true}).click();await page.locator('.host-invitation').waitFor({state:'hidden',timeout:10000});
 await page.getByRole('button',{name:'Quero explorar sozinho',exact:true}).click();await page.getByRole('button',{name:'Voltar a receber convites',exact:true}).waitFor({timeout:10000});
 const soloId=Object.entries(row.payload.state.social.solo).find(([,solo])=>solo)?.[0];assert.ok(soloId);assert.equal(row.payload.visitors[soloId].visitor.name,'Ana');
 assert.deepEqual(errors,[]);console.log('PASS: independent visitors, signed identity mapping, mutual consent, meeting navigation, mobile and solo mode.');
}catch(e){if(page)await page.screenshot({path:'/tmp/house-hosts-failure.png'});console.error(e);console.log(Object.values(row.payload.visitors).map(p=>({name:p.visitor.name,position:p.visitor.position,frozen:p.visitor.frozen})),row.payload.state.social);process.exitCode=1;}finally{await browser.close();}
