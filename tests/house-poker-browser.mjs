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
async function takeSeat(p){
 await p.getByRole('button',{name:/Bar Vinyl/}).first().click();await p.getByRole('button',{name:'Tenho 18 anos ou mais'}).click();
 await p.getByRole('button',{name:'Interagir',exact:true}).click();
 await p.getByRole('button',{name:'♠ Jogar pôquer',exact:true}).click();
 const join=p.getByRole('button',{name:'Sentar e receber 1.000 fichas'});await join.waitFor({timeout:40000});await join.click();
 await p.getByRole('button',{name:'Sair da mesa',exact:true}).waitFor({timeout:10000});
}
try{
 page=await enter('Ana');await takeSeat(page);console.log('first seated');
 const b=await enter('Bruno');await takeSeat(b);console.log('second seated');
 await page.getByRole('button',{name:'Distribuir cartas'}).click();await page.getByRole('button',{name:/Pagar 10/}).waitFor({timeout:10000});
 assert.equal(await page.locator('.poker-player').filter({hasText:'Bruno'}).locator('.poker-card.is-back').count(),2);
 assert.equal(await b.locator('.poker-player').filter({hasText:'Ana'}).locator('.poker-card.is-back').count(),2);
 const action=await page.getByRole('button',{name:/Pagar 10/}).boundingBox(),panel=await page.locator('.house-poker').boundingBox();assert.ok(action.y+action.height<=panel.y+panel.height,'Actions remain visible without scrolling');
 await page.screenshot({path:'/tmp/house-poker-desktop.png'});
 await page.getByRole('button',{name:/Pagar 10/}).click();await b.getByRole('button',{name:'Passar',exact:true}).click();
 await page.locator('.poker-pot').filter({hasText:'Flop'}).waitFor({timeout:10000});console.log('shared flop with private cards');
 await b.getByRole('button',{name:'Desistir',exact:true}).click();await page.locator('.poker-pot').filter({hasText:'Fim da mão'}).waitFor({timeout:10000});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/house-poker-mobile.png'});
 const box=await page.locator('.house-poker').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390);console.log('mobile fits',box);
 assert.deepEqual(errors,[]);
 await page.getByRole('button',{name:'Sair da mesa',exact:true}).click();await b.getByRole('button',{name:'Sair da mesa',exact:true}).click();
 console.log('PASS: two independent visitors, join, deal, hidden cards, calls, flop, fold, mobile, leave; no browser errors');
} catch(e){if(page)await page.screenshot({path:'/tmp/house-updates-failure.png'});console.error(e);process.exitCode=1;}finally{await browser.close();}
