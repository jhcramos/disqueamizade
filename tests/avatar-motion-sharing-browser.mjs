import assert from 'node:assert/strict';import handler from '../api/house-residents.ts';import {createLife} from '../src/garage3d/residents/model.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
process.env.SUPABASE_URL='https://motion-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fake-motion-unit-only';delete process.env.DEEPINFRA_API_KEY;delete process.env.TYPESAFE_API_KEY;
let row={revision:1,payload:{state:createLife(),visitors:{},commands:{},at:Date.now(),nextAI:Date.now()+120000}};const original=globalThis.fetch;
globalThis.fetch=async(url,init)=>{if(String(url).startsWith('https://motion-test.invalid/rest/v1/house_resident_world')){if(init?.method==='PATCH'){if(Number(new URL(url).searchParams.get('revision').slice(3))!==row.revision)return new Response('[]');row={...row,...JSON.parse(init.body)};return new Response(JSON.stringify([{revision:row.revision}]));}return new Response(JSON.stringify(row));}return original(url,init);};
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}),sent=[],errors=[];
try{
 async function enter(name){
  const context=await browser.newContext({permissions:['camera'],viewport:{width:1280,height:900}});
  await context.addInitScript(()=>{
   window.__media=0;window.__tracks=[];const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
   navigator.mediaDevices.getUserMedia=async options=>{window.__media++;const stream=await get(options);window.__tracks.push(...stream.getTracks());return stream;};
   const Native=Worker;window.Worker=class{
    constructor(url,...args){if(!String(url).includes('avatar-pose-worker'))return new Native(url,...args);}
    postMessage(data){data.bitmap?.close();setTimeout(()=>{if(this.stopped)return;
     if(data.type==='init')this.onmessage?.({data:{type:'ready'}});
     else {const p=Array.from({length:33},()=>({x:.5,y:.5,z:0,visibility:0}));p[12]={x:.4,y:.4,z:0,visibility:1};p[14]={x:.2,y:.4,z:0,visibility:1};p[16]={x:.2,y:.2,z:0,visibility:1};this.onmessage?.({data:{type:'pose',points:p,ms:5}});}
    },5);}
    terminate(){this.stopped=true;}
   };
  });
  if(!process.env.LIVE_HOUSE)await context.route('**/api/house-residents',async route=>{const req=route.request(),body=req.postDataJSON(),out={status:200};if(body.feature==='network')sent.push(body);
   await handler({method:'POST',headers:{...req.headers(),host:'localhost:3000'},body},{setHeader(){},status(n){out.status=n;return this;},json(body){out.body=body;return this;}});await route.fulfill({status:out.status,contentType:'application/json',body:JSON.stringify(out.body)});
  });
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(process.env.LIVE_HOUSE&&new URL(r.url()).pathname==='/api/house-residents'){try{const body=r.postDataJSON();if(body?.feature==='network')sent.push(body);}catch{}}});await p.goto(`${process.env.BASE_URL||'http://localhost:3000'}/garagem?network=1`);await p.getByRole('textbox',{name:'Como podemos chamar você?'}).fill(name);await p.getByRole('button',{name:'Entrar na casa',exact:true}).click();return p;
 }
 const a=await enter('Ana Gesto'),b=await enter('Bruno Gesto');await b.locator('.house3d-person[aria-label="Ver Ana Gesto"]').waitFor({state:'attached'});
 await a.getByRole('button',{name:'Movimentar avatar · teste'}).click();const share=a.getByRole('checkbox',{name:'Compartilhar meus gestos com a sala'});assert.equal(await share.isChecked(),false);
 await a.getByRole('button',{name:'Ativar câmera só para movimentos'}).click();await a.waitForFunction(()=>document.querySelector('.motion-panel video')?.srcObject?.active);await a.waitForTimeout(1800);
 assert.equal(sent.some(r=>r.messages?.some(m=>m.data.type==='pose'&&m.data.pose)),false,'local preview sends no gestures');
 await share.check();await b.waitForFunction(()=>document.querySelector('.house3d-person[aria-label="Ver Ana Gesto"]')?.dataset.motionActive==='true'&&Number(document.querySelector('.house3d-person[aria-label="Ver Ana Gesto"]').dataset.armAngle)<-.5);
 await b.waitForTimeout(1800);assert.equal(await b.locator('.house3d-person[aria-label="Ver Ana Gesto"]').getAttribute('data-motion-active'),'true','an active capture keeps animating');
 const samples=sent.flatMap(r=>r.messages??[]).filter(m=>m.data.type==='pose'&&m.data.pose);assert.ok(samples.length);assert.ok(samples.every(m=>m.data.pose.length===5&&m.data.pose.every(Number.isFinite)&&Object.keys(m.data).sort().join(',')==='captured,from,pose,type'));
 assert.equal(await b.evaluate(()=>window.__media),0,'receiver never opens a webcam');
 await share.uncheck();await b.waitForFunction(()=>document.querySelector('.house3d-person[aria-label="Ver Ana Gesto"]')?.dataset.motionActive==='false'&&Math.abs(Number(document.querySelector('.house3d-person[aria-label="Ver Ana Gesto"]').dataset.armAngle))<.02);
 assert.equal(await a.locator('.motion-panel video').evaluate(v=>v.srcObject.active),true,'turning off sharing keeps the private preview');
 await a.getByRole('button',{name:'Parar e desligar câmera'}).click();assert.ok(await a.evaluate(()=>window.__tracks.every(t=>t.readyState==='ended')));
 await a.getByRole('button',{name:'Sair da casa',exact:true}).click();await b.getByRole('button',{name:'Sair da casa',exact:true}).click();
 assert.deepEqual(errors,[]);console.log('PASS isolated sessions: opt-in, five-angle-only transmission, real remote rig motion, smooth reset, receiver camera untouched and sender camera release.');
}finally{await browser.close();globalThis.fetch=original;}
