import assert from 'node:assert/strict';const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage();await page.goto('http://localhost:3000/');
 const result=await page.evaluate(async()=>{
  const {setCameraAvatar}=await import('/src/garage/cameraAvatar.ts');
  const {AvatarMaskRenderer}=await import('/src/garage/AvatarMaskRenderer.ts'),{avatarMask}=await import('/src/masks/avatar.ts');
  localStorage.setItem('garage-avatar-v1',JSON.stringify({avatar:0,appearance:{hairstyle:'bald',skin:'golden'}}));
  const render=()=>{const r=new AvatarMaskRenderer();r.renderer.render(r.scene,r.camera);const image=r.renderer.domElement.toDataURL();r.dispose();return image;};
  const stored=render();const stop=setCameraAvatar(7,{hairstyle:'punk',skin:'dark',hair:'pink',body:'feminine'});const current=render();
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d'),pose={cx:320,cy:180,faceW:120,faceH:150,roll:0,yaw:0,box:{x:260,y:100,w:120,h:150},forehead:{x:320,y:105},chin:{x:320,y:255},blinkL:0,blinkR:0,mouthOpen:0};
  await avatarMask.preload();avatarMask.render({ctx,pose});const before=canvas.toDataURL();setCameraAvatar(2,{hairstyle:'bald',skin:'golden'});let blocked=false;try{avatarMask.render({ctx,pose});}catch{blocked=true;}await avatarMask.preload();ctx.clearRect(0,0,640,360);avatarMask.render({ctx,pose});const after=canvas.toDataURL();stop();
  return {different:stored!==current,cacheChanged:before!==after,blockedWhileChanging:blocked};
 });assert.deepEqual(result,{different:true,cacheChanged:true,blockedWhileChanging:true});console.log('PASS selected unsaved avatar changes rendered helmet; cached mask refreshes safely.');
}finally{await browser.close();}
