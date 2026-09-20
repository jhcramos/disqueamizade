import assert from 'node:assert/strict';
import handler from '../api/house-residents.ts';
import {createLife} from '../src/garage3d/residents/model.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
process.env.SUPABASE_URL='https://theatre-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fake-theatre-test-only';delete process.env.DEEPINFRA_API_KEY;delete process.env.TYPESAFE_API_KEY;
let row={revision:1,payload:{state:createLife(),visitors:{},commands:{},at:Date.now(),nextAI:Date.now()+120000}};
const original=globalThis.fetch;
globalThis.fetch=async(url,init)=>{
 if(String(url).startsWith('https://theatre-test.invalid/rest/v1/house_resident_world')){
  if(init?.method==='PATCH'){const expected=new URL(url).searchParams.get('revision');if(expected&&Number(expected.slice(3))!==row.revision)return new Response('[]');row={...row,...JSON.parse(init.body)};return new Response(JSON.stringify([{revision:row.revision}]));}
  return new Response(JSON.stringify(row));
 }return original(url,init);
};
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],pages=[];
try{
 async function enter(name,prefix){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(prefix=>{
   if(prefix==='1'){const realNow=Date.now;Date.now=()=>realNow()+120000;}
   const uuid=crypto.randomUUID.bind(crypto);crypto.randomUUID=()=>prefix+uuid().slice(1);
   window.__yt={created:0,seek:0,volume:0,paused:true};
   window.YT={Player:class{
    constructor(el,opts){this.frame=document.createElement('iframe');this.frame.srcdoc='<html><body>Player de teste</body></html>';el.replaceWith(this.frame);window.__yt.created++;window.__yt.video=opts.videoId;setTimeout(()=>opts.events.onReady(),30);}
    getIframe(){return this.frame;}destroy(){this.frame.remove();}playVideo(){window.__yt.paused=false;}pauseVideo(){window.__yt.paused=true;}seekTo(n){window.__yt.seek=n;}setVolume(n){window.__yt.volume=n;}
   }};
  },prefix);
  await context.route('**/api/house-residents',async route=>{
   const req=route.request(),body=req.postDataJSON(),out={status:200};
   // Realistic network delay exposes the former browser-coordinator election race.
   if(body.feature==='network')await new Promise(r=>setTimeout(r,600));
   await handler({method:'POST',headers:{...req.headers(),host:'localhost:3000'},body},{setHeader(){},status(n){out.status=n;return this;},json(body){out.body=body;return this;}});
   await route.fulfill({status:out.status,contentType:'application/json',body:JSON.stringify(out.body)});
  });
  const p=await context.newPage();pages.push(p);p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://localhost:3000/garagem?network=1');await p.getByRole('textbox',{name:'Como podemos chamar você?'}).fill(name);await p.getByRole('button',{name:'Entrar na casa',exact:true}).click();
  await p.getByRole('button',{name:'Televisão',exact:true}).click();await p.locator('.house-theatre').waitFor();await p.waitForTimeout(3000);return p;
 }
 const a=await enter('Ana TV','f');
 await a.getByRole('button',{name:'Assumir o controle',exact:true}).click();await a.getByRole('button',{name:'Passar a vez',exact:true}).waitFor();await a.waitForTimeout(400);
 await a.getByRole('textbox',{name:'Link do YouTube'}).fill('https://youtu.be/M7lc1UVf-VE');await a.getByRole('textbox',{name:'Nome do vídeo'}).fill('Vídeo compartilhado');await a.getByRole('button',{name:'Adicionar à fila'}).click();await a.locator('.theatre-queue li').getByText('Vídeo compartilhado').waitFor();await a.waitForTimeout(400);
 await a.getByRole('button',{name:'Colocar na tela',exact:true}).click();await a.locator('.theatre-now h3').getByText('Vídeo compartilhado').waitFor();
 const b=await enter('Bruno TV','1');
 await b.locator('.theatre-now h3').getByText('Vídeo compartilhado').waitFor({timeout:15000});
 await b.locator('.theatre-host').getByText('Ana TV',{exact:true}).waitFor();
 assert.equal(await b.evaluate(()=>window.__yt.created),0,'Receiving the programme does not activate external playback');
 await b.getByRole('textbox',{name:'Link do YouTube'}).fill('https://youtu.be/aqz-KE-bpKQ');await b.getByRole('textbox',{name:'Nome do vídeo'}).fill('Pedido do visitante');await b.getByRole('button',{name:'Adicionar à fila'}).click();
 await a.locator('.theatre-queue li').getByText('Pedido do visitante').waitFor();
 await b.getByRole('button',{name:'Assistir na TV',exact:true}).click();await b.locator('.theatre-player iframe').waitFor();await b.waitForFunction(()=>window.__yt.seek>0&&!window.__yt.paused);assert.ok(await b.evaluate(()=>window.__yt.seek<90),'playhead uses server clock despite visitor clock being two minutes ahead');
 await a.getByRole('button',{name:'Pausar sessão',exact:true}).click();await b.waitForFunction(()=>window.__yt.paused);
 await a.getByRole('button',{name:'Retomar sessão',exact:true}).click();await b.waitForFunction(()=>!window.__yt.paused);
 assert.equal(await b.evaluate(()=>window.__yt.video),'M7lc1UVf-VE');assert.deepEqual(errors,[]);
 console.log('PASS separate computers: late join receives video/DJ and guest queue, clock correction, opt-in TV player starts at shared position, pause and resume sync.');
}finally{await browser.close();globalThis.fetch=original;}
