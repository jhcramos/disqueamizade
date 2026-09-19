import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const b = await chromium.launch({ channel:'chrome', headless:true });
try {
 const p = await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const errors=[]; p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(() => { window.mediaRequests=0; navigator.mediaDevices.getUserMedia=async()=>{ window.mediaRequests++; throw Error('Unexpected media request'); }; });
 const base=process.env.BASE_URL || 'http://localhost:3000';
 await p.goto(`${base}/garagem`);
 await p.getByRole('textbox',{name:'Como podemos chamar você?'}).fill('Teste telefones');
 await p.getByRole('button',{name:'Entrar na casa',exact:true}).click();
 await p.locator('.house-red-phone').first().waitFor({state:'attached'});
 assert.equal(await p.locator('.house-red-phone').count(),4);
 assert.equal(await p.locator('.surprise-station').count(),0);
 await p.getByRole('button',{name:'Ver ambiente inteiro'}).click();
 await p.screenshot({path:'/tmp/disque-red-phones-mobile.png'});
 await p.getByRole('button',{name:/Telefone vermelho 1:/}).click();
 await p.getByRole('dialog').waitFor();
 assert.equal(await p.locator('.phone-picker').count(),0);
 assert.ok(await p.getByText('Disponível para receber ligações').isVisible());
 await p.getByRole('button',{name:'Silenciar toque',exact:true}).click();
 await p.getByRole('button',{name:'Ativar toque',exact:true}).waitFor();
 await p.screenshot({path:'/tmp/disque-red-phones-dialog.png'});
 await p.keyboard.press('Escape');
 await p.getByRole('dialog').waitFor({state:'hidden'});
 for(const room of ['living','bar']) {
  await p.getByRole('combobox',{name:'Escolher ambiente'}).selectOption(room);
  if(room==='bar') await p.getByRole('button',{name:'Tenho 18 anos ou mais',exact:true}).click();
  await p.waitForTimeout(250);
  assert.equal(await p.locator('.house-red-phone').count(),4);
 }
 await p.getByRole('button',{name:'Interagir',exact:true}).click();
 await p.getByRole('button',{name:'Disque Surpresa · telefones vermelhos',exact:true}).click();
 await p.getByRole('dialog').waitFor();
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await p.getByRole('button',{name:'Fechar telefones'}).click();
 await p.setViewportSize({width:1440,height:1000});
 assert.equal(await p.locator('.house-red-phone').count(),4);
 assert.equal(await p.evaluate(()=>window.mediaRequests),0);
 await p.goto(`${base}/roulette`);
 await p.waitForURL('**/garagem?phones=1');
 assert.deepEqual(errors,[]);
 console.log('PASS four phones in each room, removed station, mobile dialog, sound toggle, Escape, accessible shortcut, desktop, roulette redirect, no automatic media.');
} finally { await b.close(); }
