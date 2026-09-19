import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
try {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(`${process.env.BASE_URL || 'http://localhost:3000'}/garagem`);
  await p.getByRole('textbox', { name: 'Como podemos chamar você?' }).fill('Exploradora');
  await p.getByRole('button', { name: 'Entrar na casa', exact: true }).click();
  await p.locator('.is-mobile-house').waitFor();
  await p.waitForTimeout(800);
  const world = await p.locator('.garage-scene').boundingBox();
  const viewport = await p.locator('.house-viewport').boundingBox();
  assert.ok(world.width > viewport.width * 2);
  assert.ok(viewport.height > 600);
  assert.equal(await p.locator('.room-chat').isVisible(), false);
  const dock = p.getByRole('navigation', { name: 'Ferramentas da casa' });
  await dock.getByRole('button', { name: /Chat/ }).click();
  await p.getByRole('textbox', { name: 'Mensagem pública' }).fill('Oi, casa!');
  await p.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await dock.getByRole('button', { name: 'Rodas', exact: true }).click();
  assert.equal(await p.locator('.room-chat').isVisible(), false);
  await p.locator('.gathering-spot').filter({ hasText: 'Roda do som' }).getByRole('button', { name: 'Abrir roda aqui' }).click();
  assert.equal(await p.locator('.gathering-panel').isVisible(), false);
  await dock.getByRole('button', { name: 'Interagir', exact: true }).click();
  await p.locator('.mobile-play-sheet').getByRole('button', { name: 'Apagar luzes' }).waitFor();
  assert.equal(await p.locator('.gathering-panel').isVisible(), false);
  await p.getByRole('button', { name: 'Fechar painel e voltar à casa' }).click();
  const position = () => p.locator('.avatar-name.is-self').evaluate(el => ({ left: el.style.left, top: el.style.top }));
  const before = await position();
  // Drag the room, avoiding objects. This must not issue a walking destination.
  await p.mouse.move(60, 570);
  await p.mouse.down();
  await p.mouse.move(220, 570, { steps: 10 });
  await p.mouse.up();
  await p.getByRole('button', { name: 'Voltar ao meu avatar' }).waitFor();
  await p.waitForTimeout(400);
  assert.deepEqual(await position(), before);
  await p.getByRole('button', { name: 'Voltar ao meu avatar' }).click();
  await p.screenshot({ path: '/tmp/disque-mobile-close.png' });
  await p.getByRole('button', { name: /Levantar de Roda do som/ }).click();
  await p.getByRole('button', { name: /Levantar de Roda do som/ }).waitFor({ state: 'detached' });
  await p.getByRole('button', { name: 'Ver ambiente inteiro' }).click();
  await p.waitForTimeout(250);
  const whole = await p.locator('.garage-scene').boundingBox();
  assert.ok(whole.width <= viewport.width + 1);
  await p.screenshot({ path: '/tmp/disque-mobile-overview.png' });
  // A tap in the overview maps to the same walkable normalized floor coordinates.
  const floor = await p.locator('.garage-scene').evaluate(el => {
    const r = el.getBoundingClientRect();
    for (const [x, y] of [[.70, .66], [.65, .62], [.38, .72], [.5, .7]]) {
      const point = { x: r.left + r.width * x, y: r.top + r.height * y };
      const target = document.elementFromPoint(point.x, point.y);
      if (target?.closest('.garage-scene') && !target.closest('button')) return point;
    }
  });
  assert.ok(floor, 'Overview must have unobstructed walkable floor');
  await p.touchscreen.tap(floor.x, floor.y);
  await p.waitForFunction(prev => document.querySelector('.avatar-name.is-self').style.left !== prev.left, before);
  await p.getByRole('button', { name: 'Voltar para perto' }).click();
  await p.getByLabel('Escolher ambiente').selectOption('living');
  await p.locator('.garage-backdrop[src*="living"]').waitFor();
  await p.getByLabel('Escolher ambiente').selectOption('bar');
  await p.getByRole('button', { name: 'Tenho 18 anos ou mais' }).click();
  await dock.getByRole('button', { name: 'Interagir', exact: true }).click();
  await p.getByText('Escolher lugar na lista', { exact: true }).click();
  await p.locator('.mobile-play-sheet').getByRole('button', { name: 'Mesa 1 · lugar 1', exact: true }).waitFor();
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await p.setViewportSize({ width: 844, height: 390 });
  await p.locator('.is-mobile-house').waitFor();
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.locator('.is-mobile-house').waitFor({ state: 'detached' });
  assert.ok(await p.locator('.garage-topbar').isVisible());
  assert.deepEqual(errors, []);
  console.log('PASS phone viewport, collapsed chat, exclusive tools, pan without walking, recenter, overview walking, rooms and bar seats, landscape, desktop restore');
} catch (e) { console.log('PAGE ERRORS', errors); throw e; }
finally { await browser.close(); }
