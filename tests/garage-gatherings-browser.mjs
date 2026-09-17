// Same-browser local transport; never requests real camera or microphone.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
await context.addInitScript(() => {
  window.captureRequests = 0;
  navigator.mediaDevices.getUserMedia = async () => { window.captureRequests++; throw new Error('Unexpected media capture'); };
});
const errors = [];
const pages = [];
const base = process.env.BASE_URL || 'http://localhost:3000';
const card = p => p.locator('.gathering-spot').filter({ has: p.getByRole('heading', { name: 'Roda do som', exact: true }) });
try {
  for (const name of ['Ana', 'Bruno', 'Cris', 'Dani', 'Eli']) {
    const p = await context.newPage();
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(`${base}/garagem`);
    await p.getByRole('textbox', { name: 'Como podemos chamar você?' }).fill(name);
    await p.getByRole('button', { name: 'Entrar na casa', exact: true }).click();
    await p.locator('.gathering-panel').waitFor();
    pages.push(p);
    console.log('Joined', name);
  }
  const host = pages[0];
  await card(host).getByRole('button', { name: 'Abrir roda aqui' }).click();
  await card(pages[1]).getByText('Ana · 1/4').waitFor();
  await card(host).getByRole('button', { name: 'Reservar conversa' }).click();
  await card(pages[1]).getByText('Conversa reservada', { exact: true }).waitFor();
  assert.ok(await card(pages[1]).getByRole('button', { name: 'Pedir para participar' }).isDisabled());
  await card(host).getByRole('button', { name: 'Aceitar companhia' }).click();
  for (let i = 1; i <= 3; i++) {
    const guest = pages[i];
    await card(guest).getByRole('button', { name: 'Pedir para participar' }).click();
    await host.getByRole('button', { name: 'Convidar para a roda', exact: true }).click();
    console.log('Invited', i);
    await guest.getByRole('button', { name: 'Aceitar convite', exact: true }).click();
    await guest.getByRole('heading', { name: /Nossa roda/ }).waitFor();
    await card(pages[4]).getByText(`Ana · ${i + 1}/4`).waitFor();
    for (const p of pages.slice(0, i + 1)) {
      await p.waitForFunction(n => document.querySelectorAll('.group-video').length === n, i + 1);
      assert.equal(await p.evaluate(() => window.captureRequests), 0);
      await p.getByRole('button', { name: 'Ligar câmera', exact: true }).waitFor();
      await p.getByRole('button', { name: 'Ligar microfone', exact: true }).waitFor();
    }
  }
  assert.ok(await card(pages[4]).getByRole('button', { name: 'Pedir para participar' }).isDisabled());
  console.log('PASS request → host invitation → guest acceptance, four-person limit, media off, reserved state');
  await host.getByRole('button', { name: 'Caixinha de assuntos' }).click();
  await host.getByRole('button', { name: 'Compartilhar no chat da sala' }).click();
  await pages[4].locator('.room-chat').getByText('Qual música faria você levantar para dançar?', { exact: true }).waitFor();
  console.log('PASS optional question shared to room chat');
  await pages[4].setViewportSize({ width: 390, height: 844 });
  await pages[4].getByRole('navigation', { name: 'Ferramentas da casa' }).getByRole('button', { name: 'Rodas', exact: true }).click();
  assert.equal(await pages[4].evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await pages[4].locator('.gathering-panel').scrollIntoViewIfNeeded();
  await pages[4].screenshot({ path: '/tmp/disque-gatherings-mobile.png', fullPage: true });
  await host.locator('.gathering-panel').screenshot({ path: '/tmp/disque-gatherings-desktop.png' });
  await host.close();
  await pages[4].waitForFunction(() => !document.querySelector('.gathering-panel')?.textContent.includes('Ana ·'));
  const visitor = pages[4];
  await visitor.setViewportSize({ width: 1440, height: 1100 });
  await visitor.locator('.house-rooms').getByRole('button', { name: /Sala de estar/ }).click();
  await visitor.locator('.gathering-spot').filter({ hasText: 'Roda do sofá' }).getByRole('button', { name: 'Abrir roda aqui' }).click();
  await visitor.locator('.gathering-marker[data-occupied="true"]').waitFor();
  await visitor.locator('.house-rooms').getByRole('button', { name: /Bar Vinyl/ }).click();
  await visitor.getByRole('button', { name: 'Tenho 18 anos ou mais' }).click();
  assert.equal(await visitor.locator('.gathering-marker[data-occupied="true"]').count(), 0);
  assert.equal(await visitor.locator('.gathering-spot').count(), 3);
  await visitor.locator('.gathering-spot').filter({ has: visitor.getByRole('heading', { name: 'Mesa 2', exact: true }) }).getByRole('button', { name: 'Abrir roda aqui' }).click();
  await visitor.locator('.gathering-marker[data-occupied="true"]').waitFor();
  await visitor.getByRole('button', { name: 'Retirar placa' }).click();
  assert.equal(await visitor.locator('.gathering-marker[data-occupied="true"]').count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS mobile layout, host disconnect, sofa, three bar tables, clearing signs on room change');
} catch (error) {
  console.log('Page errors:', errors);
  for (const [i, page] of pages.entries()) if (!page.isClosed()) console.log('Page', i, (await page.locator('body').innerText()).slice(-6500));
  throw error;
} finally { await browser.close(); }
