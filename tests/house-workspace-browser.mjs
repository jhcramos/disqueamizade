import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${process.env.BASE_URL||'http://localhost:3000'}/garagem`);
 await page.getByRole('textbox',{name:'Como podemos chamar você?'}).fill('Ana');
 await page.getByRole('button',{name:'Entrar na casa',exact:true}).click();
 await page.waitForFunction(()=>Number(document.querySelector('.garage3d-canvas')?.dataset.zoom)>=2.99);
 assert.equal(await page.getByText('Puxe uma cadeira',{exact:true}).count(),0);
 assert.equal(await page.locator('.gathering-panel').isVisible(),false);
 assert.equal(await page.locator('.garage3d-tools').isVisible(),false);
 await page.getByRole('textbox',{name:'Mensagem pública'}).fill('Oi, pessoal! Que casa bonita.');
 await page.getByRole('textbox',{name:'Mensagem pública'}).press('Enter');
 await page.locator('.house3d-person .room-speech').waitFor();
 async function clearFace(){
  const box=await page.locator('.house3d-person.is-self').boundingBox(),stage=await page.locator('.garage3d-canvas').boundingBox();
  const head=Number(await page.locator('.house3d-person.is-self').getAttribute('data-head-y'));
  assert.ok(box.y+box.height<stage.y+head-4,'label must stay above the avatar head');
  const bubble=page.locator('.house3d-person .room-speech');
  if(await bubble.isVisible()){const b=await bubble.boundingBox();assert.ok(b.y+b.height<=box.y,'message must grow upward');}
 }
 await clearFace();
 await page.screenshot({path:'/tmp/house-workspace-desktop.png'});
 await page.getByRole('button',{name:'⛶ Tela cheia',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.garage-app').classList.contains('is-immersive'));
 await page.waitForTimeout(600);
 const scene=await page.locator('.garage3d-canvas').boundingBox(),chat=await page.locator('.room-chat').boundingBox(),input=await page.getByRole('textbox',{name:'Mensagem pública'}).boundingBox();
 assert.ok(scene.height>600);assert.ok(chat.x>=scene.x+scene.width,'chat must stay alongside scene');assert.ok(input.y+input.height<1000);
 assert.equal(await page.locator('.gathering-panel').isVisible(),false);
 await page.getByRole('button',{name:'Conversas',exact:true}).click();
 await page.locator('.gathering-panel').waitFor();
 await page.getByRole('button',{name:'Abrir roda aqui'}).first().click();
 await page.getByRole('button',{name:'Retirar placa'}).waitFor();
 await page.getByRole('button',{name:'Fechar painel',exact:true}).click();
 await page.getByRole('button',{name:'Interagir',exact:true}).click();
 await page.getByRole('button',{name:'Levantar',exact:true}).click();
 await page.getByRole('button',{name:'Fechar painel',exact:true}).click();
 await page.screenshot({path:'/tmp/house-workspace-fullscreen.png'});
 await page.getByRole('button',{name:'✕ Sair da tela cheia',exact:true}).click();
 await page.waitForFunction(()=>!document.fullscreenElement&&!document.querySelector('.garage-app').classList.contains('is-immersive'));
 await page.locator('.garage-app').evaluate(el=>{el.requestFullscreen=undefined;});
 await page.getByRole('button',{name:'⛶ Tela cheia',exact:true}).click();
 assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false);
 assert.ok(await page.locator('.garage-app.is-immersive').count());
 await page.getByRole('button',{name:'✕ Sair da tela cheia',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(600);
 await clearFace();
 await page.getByRole('navigation',{name:'Ferramentas da casa'}).getByRole('button',{name:'Chat',exact:false}).click();
 await page.getByRole('textbox',{name:'Mensagem pública'}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'/tmp/house-workspace-mobile.png'});
 await page.getByRole('button',{name:'Fechar painel e voltar à casa'}).click();
 await page.getByRole('navigation',{name:'Ferramentas da casa'}).getByRole('button',{name:'Rodas',exact:true}).click();
 await page.getByRole('button',{name:'Retirar placa'}).waitFor();
 assert.deepEqual(errors,[]);console.log('PASS initial avatar zoom, clear head/speech, compact panels, groups, fullscreen side chat, exit and mobile');
}finally{await browser.close();}
