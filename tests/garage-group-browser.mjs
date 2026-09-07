// Run against the Vite development server; uses synthetic media only.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
});
const pages = [];
const errors = [];
try {
  for (const name of ["Ana", "Bruno", "Cris", "Dani", "Eli"]) {
    const p = await context.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://localhost:3000/garagem?testMedia=1");
    await p
      .getByRole("textbox", { name: "Como podemos chamar você?" })
      .fill(name);
    await p
      .getByRole("button", { name: "Entrar na casa", exact: true })
      .click();
    pages.push(p);
    await p.waitForTimeout(600);
  }
  await pages[0].waitForTimeout(1800);
  for (const p of pages)
    if (
      !(await p.locator("body").innerText()).includes(
        "MÍDIA SINTÉTICA DE TESTE",
      )
    )
      throw Error(
        "This test requires the development-only synthetic media fixture",
      );
  const host = pages[0];
  await host
    .getByRole("button", { name: "Pedir para conversar", exact: true })
    .click();
  await pages[1]
    .getByRole("button", { name: "Aceitar convite", exact: true })
    .click();
  for (const p of pages.slice(0, 2))
    await p.getByRole("heading", { name: "Nossa roda" }).waitFor();
  for (const p of pages.slice(0, 2)) {
    if (
      await p
        .getByRole("button", { name: "Mostrar meu rosto", exact: true })
        .count()
    )
      await p
        .getByRole("button", { name: "Mostrar meu rosto", exact: true })
        .click();
    await p.getByRole("button", { name: "Ligar câmera", exact: true }).click();
  }
  await host.waitForFunction(
    () =>
      [...document.querySelectorAll(".group-video video")].every(
        (v) => v.videoWidth === 640,
      ),
    {},
    { timeout: 20000 },
  );
  async function checkVideoLayout(count) {
    const result = await host.evaluate(() => {
      const sidebar = document
        .querySelector(".garage-sidebar")
        .getBoundingClientRect();
      const world = document
        .querySelector(".garage-world")
        .getBoundingClientRect();
      const cards = [...document.querySelectorAll(".group-video")].map(
        (el) => el.getBoundingClientRect().width,
      );
      return {
        cards,
        sidebarTop: sidebar.top,
        worldTop: world.top,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    const mobile = host.viewportSize().width < 540;
    if (
      result.cards.length !== count ||
      result.cards.some((w) => w < (mobile ? 280 : 350)) ||
      result.overflow
    )
      throw Error(
        "Camera layout is too small or overflowing: " + JSON.stringify(result),
      );
    if (mobile && result.sidebarTop >= result.worldTop)
      throw Error("Mobile conversation must precede room");
    console.log("PASS spacious camera layout", count, result.cards);
  }
  await checkVideoLayout(2);
  console.log("PASS pair real video");
  for (const [i, name] of [
    [2, "Cris"],
    [3, "Dani"],
  ]) {
    await host
      .getByRole("button", { name: `Convidar ${name}`, exact: true })
      .click();
    await pages[i]
      .getByRole("button", { name: "Aceitar convite", exact: true })
      .click();
    for (const p of pages.slice(0, i + 1)) {
      await p
        .getByRole("button", { name: "Ligar câmera", exact: true })
        .waitFor();
      await p.waitForFunction(
        (n) => document.querySelectorAll(".group-video").length === n,
        i + 1,
      );
    }
    await checkVideoLayout(i + 1);
    console.log("PASS audience change cameras paused", i + 1);
  }
  await host.setViewportSize({ width: 390, height: 844 });
  await checkVideoLayout(4);
  await host.screenshot({
    path: "/tmp/garage-chat-mobile.png",
    fullPage: true,
  });
  await host.setViewportSize({ width: 1440, height: 1100 });
  for (const p of pages.slice(0, 4)) {
    if (
      await p
        .getByRole("button", { name: "Mostrar meu rosto", exact: true })
        .count()
    )
      await p
        .getByRole("button", { name: "Mostrar meu rosto", exact: true })
        .click();
    await p.getByRole("button", { name: "Ligar câmera", exact: true }).click();
  }
  for (const p of pages.slice(0, 4))
    await p.waitForFunction(
      () =>
        [...document.querySelectorAll(".group-video video")].length === 4 &&
        [...document.querySelectorAll(".group-video video")].every(
          (v) => v.videoWidth === 640 && v.currentTime > 1,
        ),
      {},
      { timeout: 30000 },
    );
  console.log("PASS 4 pages each receiving four live video streams");
  for (const p of pages.slice(0, 4))
    await p
      .getByRole("button", { name: "Ligar microfone", exact: true })
      .click();
  for (const p of pages.slice(0, 4)) {
    await p.waitForFunction(
      () =>
        [...document.querySelectorAll(".group-video video")].every((v) =>
          v.srcObject
            ?.getAudioTracks()
            .some((t) => !t.muted && t.readyState === "live"),
        ),
      {},
      { timeout: 15000 },
    );
    await p.evaluate(() => {
      window.__qaTracks = document
        .querySelector(".group-video video")
        .srcObject.getTracks();
    });
    const fits = await p.evaluate(() => {
      const parent = document
        .querySelector(".garage-sidebar")
        .getBoundingClientRect();
      return [...document.querySelectorAll(".group-video")].every(
        (v) => v.getBoundingClientRect().right <= parent.right,
      );
    });
    if (!fits) throw Error("Video grid overflows sidebar");
  }
  console.log("PASS 4 audio streams and contained grid");
  if (
    await host
      .getByRole("button", { name: "Convidar Eli", exact: true })
      .count()
  )
    throw Error("Fifth visitor was offered a place");
  if (await pages[4].locator(".group-video video").count())
    throw Error("Outsider received video");
  console.log("PASS fifth visitor excluded");
  await host.screenshot({ path: "/tmp/four-cameras.png", fullPage: true });
  await pages[2]
    .getByRole("button", { name: "Desligar câmera", exact: true })
    .click();
  await host.waitForFunction(() =>
    [...document.querySelectorAll(".group-video")]
      .find((e) => e.dataset.participant === "Cris")
      ?.textContent.includes("Câmera desligada"),
  );
  console.log("PASS individual camera off");
  await pages[3]
    .getByRole("button", { name: "Sair da conversa", exact: true })
    .click();
  await host.waitForFunction(
    () => document.querySelectorAll(".group-video").length === 3,
  );
  await host
    .getByRole("button", { name: "Sair da conversa", exact: true })
    .click();
  for (const p of pages.slice(0, 3))
    await p.waitForFunction(() => !document.querySelector(".group-video"));
  for (const p of pages.slice(0, 4))
    if (
      !(await p.evaluate(() =>
        window.__qaTracks.every((t) => t.readyState === "ended"),
      ))
    )
      throw Error("Media not stopped");
  console.log("PASS departure, host end and stopped media tracks");
  if (errors.length) throw Error(errors.join("\n"));
  console.log("PASS no page errors");
} finally {
  await browser.close();
}
