import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),errors=[];
try{
 await context.addInitScript(()=>{
  window.__yt={created:0,destroyed:0,seek:0,volume:0,paused:false};
  window.YT={Player:class{
   constructor(el,opts){this.frame=document.createElement('iframe');this.frame.srcdoc='<html><body style="margin:0;background:#17312f;color:#f5dfb3;display:grid;place-items:center;height:100vh;font:22px Georgia">YouTube · player de teste</body></html>';el.replaceWith(this.frame);window.__yt.created++;window.__yt.video=opts.videoId;window.__events=opts.events;setTimeout(()=>opts.events.onReady(),30);}
   getIframe(){return this.frame;} destroy(){window.__yt.destroyed++;this.frame.remove();} playVideo(){window.__yt.paused=false;} pauseVideo(){window.__yt.paused=true;} seekTo(n){window.__yt.seek=n;} setVolume(n){window.__yt.volume=n;}
  }};
 });
 async function enter(name){const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(`${process.env.BASE_URL||'http://localhost:3000'}/garagem`);await p.getByRole('textbox',{name:'Como podemos chamar você?'}).fill(name);await p.getByRole('button',{name:'Entrar na casa',exact:true}).click();await p.getByRole('button',{name:'Televisão',exact:true}).click();await p.locator('.house-theatre').waitFor();await p.waitForTimeout(2200);return p;}
 const a=await enter('Ana'),b=await enter('Bia');await a.waitForTimeout(2200);
 assert.equal(await a.evaluate(()=>window.__yt.created),0,'No player until explicit consent');
 assert.equal(await a.locator('.garage3d-canvas').getAttribute('data-televisions'),'3');
 await a.getByRole('button',{name:'Assumir o controle',exact:true}).click();
 await b.locator('.theatre-host').getByText('Ana',{exact:true}).waitFor();assert.equal(await b.getByRole('button',{name:'Colocar na tela'}).count(),0);
 async function add(p,id,title){await p.getByRole('textbox',{name:'Link do YouTube'}).fill(`https://youtu.be/${id}`);await p.getByRole('textbox',{name:'Nome do vídeo'}).fill(title);await p.getByRole('button',{name:'Adicionar à fila'}).click();await p.waitForTimeout(400);}
 await add(b,'M7lc1UVf-VE','Primeiro vídeo');await a.locator('.theatre-queue li').getByText('Primeiro vídeo').waitFor();
 await add(a,'aqz-KE-bpKQ','Segundo vídeo');
 await a.getByRole('button',{name:'Colocar na tela',exact:true}).click();await b.locator('.theatre-now h3').getByText('Primeiro vídeo').waitFor();
 assert.equal(await b.evaluate(()=>window.__yt.created),0);
 await a.getByRole('button',{name:'Assistir junto'}).click();await b.getByRole('button',{name:'Assistir junto'}).click();
 await a.locator('.theatre-player iframe').waitFor();await b.locator('.theatre-player iframe').waitFor();await a.waitForTimeout(500);
 await a.getByRole('button',{name:'Pausar sessão',exact:true}).click();await b.waitForFunction(()=>window.__yt.paused===true);
 await a.waitForTimeout(400);await a.getByRole('button',{name:'Retomar sessão',exact:true}).click();await b.waitForFunction(()=>window.__yt.paused===false);
 await b.getByRole('slider',{name:'Volume do meu vídeo'}).fill('0');assert.equal(await b.evaluate(()=>window.__yt.volume),0);assert.equal(await a.evaluate(()=>window.__yt.volume),35);
 const normalChat=await a.getByRole('textbox',{name:'Mensagem pública'}).boundingBox();
 const normalPanel=await a.locator('.room-chat').boundingBox();assert.ok(normalChat.y+normalChat.height<normalPanel.y+normalPanel.height,'Chat input stays inside its panel');
 await a.getByRole('button',{name:'⛶ Tela cheia',exact:true}).click();
 const frame=await a.locator('.theatre-player iframe').boundingBox(),chat=await a.getByRole('textbox',{name:'Mensagem pública'}).boundingBox();
 assert.ok(frame.width>=200&&frame.height>=200,'Player meets minimum dimensions');assert.ok(chat.y+chat.height<=1000,'Chat composer stays visible');
 await a.screenshot({path:'/tmp/house-theatre-desktop.png'});
 // Native player errors stay outside the player; a host can skip the unavailable video.
 await b.evaluate(()=>window.__events.onError({data:150}));await b.getByRole('alert').filter({hasText:'não permite reprodução'}).waitFor();
 await a.getByRole('button',{name:'Próximo vídeo',exact:true}).click();await b.locator('.theatre-now h3').getByText('Segundo vídeo').waitFor();
 const before=await b.evaluate(()=>window.__yt.destroyed);await b.getByRole('button',{name:'Fechar televisão'}).click();assert.equal(await b.locator('.theatre-player iframe').count(),0);assert.ok(await b.evaluate(n=>window.__yt.destroyed>n,before));
 await b.getByRole('button',{name:'Televisão',exact:true}).click();await b.locator('.theatre-now h3').getByText('Segundo vídeo').waitFor();assert.equal(await b.locator('.theatre-player iframe').count(),0);
 // A late joiner receives the existing queue, host and playhead.
 const c=await enter('Caio');await c.locator('.theatre-now h3').getByText('Segundo vídeo').waitFor();await c.locator('.theatre-host').getByText('Ana',{exact:true}).waitFor();
 await a.getByRole('button',{name:'✕ Sair da tela cheia',exact:true}).click();
 await a.getByRole('navigation',{name:'Ambientes da casa'}).getByRole('button',{name:/Sala de estar/}).click();await a.locator('.house-theatre').waitFor({state:'detached'});assert.equal(await a.locator('.house-theatre').count(),0);assert.equal(await a.locator('.theatre-player iframe').count(),0);
 await a.getByRole('button',{name:'Televisão',exact:true}).click();await a.getByRole('heading',{name:'O que vamos assistir?'}).waitFor();
 await b.getByRole('button',{name:'Assumir o controle',exact:true}).waitFor({timeout:15000});
 // Mobile gets a readable player, accessible close action and no overflow.
 await b.setViewportSize({width:390,height:844});await b.getByRole('button',{name:'Assistir junto'}).click();await b.locator('.theatre-player iframe').waitFor();
 const mobileFrame=await b.locator('.theatre-player iframe').boundingBox();assert.ok(mobileFrame.width>=200&&mobileFrame.height>=200);
 assert.equal(await b.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await b.screenshot({path:'/tmp/house-theatre-mobile.png'});
 await b.getByRole('button',{name:'Fechar televisão'}).click();assert.equal(await b.locator('.theatre-player iframe').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS three TVs, consent, shared queue and DJ, pause/resume, volume, late join, room isolation, DJ departure, errors, cleanup, fullscreen chat and mobile');
}finally{await browser.close();}
