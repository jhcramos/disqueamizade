import assert from 'node:assert/strict';
import {createLife} from '../src/garage3d/residents/model.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});const failures=[];
async function enter(){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const calls=[],errors=[];let distance=1.3,solo=false;
 await context.route('**/api/house-residents',async route=>{const body=route.request().postDataJSON(),state=createLife();state.residents[0].position={x:body.visitor.position.x+(distance>5?-distance:distance),z:body.visitor.position.z};state.residents[0].path=[];state.residents[1].position={x:9,z:6.5};state.residents[1].path=[];state.social.solo[body.visitor.id]=solo;if(body.command)calls.push(body.command);
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({state,identity:{id:body.visitor.id,token:'synthetic-session'},commandId:body.command?.id,result:'Pedido recebido.'})});});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:3000/garagem');await p.getByRole('textbox',{name:'Como podemos chamar você?'}).fill('Teste de gestos');await p.getByRole('button',{name:'Entrar na casa',exact:true}).click();await p.locator('.garage3d-canvas[data-resident-mode=online]').waitFor({timeout:30000});
 return{p,context,calls,errors,setDistance:n=>distance=n,setSolo:n=>solo=n};
}
async function waitUntil(p,fn){await p.waitForFunction(fn,undefined,{timeout:8000});}
async function gesture(p,kind){const canvas=p.locator('.garage3d-canvas'),box=await canvas.boundingBox(),cdp=await p.context().newCDPSession(p);const x=box.x+box.width*.5,y=box.y+box.height*.45;const touch=(id,x,y)=>({id,x,y,radiusX:5,radiusY:5,force:1});
 if(kind==='pinch'){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,x-28,y),touch(2,x+28,y)]});
  for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,x-28-i*7,y),touch(2,x+28+i*7,y)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[touch(1,x-63,y)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,x-43,y+8)]});
 }else{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,x,y)]});
  for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,x+i*10,y+i*5)]});
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
}
if(process.env.CHECK!=='gestures'){
 const t=await enter();try{
  const prompt=t.p.getByRole('complementary',{name:'Conversar com Dora',exact:true});await prompt.waitFor({timeout:5000});assert.match(await prompt.innerText(),/Tudo bem/i);assert.equal(t.calls.length,0,'Walking near a host must not invoke AI or send invites');await t.p.screenshot({path:'/tmp/house-proximity-mobile.png'});await prompt.getByRole('button',{name:'O que tem pra fazer?',exact:true}).click();assert.equal(await prompt.getByRole('button',{name:'Papo tranquilo',exact:true}).count(),1);assert.equal(t.calls.length,0,'Browsing activities must not invoke AI');await prompt.getByRole('button',{name:'Voltar',exact:true}).click();
  await prompt.getByRole('button',{name:'Só passeando',exact:true}).click();await prompt.waitFor({state:'hidden'});await t.p.waitForTimeout(2200);assert.equal(await prompt.count(),0,'Dismissal survives polling and proximity jitter');
  t.setDistance(6);await t.p.waitForTimeout(2200);t.setDistance(1.3);await t.p.waitForTimeout(2200);assert.equal(await prompt.count(),0,'No repeated greeting during cooldown');
  await t.p.getByRole('button',{name:'Interagir com Dora',exact:true}).click();await t.p.getByRole('button',{name:'Topo qualquer coisa',exact:true}).waitFor();assert.equal(t.calls.length,0,'Opening options is not consent');assert.deepEqual(t.errors,[]);console.log('PASS nearby host greeting, dismissal, explicit options and no automatic AI');
 }catch(e){failures.push(e);await t.p.screenshot({path:'/tmp/house-proximity-failure.png'});}finally{await t.context.close();}
}
if(process.env.CHECK!=='proximity'){
 const t=await enter();try{
  t.setDistance(6);await t.p.waitForTimeout(2200);await t.p.getByRole('button',{name:'Casa inteira',exact:true}).click();await waitUntil(t.p,()=>+document.querySelector('.garage3d-canvas').dataset.zoom<1.1);
  const canvas=t.p.locator('.garage3d-canvas'),before=await canvas.getAttribute('data-position');await gesture(t.p,'pinch');await waitUntil(t.p,()=>+document.querySelector('.garage3d-canvas').dataset.zoom>1.6);assert.equal(await canvas.getAttribute('data-position'),before,'Pinch and last finger release must not walk');
  const focus=await canvas.getAttribute('data-focus');await gesture(t.p,'pan');await t.p.waitForTimeout(300);assert.notEqual(await canvas.getAttribute('data-focus'),focus,'Drag pans house');assert.equal(await canvas.getAttribute('data-position'),before,'Pan must not move avatar');
  await t.p.getByRole('button',{name:'Meu avatar',exact:true}).click();await waitUntil(t.p,()=>document.querySelector('.garage3d-canvas').dataset.cameraMode==='follow');await waitUntil(t.p,()=>+document.querySelector('.garage3d-canvas').dataset.zoom>2.9);assert.equal(await canvas.getAttribute('data-gesture-pointers'),'0');assert.deepEqual(t.errors,[]);await t.p.screenshot({path:'/tmp/house-mobile-gestures.png'});console.log('PASS real mobile pinch, pan, gesture suppression and camera reset');
 }catch(e){failures.push(e);await t.p.screenshot({path:'/tmp/house-gestures-failure.png'});}finally{await t.context.close();}
}
await browser.close();if(failures.length){for(const e of failures)console.error(e.message);process.exitCode=1;}
