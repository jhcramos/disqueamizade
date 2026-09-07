const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(process.env.CHECK_URL || "http://localhost:3000/garagem");
await p
  .getByRole("textbox", { name: "Como podemos chamar você?" })
  .fill("Visitante");
await p.getByRole("button", { name: "Entrar na casa", exact: true }).click();
await p.locator(".surprise-station").waitFor();
await p.screenshot({ path: "/tmp/station-desktop.png" });
await p
  .getByRole("button", {
    name: "Disque Surpresa: abrir roleta 1 a 1",
    exact: true,
  })
  .click();
await p.getByRole("dialog").waitFor();
await p.screenshot({ path: "/tmp/station-dialog.png" });
await p.keyboard.press("Escape");
await p.getByRole("dialog").waitFor({ state: "detached" });
await p.setViewportSize({ width: 390, height: 844 });
await p.locator(".surprise-menu").click();
if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth))
  throw Error("Overflow");
await p.screenshot({ path: "/tmp/station-mobile.png" });
const link = p.getByRole("link", { name: "Ir para a roleta", exact: true });
if ((await link.getAttribute("href")) != "/roulette?from=house")
  throw Error("route");
await link.click();
await p.waitForURL("**/roulette?from=house");
await p
  .getByRole("link", { name: "Voltar para a casa", exact: false })
  .waitFor();
if (await p.locator("video").evaluateAll((es) => es.some((e) => e.srcObject)))
  throw Error("Auto media");
if (errors.length) throw Error(errors.join(";"));
console.log(
  "PASS station, modal, Escape, mobile, roulette route, return and no auto media",
);
await b.close();
