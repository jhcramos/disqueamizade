import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
try {
 await page.addInitScript(() => {
  window.__yt = { created: 0, destroyed: 0 };
  window.YT = { Player: class {
   constructor(el, options) { this.frame = document.createElement('iframe'); this.frame.srcdoc = '<body style="margin:0;background:#193d38;color:#f9e6b8;display:grid;place-items:center;height:100vh;font:26px Georgia">Vídeo na TV da casa</body>'; el.replaceWith(this.frame); window.__yt.created++; setTimeout(() => options.events.onReady(), 30); }
   getIframe() { return this.frame; } destroy() { window.__yt.destroyed++; this.frame.remove(); }
   playVideo() {} pauseVideo() {} seekTo() {} setVolume() {}
  }};
 });
 await page.goto(`${process.env.BASE_URL || 'http://localhost:3000'}/garagem`);
 await page.getByRole('textbox', { name: 'Como podemos chamar você?' }).fill('Cinema');
 await page.getByRole('button', { name: 'Entrar na casa', exact: true }).click();
 await page.locator('.garage3d-canvas[data-camera=overview]').waitFor();
 async function program() {
  await page.getByRole('button', { name: 'Televisão', exact: true }).click();
  await page.getByRole('button', { name: 'Assumir o controle', exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole('textbox', { name: 'Link do YouTube' }).fill('https://youtu.be/M7lc1UVf-VE');
  await page.getByRole('textbox', { name: 'Nome do vídeo' }).fill('Cinema na casa');
  await page.getByRole('button', { name: 'Adicionar à fila' }).click();
  await page.locator('.theatre-queue li').waitFor();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Colocar na tela', exact: true }).click();
  await page.getByRole('button', { name: 'Assistir junto' }).waitFor();
 }
 async function assertScreen(label) {
  await page.locator('.garage3d-canvas[data-camera=cinema]').waitFor();
  await page.waitForTimeout(600);
  const box = await page.locator('.theatre-player iframe').boundingBox(), slot = await page.locator('.house3d-tv-slot').boundingBox();
  assert.ok(box.width >= 200 && box.height >= 200, `${label}: minimum dimensions ${JSON.stringify(box)}`);
  for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(box[key] - slot[key]) < 2, `${label}: screen alignment ${key}: ${JSON.stringify({box,slot})}`);
  assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= page.viewportSize().width && box.y + box.height <= page.viewportSize().height, `${label}: onscreen`);
  assert.ok(await page.locator('.theatre-player iframe').evaluate(el => { const r=el.getBoundingClientRect(); return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===el; }), `${label}: player is not covered`);
  assert.equal(await page.locator('.garage3d-camera').isVisible(), false);
 }
 await program();
 await page.getByRole('button', { name: 'Assistir junto' }).click();
 await page.locator('.theatre-player iframe').waitFor();
 await page.locator('.theatre-player iframe').evaluate(el => el.dataset.instance = 'original');
 const position = await page.locator('.garage3d-canvas').getAttribute('data-position');
 await page.getByRole('button', { name: 'Assistir na TV', exact: true }).click();
 await assertScreen('desktop');
 assert.equal(await page.locator('.garage3d-canvas').getAttribute('data-position'), position);
 await page.getByRole('button', { name: '⛶ Tela cheia', exact: true }).click();
 await assertScreen('fullscreen');
 const chat = await page.getByRole('textbox', { name: 'Mensagem pública' }).boundingBox(); assert.ok(chat.y + chat.height <= 1000);
 await page.screenshot({ path: '/tmp/house-cinema-desktop.png' });
 await page.getByRole('button', { name: 'Assistir no painel' }).click();
 assert.equal(await page.locator('.theatre-player iframe').getAttribute('data-instance'), 'original');
 assert.deepEqual(await page.evaluate(() => window.__yt), { created: 1, destroyed: 0 });
 await page.getByRole('button', { name: 'Assistir na TV', exact: true }).click();
 await page.getByRole('button', { name: 'Voltar à casa', exact: true }).click();
 await page.locator('.garage3d-canvas[data-camera=overview]').waitFor();
 await page.getByRole('button', { name: '✕ Sair da tela cheia', exact: true }).click();
 await page.setViewportSize({ width: 390, height: 844 });
 await page.getByRole('button', { name: 'Assistir na TV', exact: true }).click();
 await assertScreen('mobile');
 assert.equal(await page.locator('.garage3d-canvas').getAttribute('data-shadows'), 'false');
 assert.equal(await page.locator('.theatre-player iframe').getAttribute('data-instance'), 'original');
 assert.deepEqual(await page.evaluate(() => window.__yt), { created: 1, destroyed: 0 });
 await page.screenshot({ path: '/tmp/house-cinema-mobile.png' });
 await page.setViewportSize({ width: 320, height: 640 });
 await page.getByRole('status').filter({ hasText: 'A tela está pequena' }).waitFor();
 await page.locator('.garage3d-canvas[data-camera=overview]').waitFor();
 assert.equal(await page.locator('.theatre-player iframe').getAttribute('data-instance'), 'original');
 await page.setViewportSize({ width: 1440, height: 1000 });
 await page.getByRole('button', { name: 'Fechar televisão' }).click();
 assert.equal(await page.locator('.theatre-player iframe').count(), 0);
 // Each environment uses its own physical screen and cleans up playback when leaving.
 for (const room of ['Sala de estar', 'Bar Vinyl']) {
  await page.getByRole('navigation', { name: 'Ambientes da casa' }).getByRole('button', { name: new RegExp(room) }).click();
  if (room === 'Bar Vinyl') await page.getByRole('button', {name:'Tenho 18 anos ou mais'}).click();
  await program(); await page.getByRole('button', { name: 'Assistir na TV', exact: true }).click();
  await assertScreen(room);
  await page.getByRole('button', { name: 'Fechar televisão' }).click();
 }
 assert.deepEqual(errors, []);
 console.log('PASS cinema alignment in all rooms, desktop/fullscreen/mobile, single player, readable fallback, camera restoration, chat, no avatar movement, cleanup');
} catch (error) { await page.screenshot({path:'/tmp/house-cinema-failure.png'}); console.error(await page.locator('.house-theatre').innerText().catch(()=>'')); throw error; } finally { await browser.close(); }
