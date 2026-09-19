import assert from 'node:assert/strict';
if(process.env.POKER_LIVE!=='1')throw Error('Set POKER_LIVE=1 to test the deployed media service on an empty table.');
const liveEndpoint='https://disqueamizade.com.br/api/house-residents',clients=new Map();
const check=await fetch(liveEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({feature:'poker',visitor:{id:crypto.randomUUID(),name:'Verificação vídeo',position:{x:5.35,z:2}}})}).then(r=>r.json());
if(check.game?.players.some(p=>!p.left))throw Error('The table has visitors; live test skipped to avoid disrupting them.');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import handler from '../api/house-residents.ts';
import {createLife} from '../src/garage3d/residents/model.ts';
process.env.SUPABASE_URL='https://browser-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fake-browser-test-only';delete process.env.DEEPINFRA_API_KEY;
let row={revision:1,payload:{state:createLife(),visitors:{},commands:{},at:Date.now(),nextAI:Date.now()+120000}};
const original=globalThis.fetch;
globalThis.fetch=async(url,init)=>{if(String(url).startsWith('https://browser-test.invalid/rest/v1/house_resident_world')){if(init?.method==='PATCH'){const expected=new URL(url).searchParams.get('revision');if(expected&&Number(expected.slice(3))!==row.revision)return new Response('[]');row={...row,...JSON.parse(init.body)};return new Response(JSON.stringify([{revision:row.revision}]));}return new Response(JSON.stringify(row));}return original(url,init);};
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});const errors=[];let page;
async function enter(name){
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['camera','microphone']});await context.route('**/api/house-residents',async route=>{const req=route.request(),output={status:200};
 if(req.postDataJSON().feature==='poker'){
  const response=await original(liveEndpoint,{method:'POST',headers:{'Content-Type':'application/json',...(req.headers()['x-resident-session']?{'X-Resident-Session':req.headers()['x-resident-session']}:{})},body:req.postData()});
  const body=await response.text();try{const data=JSON.parse(body);if(data.identity?.token)clients.set(req.postDataJSON().visitor.name,{token:data.identity.token,visitor:req.postDataJSON().visitor});}catch{}
  await route.fulfill({status:response.status,contentType:'application/json',body});return;
 }const res={setHeader(){},status(n){output.status=n;return this;},json(body){output.body=body;return this;}};await handler({method:'POST',headers:{host:'localhost:3000','x-resident-session':req.headers()['x-resident-session']},body:req.postDataJSON()},res);await route.fulfill({status:output.status,contentType:'application/json',body:JSON.stringify(output.body)});});
 await context.addInitScript(()=>{window.__captures=[];const acquire=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async options=>{const stream=await acquire(options);window.__captures.push(stream);return stream;};});
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
 page=await enter('Teste vídeo A');await takeSeat(page);
 await page.getByRole('button',{name:'Conversar com a mesa',exact:true}).click();await page.getByRole('button',{name:'Ligar câmera',exact:true}).waitFor({timeout:30000});
 assert.equal(await page.evaluate(()=>window.__captures.length),0,'Joining never captures');
 await page.getByRole('checkbox',{name:'Máscara do meu avatar'}).uncheck();await page.getByRole('button',{name:'Ligar câmera',exact:true}).click();await page.getByRole('button',{name:'Desligar câmera',exact:true}).waitFor({timeout:30000});
 const b=await enter('Teste vídeo B');await takeSeat(b);await b.getByRole('button',{name:'Conversar com a mesa',exact:true}).click();await b.getByRole('button',{name:'Ligar câmera',exact:true}).waitFor({timeout:30000});
 await page.getByText('Alguém entrou na conversa.',{exact:false}).waitFor({timeout:30000});
 assert.equal(await page.evaluate(()=>window.__captures.flatMap(s=>s.getTracks()).some(t=>t.readyState==='live')),false,'New participant pauses publication');
 assert.equal(await b.evaluate(()=>window.__captures.length),0);
 await b.getByRole('checkbox',{name:'Máscara do meu avatar'}).uncheck();
 for(const p of [page,b]){await p.getByRole('button',{name:'Ligar câmera',exact:true}).click();await p.getByRole('button',{name:'Desligar câmera',exact:true}).waitFor({timeout:30000});await p.getByRole('button',{name:'Ligar microfone',exact:true}).click();await p.getByRole('button',{name:'Desligar microfone',exact:true}).waitFor({timeout:15000});}
 await page.waitForFunction(()=>document.querySelectorAll('.poker-video-tile video').length===2&&[...document.querySelectorAll('.poker-video-tile video')].every(v=>v.videoWidth>0),null,{timeout:30000});console.log('Two actual LiveKit peers, independent camera/microphone, remote frames received');
 await page.getByRole('checkbox',{name:'Máscara do meu avatar'}).check();await page.getByRole('button',{name:'Ligar câmera',exact:true}).waitFor();await page.getByRole('button',{name:'Ligar câmera',exact:true}).click();await page.getByRole('button',{name:'Desligar câmera',exact:true}).waitFor({timeout:40000});console.log('Avatar composite published successfully');
 await page.getByRole('button',{name:'Distribuir cartas',exact:true}).click();await Promise.race([page.getByRole('button',{name:/Pagar 10/}).waitFor({timeout:15000}),b.getByRole('button',{name:/Pagar 10/}).waitFor({timeout:15000})]);
 assert.equal(await page.locator('.poker-player').filter({hasText:'Teste vídeo B'}).locator('.poker-card.is-back').count(),2);
 await page.getByRole('button',{name:/Recolher câmeras/}).click();assert.equal(await page.locator('.poker-video-tile').count(),0);assert.ok(await page.evaluate(()=>window.__captures.flatMap(s=>s.getTracks()).some(t=>t.readyState==='live')),'Collapsing cameras retains media');
 await page.getByRole('button',{name:/Ver câmeras/}).click();await page.screenshot({path:'/tmp/poker-video-desktop.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/poker-video-mobile.png'});
 const action=await page.getByRole('button',{name:'Sair da mesa',exact:true}).boundingBox();assert.ok(action.y+action.height<844,'Bet controls stay visible');const board=await page.locator('.poker-board').boundingBox();assert.ok(board.y+board.height<action.y,'Community cards are visible above betting controls');
 await page.getByRole('button',{name:'Sair só da conversa',exact:true}).click();await page.getByRole('button',{name:'Conversar com a mesa',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__captures.flatMap(s=>s.getTracks()).some(t=>t.readyState==='live')),false);
 const first=await page.getByRole('button',{name:/Pagar 10/}).count()?page:b,second=first===page?b:page;await first.getByRole('button',{name:/Pagar 10/}).click();await second.getByRole('button',{name:'Passar',exact:true}).click();await page.locator('.poker-pot').filter({hasText:'Flop'}).waitFor({timeout:15000});console.log('Leaving video retains seat, private cards and play');
 assert.deepEqual(errors,[]);console.log('PASS: live media, privacy, masks, mobile and poker continuity');
}catch(e){if(page)await page.screenshot({path:'/tmp/poker-video-failure.png'});console.error(e.message);process.exitCode=1;}
finally{await browser.close();for(const {token,visitor}of clients.values())try{await original(liveEndpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Resident-Session':token},body:JSON.stringify({feature:'poker',visitor,command:{id:crypto.randomUUID(),action:'leave'},call:{id:crypto.randomUUID(),action:'leave'}})});}catch{}}
