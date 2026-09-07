// Vite dev server + synthetic media only; no hardware camera is requested.
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
  for (const name of ["Teste máscara", "Teste receptor"]) {
    const p = await context.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://localhost:3000/garagem?testMedia=1");
    await p
      .getByRole("textbox", { name: "Como podemos chamar você?" })
      .fill(name);
    await p
      .getByRole("button", { name: "Entrar na garagem", exact: true })
      .click();
    if (
      !(await p.locator("body").innerText()).includes(
        "MÍDIA SINTÉTICA DE TESTE",
      )
    )
      throw Error("Requires synthetic dev fixture");
    pages.push(p);
  }
  const [sender, receiver] = pages;
  await sender
    .getByRole("button", { name: "Pedir para conversar", exact: true })
    .click();
  await receiver
    .getByRole("button", { name: "Aceitar convite", exact: true })
    .click();
  await sender
    .getByRole("checkbox", { name: "Usar meu avatar na câmera" })
    .check();
  await sender
    .getByRole("button", { name: "Ligar câmera", exact: true })
    .click();
  await sender
    .getByRole("button", { name: "Desligar câmera", exact: true })
    .waitFor({ timeout: 45000 });
  await receiver.waitForFunction(
    () =>
      [...document.querySelectorAll(".group-video video")].some(
        (v) => v.videoWidth === 640,
      ),
    {},
    { timeout: 20000 },
  );
  const pixel = await receiver.evaluate(() => {
    const video = [...document.querySelectorAll(".group-video video")].find(
      (v) => v.videoWidth === 640,
    );
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    return [...ctx.getImageData(10, 10, 1, 1).data];
  });
  if (Math.abs(pixel[0] - 237) > 25 || Math.abs(pixel[1] - 224) > 25)
    throw Error(`Raw camera may be exposed: ${pixel}`);
  if (
    !(await sender
      .getByRole("checkbox", { name: "Usar meu avatar na câmera" })
      .isDisabled())
  )
    throw Error("Mode changed during publication");
  await sender
    .getByRole("button", { name: "Desligar câmera", exact: true })
    .click();
  await sender
    .getByRole("checkbox", { name: "Usar meu avatar na câmera" })
    .uncheck();
  await sender
    .getByRole("button", { name: "Sair da conversa", exact: true })
    .click();
  await receiver.waitForFunction(() => !document.querySelector(".group-video"));
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS avatar camera publication stays opaque without a face; controls and remote teardown",
  );
} finally {
  await browser.close();
}
