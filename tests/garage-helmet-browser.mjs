// Dev-only synthetic camera: no hardware capture. Chrome + Playwright required.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ headless: true, channel: "chrome" }),
  context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
await context.addInitScript(() => {
  window.__rtcCount = 0;
  const Original = window.RTCPeerConnection;
  window.RTCPeerConnection = class extends Original {
    constructor(...args) {
      super(...args);
      window.__rtcCount++;
    }
  };
});
const host = await context.newPage(),
  errors = [];
host.on("pageerror", (e) => errors.push(e.message));
async function pixel(page, selector) {
  return page.evaluate((sel) => {
    const v = [...document.querySelectorAll(sel)].find((v) => v.videoWidth);
    if (!v) return null;
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 360;
    const x = c.getContext("2d");
    x.drawImage(v, 0, 0, 640, 360);
    return [...x.getImageData(10, 10, 1, 1).data];
  }, selector);
}
async function waitColor(page, selector, protectedMode) {
  for (let i = 0; i < 50; i++) {
    const c = await pixel(page, selector);
    if (
      c &&
      (protectedMode ? c[0] > 200 : c[0] < 100 && c[1] > 65 && c[1] < 135)
    )
      return;
    await page.waitForTimeout(200);
  }
  throw Error("Wrong camera frame");
}
try {
  await host.goto("http://localhost:3000/garagem?testMedia=1");
  await host
    .getByRole("button", {
      name: "Testar câmera e máscara antes de entrar",
      exact: true,
    })
    .click();
  if (await host.locator("video").count())
    throw Error("Preview captured before activation");
  await host
    .getByRole("button", { name: "Ativar prévia privada", exact: true })
    .click();
  await waitColor(host, ".helmet-preview video", true);
  await host.getByRole("button", { name: "Rosto real", exact: true }).click();
  await waitColor(host, ".helmet-preview video", false);
  if ((await host.evaluate(() => window.__rtcCount)) !== 0)
    throw Error("Private preview opened a peer connection");
  await host
    .getByRole("button", { name: "Capacete do avatar", exact: true })
    .click();
  await waitColor(host, ".helmet-preview video", true);
  await host.evaluate(
    () =>
      (window.__previewTracks = document
        .querySelector(".helmet-preview video")
        .srcObject.getTracks()),
  );
  await host.setViewportSize({ width: 390, height: 844 });
  if (
    await host.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw Error("Mobile overflow");
  await host.screenshot({ path: "/tmp/helmet-mobile.png", fullPage: true });
  await host.setViewportSize({ width: 1440, height: 1100 });
  await host.screenshot({
    path: "/tmp/helmet-private-preview.png",
    fullPage: true,
  });
  await host
    .getByRole("button", { name: "Usar esta escolha", exact: true })
    .click();
  if (
    !(await host.evaluate(() =>
      window.__previewTracks.every((t) => t.readyState === "ended"),
    ))
  )
    throw Error("Preview tracks remain active");
  await host
    .getByRole("textbox", { name: "Como podemos chamar você?" })
    .fill("Teste capacete");
  await host
    .getByRole("button", { name: "Entrar na casa", exact: true })
    .click();
  const guest = await context.newPage();
  guest.on("pageerror", (e) => errors.push(e.message));
  await guest.goto("http://localhost:3000/garagem?testMedia=1");
  await guest
    .getByRole("textbox", { name: "Como podemos chamar você?" })
    .fill("Teste receptor");
  await guest
    .getByRole("button", { name: "Entrar na casa", exact: true })
    .click();
  if (
    !(await host.locator("body").innerText()).includes(
      "MÍDIA SINTÉTICA DE TESTE",
    )
  )
    throw Error("Requires dev fixture");
  await host
    .getByRole("button", { name: "Pedir para conversar", exact: true })
    .click();
  await guest
    .getByRole("button", { name: "Aceitar convite", exact: true })
    .click();
  await host
    .getByText("Capacete do avatar selecionado", { exact: true })
    .waitFor();
  await host.getByRole("button", { name: "Ligar câmera", exact: true }).click();
  await waitColor(guest, ".group-video video", true);
  await host
    .getByRole("button", { name: "Mostrar meu rosto", exact: true })
    .click();
  await waitColor(guest, ".group-video video", false);
  await host
    .getByRole("button", { name: "Colocar capacete do avatar", exact: true })
    .click();
  await waitColor(guest, ".group-video video", true);
  await host
    .getByRole("button", { name: "Sair da conversa", exact: true })
    .click();
  await guest.waitForFunction(() => !document.querySelector(".group-video"));
  // Exercise real helmet geometry against a known camera-like frame and measured pose.
  const coverage = await host.evaluate(async () => {
    const { AvatarMaskRenderer } = await import(
      "/src/garage/AvatarMaskRenderer.ts"
    );
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 360;
    const x = c.getContext("2d");
    x.fillStyle = "#315f58";
    x.fillRect(0, 0, 640, 360);
    x.fillStyle = "#ff00ff";
    x.fillRect(265, 105, 110, 140);
    const r = new AvatarMaskRenderer();
    r.draw(x, {
      cx: 320,
      cy: 160,
      faceW: 120,
      faceH: 150,
      roll: 0,
      yaw: 0,
      blinkL: 0,
      blinkR: 0,
      mouthOpen: 0.3,
      forehead: { x: 320, y: 100 },
      chin: { x: 320, y: 250 },
      box: { x: 260, y: 100, w: 120, h: 150 },
    });
    let exposed = 0;
    const data = x.getImageData(270, 110, 100, 130).data;
    for (let i = 0; i < data.length; i += 4)
      if (data[i] > 245 && data[i + 1] < 10 && data[i + 2] > 245) exposed++;
    const background = [...x.getImageData(10, 10, 1, 1).data];
    r.dispose();
    return { exposed, background };
  });
  if (coverage.exposed || coverage.background[0] !== 49)
    throw Error(JSON.stringify(coverage));
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS private preflight, no peer publication, choice retention, live toggles, no-face protection, face coverage and preserved background",
  );
} finally {
  await browser.close();
}
