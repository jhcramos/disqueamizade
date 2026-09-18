import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
  await page.goto(`${process.env.BASE_URL||'http://localhost:3000'}/garagem-3d`);
  await page.waitForFunction(()=>Number(document.querySelector('.garage3d-canvas')?.dataset.drawCalls)>0);
  await page.locator('.garage3d-canvas canvas').evaluate(el=>el.dataset.persistent='yes');
  assert.equal(await page.getByRole('button',{name:/^Explorar /}).count(),3);
  await page.screenshot({path:'/tmp/garage3d-house-desktop.png'});
  for(const [name,count] of [['Garagem',8],['Sala de estar',8],['Bar Vinyl',15]]){
    const before=await page.locator('.garage3d-canvas').getAttribute('data-position');
    await page.getByRole('navigation',{name:'Ambientes 3D'}).getByRole('button',{name:new RegExp(name)}).click();
    assert.equal(await page.locator('.garage3d-canvas canvas').getAttribute('data-persistent'),'yes');
    assert.equal(await page.locator('.garage3d-canvas').getAttribute('data-position'),before);
    assert.equal(await page.getByRole('combobox',{name:'Escolher assento'}).locator('option').count(),count+1);
    for(let value=0;value<count;value++){
      await page.getByRole('combobox',{name:'Escolher assento'}).selectOption(String(value));
      await page.getByRole('button',{name:'Levantar',exact:true}).waitFor({timeout:35000});
      await page.waitForFunction(()=>document.querySelector('.garage3d-canvas').dataset.seated==='true');
      assert.ok(await page.locator('.garage3d-canvas').evaluate(el=>Number(el.dataset.hipHeight)>Number(el.dataset.seatHeight)+.07));
      await page.getByRole('button',{name:'Levantar',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('.garage3d-canvas').dataset.seated==='false');
    }
    console.log('PASS all seats and hip clearance:',name,count);
  }
  await page.getByRole('button',{name:'Apagar luzes',exact:true}).click();
  await page.getByRole('button',{name:'Acender luzes',exact:true}).click();
  await page.getByRole('button',{name:'Ir até o telefone',exact:true}).click();
  await page.getByRole('button',{name:'Ligar',exact:true}).waitFor({timeout:20000});
  await page.getByRole('button',{name:'Ligar',exact:true}).click();
  await page.getByRole('button',{name:'Atender',exact:true}).click();
  assert.match(await page.getByRole('status').textContent(),/Teste atendido/);
  await page.screenshot({path:'/tmp/garage3d-verified-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Chegar mais perto',exact:true}).click();
  await page.getByRole('button',{name:'Ver ambiente inteiro',exact:true}).click();
  await page.getByRole('button',{name:/^Casa inteira/}).click();
  await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'/tmp/garage3d-verified-mobile.png'});
  console.log('Render sample',await page.locator('.garage3d-canvas').evaluate(el=>({...el.dataset})));
  assert.deepEqual(errors,[]);console.log('PASS three rooms, 31 seats, stand, lighting, local phone, camera views and mobile width');
}finally{await browser.close();}
