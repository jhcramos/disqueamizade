import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({channel:'chrome',headless:true});
const users=[], errors=[];
try {
 const pages=[];
 for(const name of ['Telefone teste A','Telefone teste B']) {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage(); pages.push(page);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',async response=>{if(response.url().includes('/auth/v1/signup') && response.ok()){const data=await response.json();if(data.user?.id)users.push(data.user.id);}});
  page.on('response',async response=>{if(response.url().includes('/functions/v1/send-chat')){const data=await response.json();console.log('CHAT HTTP',response.status(),data.error || 'ok');}});
  await page.addInitScript(()=>{window.mediaRequests=0;navigator.mediaDevices.getUserMedia=async()=>{window.mediaRequests++;throw Error('Unexpected media request');};});
  await page.goto('https://disqueamizade.com.br/garagem');
  await page.getByRole('textbox',{name:'Como podemos chamar você?'}).fill(name);
  await page.getByRole('button',{name:'Entrar na casa',exact:true}).click();
  await page.locator('.house-red-phone').first().waitFor({state:'attached'});
 }
 const [a,b]=pages;
 await b.getByRole('combobox',{name:'Escolher ambiente'}).selectOption('living');
 await b.waitForTimeout(4500);
 await a.getByRole('button',{name:'Interagir',exact:true}).click();
 await a.getByRole('button',{name:'Disque Surpresa · telefones vermelhos',exact:true}).click();
 await a.getByRole('button',{name:'Ligar para alguém',exact:true}).click();
 await b.locator('.phone-ring-notice').waitFor({timeout:20000});
 assert.equal(await b.locator('.house-red-phone.is-ringing').count(),1);
 await b.locator('.phone-ring-notice').click();
 await b.getByRole('button',{name:'Atender ligação',exact:true}).click();
 for(const p of pages) await p.getByText('Conversa aberta. O vídeo aparece quando a pessoa ativar a câmera.').waitFor({timeout:30000});
 await a.getByRole('textbox',{name:'Mensagem privada'}).fill('Teste técnico de ligação entre ambientes.');
 await a.getByRole('button',{name:'Enviar mensagem privada'}).click();
 try { await b.getByText('Teste técnico de ligação entre ambientes.',{exact:false}).waitFor({timeout:20000}); }
 catch(e) { for (const [i,p] of pages.entries()) { await p.screenshot({path:`/tmp/disque-phone-failure-${i}.png`}); console.log('CHAT ALERT',i,await p.getByRole('alert').allTextContents()); } throw e; }
 await b.screenshot({path:'/tmp/disque-phone-live-call.png'});
 for(const p of pages) assert.equal(await p.evaluate(()=>window.mediaRequests),0);
 await a.getByRole('button',{name:'Encerrar conversa',exact:true}).click();
 await b.locator('.house-phone-video').waitFor({state:'detached',timeout:15000});
 assert.deepEqual(errors,[]);
 console.log('PASS production: two independent mobile sessions, garage→living ring, one flashing phone, answer, both LiveKit connections, private text delivery, zero media requests and remote hangup.');
} finally {
 await browser.close();
 fs.writeFileSync('/tmp/disque-phone-test-users.json',JSON.stringify(users));
}
