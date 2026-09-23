import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {createLife,tickLife,parseLife} from '../src/garage3d/residents/model.ts';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const state=createLife(0);for(let t=0;t<=126000;t+=200)tickLife(state,.2,[],t);
assert.equal(state.speech.kind,'thought');assert.equal(state.residents[1].activity,'guitar');assert.ok(parseLife(state));
await context.route('**/api/house-residents',async route=>{
 const body=route.request().postDataJSON();
 if(body.feature)return route.continue();
 const s=structuredClone(state);s.speech.until=Date.now()+60000;s.domestic.deadline=Date.now()+90000;s.residents.forEach(r=>r.until=Date.now()+90000);s.social.solo[body.visitor.id]=true;
 await route.fulfill({json:{state:s,identity:{id:body.visitor.id,token:'test-only'},generative:false}});
});
try{
 await page.goto(`${process.env.BASE_URL||'http://localhost:3000'}/garagem`);
 await page.getByRole('textbox',{name:'Como podemos chamar você?'}).fill('Teste casal');
 await page.getByRole('button',{name:'Entrar na casa',exact:true}).click();
 await page.waitForFunction(()=>Number(document.querySelector('.garage3d-canvas')?.dataset.drawCalls)>0);
 await page.getByRole('combobox',{name:'Explorar área da casa'}).selectOption('garage');
 await page.waitForTimeout(3500);
 assert.equal(await page.getByRole('button',{name:'Interagir com Harold',exact:true}).count(),1);
 assert.equal(await page.getByRole('button',{name:'Interagir com Jana',exact:true}).count(),1);
 assert.equal(await page.locator('.resident-speech.is-thought').count(),1);
 await page.locator('.garage3d-stage').screenshot({path:'/tmp/jana-harold-guitar.png'});
 await page.getByRole('button',{name:/Moradores e objetos/}).click();
 await page.locator('.resident-picker select').selectOption('teo');
 await page.getByRole('button',{name:'Ocultar falas'}).click();
 assert.equal(await page.locator('.resident-speech').count(),0);
 await page.getByRole('button',{name:'Mostrar falas'}).click();
 await page.getByRole('button',{name:'Fechar interações'}).click();
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(2000);await page.screenshot({path:'/tmp/jana-harold-mobile.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 console.log('PASS names, rendered guitar, thought bubble, mute, mobile layout and no runtime errors');
}finally{await browser.close();}
