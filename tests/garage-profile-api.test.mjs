import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
test("legacy profile endpoint cannot award VIP status or money", async () => {
  const source = await readFile(
    new URL("../api/update-profile.ts", import.meta.url),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  let written;
  const chain = {
    update(data) {
      written = data;
      return this;
    },
    upsert(data) {
      written = data;
      return this;
    },
    eq() {
      return this;
    },
    select() {
      return this;
    },
    async single() {
      return { data: written, error: null };
    },
  };
  const exports = {};
  runInNewContext(code, {
    exports,
    process: { env: {} },
    require: () => ({
      createClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: "test-user" } } }),
        },
        from: () => chain,
      }),
    }),
  });
  const res = {
    status() {
      return this;
    },
    json(data) {
      return data;
    },
  };
  for (const mode of ["update", "upsert"]) {
    await exports.default(
      {
        method: "POST",
        headers: { authorization: "Bearer synthetic-test" },
        body: {
          _mode: mode,
          username: "Ana",
          is_vip: true,
          is_elite: true,
          saldo_fichas: 999999,
          total_earned: 999999,
          is_admin: true,
        },
      },
      res,
    );
    assert.equal(written.username, "Ana");
    for (const key of [
      "is_vip",
      "is_elite",
      "saldo_fichas",
      "total_earned",
      "is_admin",
    ])
      assert.equal(key in written, false);
  }
});
