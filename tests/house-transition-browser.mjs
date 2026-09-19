import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.captureRequests=0;navigator.mediaDevices.getUserMedia=async()=>{window.captureRequests++;throw Error('Unexpected capture');};});
 await page.goto(`${process.env.BASE_URL||'http://localhost:3000'}/garagem-3d`);
 await page.getByRole('textbox',{name:'Como podemos chamar você?'}).fill('Ana');
 await page.getByRole('button',{name:'Entrar na casa',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.garage3d-canvas')?.dataset.camera==='overview');
 assert.match(page.url(),/\/garagem$/);
 await page.getByRole('button',{name:'Primeira pessoa',exact:true}).click();
 await page.keyboard.down('s');
 await page.waitForFunction(()=>document.querySelector('.house-rooms button[aria-pressed="true"]')?.textContent.includes('Sala de estar'),{timeout:10000});
 await page.keyboard.up('s');
 assert.ok(Number((await page.locator('.garage3d-canvas').getAttribute('data-position')).split(',')[1])>-4);
 await page.keyboard.press('Escape');
 await page.locator('.house-rooms').getByRole('button',{name:/Bar Vinyl/}).click();
 await page.getByRole('button',{name:'Tenho 18 anos ou mais'}).waitFor();
 assert.match(await page.locator('.house-rooms button[aria-pressed="true"]').textContent(),/Sala de estar/);
 await page.getByRole('button',{name:'Tenho 18 anos ou mais'}).click();
 await page.waitForFunction(()=>document.querySelector('.house-rooms button[aria-pressed="true"]')?.textContent.includes('Bar Vinyl'));
 assert.equal(await page.evaluate(()=>window.captureRequests),0);
 assert.deepEqual(errors,[]);console.log('PASS primary redirect, continuous first-person doorway crossing, room presence update, adult gate and media off');
}finally{await browser.close();}
