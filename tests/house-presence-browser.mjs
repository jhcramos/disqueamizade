import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({channel:'chrome',headless:true});
const context = await browser.newContext({viewport:{width:1440,height:1000}});
const errors=[];
// Delay only outgoing presence snapshots, as when a background tab's updates stall.
// Keep the real house, renderer, roster and BroadcastChannel delivery intact.
await context.addInitScript(()=>{
 const send=BroadcastChannel.prototype.postMessage;
 BroadcastChannel.prototype.postMessage=function(message){
  if(window.__holdPresence&&this.name==='disque-house-3d-v1'&&['person','hello'].includes(message?.event))return;
  return send.call(this,message);
 };
});
try {
 async function enter(name) {
  const p=await context.newPage();if(name==='Ana')await p.clock.install();p.on('pageerror',e=>errors.push(e.stack || e.message));
  await p.goto(`${process.env.BASE_URL||'http://localhost:3000'}/garagem`);
  await p.getByRole('textbox',{name:'Como podemos chamar você?'}).fill(name);
  await p.getByRole('button',{name:'Entrar na casa',exact:true}).click();
  await p.locator('.garage3d-canvas[data-camera=overview]').waitFor();return p;
 }
 const b=await enter('Bia'),a=await enter('Ana');
 await a.waitForFunction(()=>document.querySelector('.garage3d-canvas')?.dataset.people==='1');

 await a.evaluate(()=>{
  const el=document.querySelector('.garage3d-canvas');window.__roster=[el.dataset.people];
  new MutationObserver(()=>{const last=window.__roster.at(-1);if(last!==el.dataset.people)window.__roster.push(el.dataset.people);}).observe(el,{attributes:true,attributeFilter:['data-people']});
 });
 await b.evaluate(()=>window.__holdPresence=true);
 await a.getByRole('button',{name:'Primeira pessoa',exact:true}).click();
 const start=await a.locator('.garage3d-canvas').getAttribute('data-position');
 await a.keyboard.down('s');await a.waitForTimeout(1200);await a.keyboard.up('s');
 assert.notEqual(await a.locator('.garage3d-canvas').getAttribute('data-position'),start,'the observing visitor actually walked');
 await a.waitForTimeout(9000);
 const during=await a.locator('.garage3d-canvas').getAttribute('data-people');
 await b.evaluate(()=>window.__holdPresence=false);
 await a.waitForFunction(()=>document.querySelector('.garage3d-canvas')?.dataset.people==='1');
 console.log('Roster while walking across a peer suspension:',await a.evaluate(()=>window.__roster));
 assert.equal(during,'1','A short browser suspension must not remove the other avatar');
 assert.deepEqual(await a.evaluate(()=>window.__roster),['1'],'No disappearance/reappearance cycle');
 // A throttled minute is tolerated; an abandoned peer still expires eventually.
 await b.evaluate(()=>window.__holdPresence=true);
 await a.clock.fastForward(70_000);
 assert.equal(await a.locator('.garage3d-canvas').getAttribute('data-people'),'1','A background heartbeat interval is tolerated');
 await a.clock.fastForward(25_000);
 await a.waitForFunction(()=>document.querySelector('.garage3d-canvas')?.dataset.people==='0');
 await b.evaluate(()=>window.__holdPresence=false);
 await a.waitForFunction(()=>document.querySelector('.garage3d-canvas')?.dataset.people==='1');
 // Explicit departures are still immediate, rather than retaining phantom visitors.
 await b.getByRole('button',{name:'Sair da casa',exact:true}).click();
 await a.waitForFunction(()=>document.querySelector('.garage3d-canvas')?.dataset.people==='0',undefined,{timeout:5000});
 assert.deepEqual(errors,[]);
 console.log('PASS walking with a suspended peer, stable avatar presence, resume, bounded expiry and explicit departure');
} finally {await browser.close();}
