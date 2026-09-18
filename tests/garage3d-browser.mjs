import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
  await page.goto(`${process.env.BASE_URL||'http://localhost:3000'}/garagem-3d`);
  await page.waitForFunction(()=>Number(document.querySelector('.garage3d-canvas')?.dataset.drawCalls)>0);
  for(const [name,count] of [['Garagem',8],['Sala de estar',8],['Bar Vinyl',15]]){
    await page.getByRole('navigation',{name:'Ambientes 3D'}).getByRole('button',{name:new RegExp(name)}).click();
    assert.equal(await page.getByRole('combobox',{name:'Escolher assento'}).locator('option').count(),count+1);
    for(let value=0;value<count;value++){
      await page.getByRole('combobox',{name:'Escolher assento'}).selectOption(String(value));
      await page.getByRole('button',{name:'Levantar',exact:true}).waitFor({timeout:15000});
      await page.waitForFunction(()=>document.querySelector('.garage3d-canvas').dataset.seated==='true');
      assert.ok(await page.locator('.garage3d-canvas').evaluate(el=>Number(el.dataset.hipHeight)>Number(el.dataset.seatHeight)+.07));
      await page.getByRole('button',{name:'Levantar',exact:true}).click();
    }
    console.log('PASS all seats and hip clearance:',name,count);
  }
  await page.getByRole('button',{name:'Apagar luzes',exact:true}).click();
  await page.getByRole('button',{name:'Acender luzes',exact:true}).click();
  await page.getByRole('button',{name:'Testar telefone',exact:true}).click();
  await page.getByRole('button',{name:'Atender telefone',exact:true}).click();
  assert.match(await page.getByRole('status').textContent(),/Teste atendido/);
  await page.screenshot({path:'/tmp/garage3d-verified-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Chegar mais perto',exact:true}).click();
  await page.getByRole('button',{name:'Ver ambiente inteiro',exact:true}).click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'/tmp/garage3d-verified-mobile.png'});
  console.log('Render sample',await page.locator('.garage3d-canvas').evaluate(el=>({...el.dataset})));
  assert.deepEqual(errors,[]);console.log('PASS three rooms, 31 seats, stand, lighting, local phone, camera views and mobile width');
}finally{await browser.close();}
