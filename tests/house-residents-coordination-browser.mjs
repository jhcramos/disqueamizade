import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
const context=await browser.newContext();
async function setup(){const page=await context.newPage();await page.goto(`${process.env.BASE_URL||'http://localhost:3000'}/robots.txt`);await page.evaluate(async()=>{
 const {createResidentTransport}=await import('/src/garage3d/residents/transport.ts');
 const id=crypto.randomUUID();window.testVisitor={id,name:'Test',position:{x:-6.1,z:2.8}};
 window.transport=createResidentTransport(()=>window.testVisitor,(s,m)=>{window.testState=s;window.testMode=m;},r=>window.testResult=r);
});await page.waitForFunction(()=>window.testMode==='local');return page;}
const a=await setup(),b=await setup();await b.waitForTimeout(1000);
await a.evaluate(()=>window.transport.command('pick','toy'));
await b.waitForFunction(()=>!!window.testState.items.find(i=>i.id==='toy').holder);
const aid=await a.evaluate(()=>window.testVisitor.id);
assert.equal(await b.evaluate(()=>window.testState.items.find(i=>i.id==='toy').holder),aid);
await b.evaluate(()=>window.transport.command('pick','toy'));await b.waitForTimeout(700);
assert.equal(await b.evaluate(()=>window.testState.items.find(i=>i.id==='toy').holder),aid);
await a.evaluate(()=>window.transport.dispose());
await b.waitForFunction(()=>!window.testState.items.find(i=>i.id==='toy').holder);
await b.waitForTimeout(2200);
await b.evaluate(()=>window.transport.command('pick','toy'));
await b.waitForFunction(()=>window.testState.items.find(i=>i.id==='toy').holder===window.testVisitor.id);
console.log('PASS: shared possession, rejection of duplicate pickup, cleanup and coordinator takeover');
}finally{await browser.close();}
