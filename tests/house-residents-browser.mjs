import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.route('**/api/house-residents',route=>route.fulfill({status:500,body:'Unavailable during this test'}));
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(`${process.env.BASE_URL||'http://localhost:3000'}/garagem`);
 await page.getByRole('textbox',{name:'Como podemos chamar você?'}).fill('Ana');
 await page.getByRole('button',{name:'Entrar na casa',exact:true}).click();
 await page.locator('.garage3d-canvas[data-resident-mode=local]').waitFor({timeout:25000});
 assert.equal(await page.locator('.garage3d-canvas').getAttribute('data-residents'),'3');
 await page.getByRole('button',{name:/Moradores e objetos/}).click();
 await page.locator('.resident-picker select').selectOption('toy');
 await page.getByRole('button',{name:'Pegar bolinha',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.garage3d-canvas')?.dataset.carried==='toy',undefined,{timeout:40000});
 console.log('pickup passed');
 await page.locator('.resident-picker select').selectOption('biscoito');
 await page.getByRole('button',{name:'Jogar para buscar'}).click();
 await page.waitForFunction(()=>document.querySelector('.garage3d-canvas')?.dataset.carried==='',undefined,{timeout:40000});
 await page.waitForFunction(()=>document.querySelector('.garage3d-canvas')?.dataset.carried==='toy',undefined,{timeout:45000});
 console.log('fetch returned');
 await page.getByRole('button',{name:'Guardar bolinha do biscoito'}).click();
 await page.waitForFunction(()=>document.querySelector('.garage3d-canvas')?.dataset.carried==='',undefined,{timeout:40000});
 await page.getByRole('button',{name:'Fechar interações'}).click();
 await page.screenshot({path:'/tmp/house-residents-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:/Moradores e objetos/}).click();
 await page.screenshot({path:'/tmp/house-residents-mobile.png'});
 const panel=await page.locator('.resident-panel').boundingBox();
 assert.ok(panel.x>=0&&panel.x+panel.width<=390,'Mobile actions fit within viewport');
 assert.ok(panel.height<=844*.49,'Mobile actions leave room for the house');
 assert.deepEqual(errors,[]);
 // Exercise expiry without a real database, credentials or provider calls.
 await page.evaluate(async()=>{
  const {createResidentTransport}=await import('/src/garage3d/residents/transport.ts');
  const {createLife}=await import('/src/garage3d/residents/model.ts');
  const original=window.fetch;let calls=0;const headers=[];
  window.__residentExpiry={headers,done:false};
  window.fetch=async(url,init)=>{
   if(url!=='/api/house-residents')return original(url,init);
   headers.push(init.headers['X-Resident-Session']||'');calls++;
   return new Response(JSON.stringify(calls===2?{error:'session'}:{state:createLife(),identity:{id:'server-id',token:calls===1?'expired-token':'fresh-token'}}),{status:calls===2?401:200});
  };
  const transport=createResidentTransport(()=>({id:crypto.randomUUID(),name:'Teste',position:{x:-5,z:2.8}}),(_,mode)=>{
   if(calls>=3&&mode==='online'){window.__residentExpiry.done=true;setTimeout(()=>{transport.dispose();window.fetch=original;},0);}
  },()=>{});
 });
 await page.waitForFunction(()=>window.__residentExpiry.done,undefined,{timeout:10000});
 assert.deepEqual(await page.evaluate(()=>window.__residentExpiry.headers.slice(0,3)),['','expired-token','']);
 console.log('PASS: pickup, fetch, return, mobile layout, session renewal; no browser errors');
} catch(e){await page.screenshot({path:'/tmp/house-residents-failure.png'});console.log(await page.locator('.resident-panel').innerText().catch(()=>''));console.log('errors',errors);throw e;}
finally{await browser.close();}
