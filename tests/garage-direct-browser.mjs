const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const pages = [];
  for (const name of ["Ana", "Bruno", "Carlos"]) {
    const p = await context.newPage();
    await p.goto(process.env.CHECK_URL || "http://localhost:3000/garagem");
    await p
      .getByRole("textbox", { name: "Como podemos chamar você?" })
      .fill(name);
    await p
      .getByRole("button", { name: "Entrar na casa", exact: true })
      .click();
    pages.push(p);
  }
  const [a, b, c] = pages;
  await a.waitForTimeout(1800);
  await a.locator(".social-chat summary").click();
  await a.getByLabel("Orientação opcional").selectOption("Gay");
  await b.waitForTimeout(1100);
  if (
    (
      await b.locator(".avatar-name").filter({ hasText: "Ana" }).innerText()
    ).includes("Gay")
  )
    throw Error("Hidden orientation disclosed");
  await a.getByLabel("Mostrar sobre meu avatar").check();
  await b
    .locator(".avatar-name")
    .filter({ hasText: "Ana" })
    .filter({ hasText: "Gay" })
    .waitFor();
  await a.getByLabel("Mostrar sobre meu avatar").uncheck();
  await b.waitForTimeout(1200);
  if (
    (
      await b.locator(".avatar-name").filter({ hasText: "Ana" }).innerText()
    ).includes("Gay")
  )
    throw Error("Hide did not propagate");
  await a.getByRole("button", { name: "Ver pessoas em lista" }).click();
  await a.locator(".garage-people button").filter({ hasText: "Bruno" }).click();
  await a.getByRole("button", { name: "Mandar mensagem", exact: true }).click();
  await b
    .getByRole("button", { name: "Aceitar mensagem", exact: true })
    .waitFor();
  if (
    await a
      .getByRole("textbox", { name: "Mensagem privada", exact: true })
      .count()
  )
    throw Error("Compose before consent");
  await b
    .getByRole("button", { name: "Aceitar mensagem", exact: true })
    .click();
  await a
    .getByRole("textbox", { name: "Mensagem privada", exact: true })
    .fill("Segredo <b>seguro</b>");
  await a.getByRole("button", { name: "Enviar privada", exact: true }).click();
  await b
    .getByRole("log", { name: "Mensagens privadas" })
    .getByText("Segredo <b>seguro</b>", { exact: false })
    .waitFor();
  if (await c.getByText("Segredo <b>seguro</b>", { exact: false }).count())
    throw Error("Private text rendered for third visitor");
  if (await b.locator(".direct-history b").count())
    throw Error("HTML interpreted");
  if (await a.locator("video").evaluateAll((es) => es.some((e) => e.srcObject)))
    throw Error("Text started camera");
  await b
    .getByRole("button", { name: "Bloquear nesta visita", exact: true })
    .click();
  await a
    .getByRole("textbox", { name: "Mensagem privada", exact: true })
    .waitFor({ state: "detached" });
  await b.locator(".social-chat summary").click();
  await b.getByLabel("Aberto a convites de vídeo").uncheck();
  await a.waitForTimeout(1200);
  if (
    await a
      .getByRole("button", { name: "Convidar para vídeo", exact: true })
      .count()
  )
    throw Error("Video preference ignored");
  await a.setViewportSize({ width: 390, height: 844 });
  if (await a.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw Error("Mobile overflow");
  console.log(
    "PASS opt-in orientation/hide, visible modes, consent, private text isolation, camera off, block, mobile",
  );
} finally {
  await browser.close();
}
