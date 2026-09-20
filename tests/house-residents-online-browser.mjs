import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const errors=[];
 async function enter(name){const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(`${process.env.BASE_URL||'http://localhost:3000'}/garagem`);await page.getByRole('textbox',{name:'Como podemos chamar você?'}).fill(name);await page.getByRole('button',{name:'Entrar na casa',exact:true}).click();await page.locator('.garage3d-canvas[data-resident-mode=online]').waitFor({timeout:30000});await page.getByRole('button',{name:/Moradores e objetos/}).click();return page;}
 const a=await enter('Teste A'),b=await enter('Teste B');
 await a.locator('.resident-picker select').selectOption('toy');await a.getByRole('button',{name:'Pegar bolinha',exact:true}).click();
 await a.waitForFunction(()=>document.querySelector('.garage3d-canvas')?.dataset.carried==='toy',undefined,{timeout:60000});
 await b.locator('.resident-picker select').selectOption('toy');await b.waitForTimeout(2500);
 assert.equal(await b.getByRole('button',{name:'Pegar bolinha',exact:true}).count(),0);
 await a.getByRole('button',{name:/Guardar/,exact:false}).click();
 await a.waitForFunction(()=>document.querySelector('.garage3d-canvas')?.dataset.carried==='',undefined,{timeout:45000});
 await b.getByRole('button',{name:'Pegar bolinha',exact:true}).waitFor({timeout:10000});
 assert.deepEqual(errors,[]);console.log('PASS: two independent browser contexts share residents and exclusive item ownership');
}finally{await browser.close();}
