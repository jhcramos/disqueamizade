const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const pages = [];
  const errors = [];
  for (const name of ["Ana", "Bruno"]) {
    const p = await context.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://localhost:3000/garagem");
    await p
      .getByRole("textbox", { name: "Como podemos chamar você?" })
      .fill(name);
    await p
      .getByRole("button", { name: "Entrar na casa", exact: true })
      .click();
    pages.push(p);
  }
  const [a, b] = pages;
  await a.waitForTimeout(1800);
  await a.locator(".room-chat-toggle").click();
  await a
    .getByRole("textbox", { name: "Mensagem pública" })
    .fill("Olá, sala! <b>texto seguro</b>");
  await a.getByRole("button", { name: "Enviar mensagem", exact: true }).click();
  await b.locator(".room-speech").filter({ hasText: "Olá, sala!" }).waitFor();
  await b.locator(".room-chat-toggle").filter({ hasText: "1 novas" }).waitFor();
  await b.locator(".room-chat-toggle").click();
  await b
    .locator(".room-chat-message")
    .filter({ hasText: "<b>texto seguro</b>" })
    .waitFor();
  if (await b.locator(".room-chat-message b").count())
    throw Error("HTML was interpreted");
  await a.waitForTimeout(6500);
  if (await b.locator(".room-speech").count())
    throw Error("Speech did not expire");
  if ((await b.locator(".room-chat-message").count()) !== 1)
    throw Error("History lost");
  await b
    .getByRole("button", { name: /Sala de estar/ })
    .first()
    .click();
  await b.locator(".room-chat-toggle").click();
  if (await b.locator(".room-chat-message").count())
    throw Error("Room history leaked");
  await a
    .getByRole("button", { name: "Posso participar?", exact: true })
    .click();
  await b.waitForTimeout(400);
  if (await b.locator(".room-chat-message").count())
    throw Error("Room delivery leaked");
  await a.setViewportSize({ width: 390, height: 844 });
  if (await a.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw Error("Mobile overflow");
  await a.screenshot({
    path: "/tmp/garage-room-chat-mobile.png",
    fullPage: true,
  });
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS delivery, unread, safe text, speech expiry, history, room isolation and mobile",
  );
} finally {
  await browser.close();
}
