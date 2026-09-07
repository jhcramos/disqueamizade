import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const b = await chromium.launch({ headless: true, channel: "chrome" });
const id = "00000000-0000-4000-8000-000000000001",
  peer = "00000000-0000-4000-8000-000000000002";
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:3000/");
  await p
    .getByRole("link", { name: "Entrar sem cadastro", exact: true })
    .click();
  await p
    .getByRole("textbox", { name: "Como podemos chamar você?" })
    .fill("Ana");
  await p
    .getByRole("button", { name: "Entrar na garagem", exact: true })
    .click();
  await p.getByRole("button", { name: "Perfil e amigos" }).click();
  await p
    .getByRole("heading", { name: "Leve essa amizade com você." })
    .waitFor();
  await p.getByRole("button", { name: "Fechar perfil" }).click();
  let profile = null,
    avatar = null,
    friends = [],
    blocks = [],
    failSave = false;
  const other = {
    id: peer,
    handle: "bruno",
    display_name: "Bruno",
    bio: "Música e cinema",
    interests: [],
    accepts_requests: true,
  };
  await p.route("https://placeholder.supabase.co/rest/v1/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      table = url.pathname.split("/").pop(),
      method = req.method();
    let result = [];
    if (method === "OPTIONS") {
      await route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "*",
        },
      });
      return;
    }
    if (table === "garage_profiles") {
      if (method === "POST") {
        if (failSave) {
          await route.fulfill({
            status: 500,
            json: { message: "test failure" },
          });
          return;
        }
        profile = JSON.parse(req.postData());
      } else if (url.searchParams.has("handle")) result = other;
      else if (url.searchParams.get("id")?.startsWith("in.")) result = [other];
      else result = profile;
    } else if (table === "garage_avatars") {
      if (method === "POST") avatar = JSON.parse(req.postData());
      else result = avatar;
    } else if (table === "garage_friendships") {
      if (method === "POST") {
        const value = JSON.parse(req.postData());
        friends = [{ id: "request-1", ...value, status: "pending" }];
      } else if (method === "PATCH") {
        friends = friends.map((f) => ({ ...f, status: "accepted" }));
        result = [{ id: "request-1" }];
      } else if (method === "DELETE") friends = [];
      else result = friends;
    } else if (table === "garage_blocks") {
      if (method === "POST") {
        blocks = [{ target: peer }];
        friends = [];
      } else if (method === "DELETE") blocks = [];
      else result = blocks;
    }
    await route.fulfill({
      status: 200,
      json: result,
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await p.evaluate(async (uid) => {
    const { useAuthStore } = await import("/src/store/authStore.ts");
    useAuthStore.setState({
      user: { id: uid, is_anonymous: false },
      initialized: true,
      isGuest: false,
    });
  }, id);
  await p.getByRole("button", { name: "Perfil e amigos" }).click();
  await p.getByRole("heading", { name: "Meu perfil e amigos" }).waitFor();
  await p.getByRole("textbox", { name: "Apelido", exact: true }).fill("Ana");
  await p.getByRole("textbox", { name: "Seu @identificador" }).fill("ana");
  await p.getByRole("button", { name: "Salvar perfil e avatar" }).click();
  await p
    .getByRole("status")
    .filter({ hasText: "Perfil e avatar salvos" })
    .waitFor();
  assert.equal(profile.handle, "ana");
  assert.equal(avatar.user_id, id);
  await p
    .getByRole("textbox", { name: "Buscar pelo @identificador" })
    .fill("@bruno");
  await p.getByRole("button", { name: "Buscar", exact: true }).click();
  await p.getByRole("button", { name: "Adicionar", exact: true }).click();
  await p.getByText("Aguardando aceite", { exact: false }).waitFor();
  await p.getByRole("button", { name: "Cancelar pedido" }).click();
  await p.getByText("Ainda não há pedidos", { exact: false }).waitFor();
  friends = [
    { id: "request-1", requester: peer, recipient: id, status: "pending" },
  ];
  await p.getByRole("button", { name: "Fechar perfil" }).click();
  await p.getByRole("button", { name: "Perfil e amigos" }).click();
  await p.getByRole("button", { name: "Aceitar", exact: true }).click();
  assert.equal(friends[0].status, "accepted");
  await p.getByRole("button", { name: "Bloquear", exact: true }).click();
  await p.getByText("Perfis bloqueados (1)").waitFor();
  assert.equal(friends.length, 0);
  await p.getByText("Perfis bloqueados (1)").click();
  await p.getByRole("button", { name: "Desbloquear", exact: true }).click();
  assert.equal(blocks.length, 0);
  failSave = true;
  await p.getByRole("button", { name: "Salvar perfil e avatar" }).click();
  await p.getByRole("alert").waitFor();
  assert.equal(
    await p
      .getByRole("status")
      .filter({ hasText: "Perfil e avatar salvos" })
      .count(),
    0,
  );
  await p.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await p.getByRole("button", { name: "Fechar perfil" }).click();
  await p.locator(".garage-scene").waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS social UI using mocked transport: visitor gate, save, request, accept, cancel, block, unblock, failure feedback, mobile and preserved room",
  );
} finally {
  await b.close();
}
