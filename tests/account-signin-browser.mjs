const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const b = await chromium.launch({ channel: "chrome", headless: true });
try {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const requests = [];
  await p.route("**/auth/v1/otp**", async (route) => {
    requests.push(JSON.parse(route.request().postData()));
    await route.fulfill({ status: 200, json: {} });
  });
  await p.goto(process.env.CHECK_URL || "http://localhost:3001/minha-conta");
  await p.getByRole("heading", { name: "Seu avatar. Sua turma." }).waitFor();
  await p.screenshot({ path: "/tmp/account-signin-desktop.png" });
  await p.getByRole("button", { name: "Já tenho conta", exact: true }).click();
  await p.getByRole("textbox", { name: "Seu e-mail" }).fill("test@example.com");
  await p
    .getByRole("button", { name: "Receber link para entrar", exact: true })
    .click();
  await p.getByRole("heading", { name: "Confira seu e-mail." }).waitFor();
  if (requests[0].create_user !== false) throw Error("Login creates user");
  if (!(await p.getByRole("button", { name: /Reenviar em/ }).isDisabled()))
    throw Error("No cooldown");
  await p.setViewportSize({ width: 390, height: 844 });
  await p.screenshot({ path: "/tmp/account-signin-mobile.png" });
  if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw Error("Overflow");
  await p.reload();
  await p.getByRole("textbox", { name: "Seu e-mail" }).fill("test@example.com");
  await p
    .getByRole("button", { name: "Criar conta gratuita", exact: true })
    .click();
  await p.getByRole("heading", { name: "Confira seu e-mail." }).waitFor();
  if (requests[1].create_user !== true) throw Error("Signup flag");
  console.log(
    "PASS login/signup separation, email next step, cooldown, mobile; intercepted auth, no email sent",
  );
} finally {
  await b.close();
}
