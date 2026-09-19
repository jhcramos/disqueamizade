import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
try{
 const context=await browser.newContext({permissions:['camera'],viewport:{width:1280,height:900}}),page=await context.newPage();
 page.on('console',m=>{if(m.text().includes('[avatar-pose]'))console.log(m.text());});
 await page.goto('http://localhost:3000/garagem-3d');
 const result=await page.evaluate(async()=>{
  const {createPoseCapture}=await import('/src/garage3d/motion/capture.ts');
  const video=document.createElement('video');video.muted=true;video.playsInline=true;document.body.append(video);
  return new Promise(resolve=>{let track;const statuses=[];const capture=createPoseCapture(video,()=>{},status=>{
   statuses.push(status);if(status.phase==='error')resolve({statuses,error:true});
   if(status.ms!==undefined){track=video.srcObject.getVideoTracks()[0];capture.stop();resolve({statuses,ended:track.readyState,cleared:video.srcObject===null});}
  });void capture.start();});
 });
 console.log(JSON.stringify(result));assert.ok(!result.error);assert.equal(result.ended,'ended');assert.equal(result.cleared,true);
 await page.reload();
 await page.getByRole('textbox',{name:'Como podemos chamar você?'}).waitFor();
 if(await page.getByRole('textbox',{name:'Como podemos chamar você?'}).count()){
  await page.getByRole('textbox',{name:'Como podemos chamar você?'}).fill('Teste local');
  await page.getByRole('button',{name:'Entrar na casa',exact:true}).click();
 }
 await page.getByRole('button',{name:'Movimentar avatar · teste'}).click();
 assert.equal(await page.locator('.motion-panel video').evaluate(v=>v.srcObject),null);
 await page.getByRole('button',{name:'Ativar câmera só para movimentos'}).click();
 await page.getByRole('button',{name:'Parar e desligar câmera'}).waitFor();await page.getByRole('button',{name:'Parar e desligar câmera'}).click();
 await page.getByRole('button',{name:'Ativar câmera só para movimentos'}).waitFor();
 const late=await page.evaluate(async()=>{
  const {createPoseCapture}=await import('/src/garage3d/motion/capture.ts');
  const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  const stream=await original({video:true,audio:false});let grant;
  navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{grant=resolve;});
  try{
   const v=document.createElement('video'),capture=createPoseCapture(v,()=>{},()=>{});
   const pending=capture.start();capture.stop();grant(stream);await pending;
   return {ended:stream.getVideoTracks()[0].readyState,attached:v.srcObject!==null};
  }finally{navigator.mediaDevices.getUserMedia=original;stream.getTracks().forEach(t=>t.stop());}
 });
 assert.deepEqual(late,{ended:'ended',attached:false});
 console.log('PASS actual Lite worker inference, private stream release and explicit opt-in/stop.');
}finally{await browser.close();}
