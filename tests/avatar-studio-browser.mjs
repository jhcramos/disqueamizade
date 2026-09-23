import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1120 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error' && /THREE|WebGL|shader|uniform/i.test(message.text())) errors.push(message.text());
});
async function rendered() {
  await page.locator('.as-canvas canvas').waitFor();
  await page.waitForFunction(() => !document.querySelector('.as-status'), undefined, { timeout: 30000 });
}
try {
  await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:3000'}/avatar-estudio`);
  await rendered();
  for (const name of ['Caio', 'Lia', 'Davi']) {
    await page.getByRole('button', { name, exact: true }).click();
    await rendered();
    assert.equal(await page.locator('.as-canvas canvas').count(), 1, 'Only one active renderer after preset changes');
    const before = await page.locator('.as-stage').screenshot();
    await page.getByRole('button', { name: 'Girar para a direita', exact: true }).click();
    await page.waitForTimeout(150);
    assert.notDeepEqual(await page.locator('.as-stage').screenshot(), before, 'Rotation changes the rendered model');
    await page.getByRole('button', { name: 'Reiniciar vista', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Caio', exact: true }).click();
  await rendered();
  await page.screenshot({ path: '/tmp/avatar-studio-desktop.png' });
  await page.getByRole('button', { name: 'Ver o rosto', exact: true }).click();
  await rendered();
  await page.screenshot({ path: '/tmp/avatar-studio-face.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Corpo inteiro', exact: true }).click();
  await rendered();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No mobile horizontal overflow');
  const canvas = await page.locator('.as-stage').boundingBox();
  const control = await page.locator('.as-rotate').boundingBox();
  assert.ok(control.y >= canvas.y + canvas.height, 'Controls do not cover the avatar');
  await page.screenshot({ path: '/tmp/avatar-studio-mobile.png', fullPage: true });
  for (const name of ['Novo', 'Original', 'Lado a lado']) {
    await page.getByRole('button', { name, exact: true }).click();
    await rendered();
  }
  await page.getByRole('link', { name: /disque amizade/ }).click();
  assert.equal(await page.locator('.as-canvas canvas').count(), 0, 'Renderer unmounted on exit');
  assert.deepEqual(errors, [], 'No shader, uniform limit or JavaScript errors');
  console.log('PASS: three presets, live rotation, portrait, mobile, view modes and navigation cleanup');
} finally { await browser.close(); }
