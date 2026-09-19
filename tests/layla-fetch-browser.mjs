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
 page=await enter('Ana');await page.setViewportSize({width:390,height:844});await page.getByRole('combobox',{name:'Escolher ambiente'}).selectOption('living');
 await page.getByRole('button',{name:/Moradores e objetos/}).click();await page.locator('.resident-picker select').selectOption('biscoito');
 await page.getByRole('button',{name:'Pegar bolinha',exact:true}).click();const launch=page.getByRole('button',{name:'Jogar bolinha para Layla',exact:true});await launch.waitFor({timeout:30000});
 await page.waitForTimeout(1800);await launch.click();
 const until=async check=>{const end=Date.now()+40000;while(Date.now()<end){if(check())return;await new Promise(r=>setTimeout(r,150));}throw new Error('Fetch state did not complete');};
 await until(()=>row.payload.state.fetches===1);await page.getByText('Layla está buscando a bolinha…',{exact:true}).waitFor({timeout:10000});await page.screenshot({path:'/tmp/layla-fetch-mobile.png'});
 let carried=false;await until(()=>{const ball=row.payload.state.items.find(i=>i.id==='toy');if(ball.holder==='biscoito')carried=true;return carried&&!!ball.holder&&ball.holder!=='biscoito';});
 await launch.waitFor({timeout:10000});assert.equal(row.payload.state.items.filter(i=>i.id==='toy').length,1);assert.ok(row.payload.state.memories.some(m=>m.includes('Layla devolveu')));
 if(!process.env.BASE_URL){const color=await page.evaluate(async()=>{const {createResidentVisuals}=await import('/src/garage3d/residents/visuals.ts');const vis=createResidentVisuals({add(){},remove(){}});vis.sync([{id:'biscoito',position:{x:0,z:0},angle:0,activity:'idle'}],[],0,.016,true);const color=vis.roots.get('biscoito').getObjectByName('dog-collar').material.color.getHexString();vis.dispose();return color;});assert.equal(color,'ec6a9e');}
 assert.deepEqual(errors,[]);console.log('PASS mobile pickup, throw, Layla fetches and returns one ball; throw available again; pink collar.');
}catch(e){if(page)await page.screenshot({path:'/tmp/layla-fetch-failure.png'});console.error(e);process.exitCode=1;}finally{await browser.close();}
