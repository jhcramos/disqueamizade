import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { cleanArticle } from "../scripts/magazine-content.mjs";
const catalog = JSON.parse(
  readFileSync(new URL("../public/magazine/catalog.json", import.meta.url)),
);
const slugs = new Set(catalog.map((p) => p.slug));
test("recovered archive and ten guides have unique canonical routes and real covers", () => {
  assert.equal(catalog.length, 582);
  assert.equal(slugs.size, 582);
  assert.equal(catalog.filter((p) => p.featured).length, 10);
  const report = JSON.parse(
    readFileSync(
      new URL("../docs/blog-recovery-2026-09-27.json", import.meta.url),
    ),
  );
  for (const slug of report.recovered) assert(slugs.has(slug));
  for (const p of catalog) {
    assert(existsSync(new URL("../public" + p.coverImage, import.meta.url)));
    assert(!("content" in p));
    assert(existsSync(new URL("../public" + p.socialImage, import.meta.url)));
    assert(p.socialImage.endsWith(".png"));
  }
});
test("legacy HTML cannot insert executable markup, app styles or unsafe links", () => {
  const result = cleanArticle(
    '<html><head><style>body{display:none}</style></head><body><header>old menu</header><h1>duplicate</h1><h2 id="x" onclick="alert(1)">Hello</h2><h2 id="x">Again</h2><script>alert(1)</script><iframe src="https://example.com"></iframe><p style="position:fixed">Text<img src="x" onerror="alert(1)"></p><a href="javascript:alert(1)">bad</a><a href="/blog-posts/known.html">read</a><a href="https://disqueamizade.vercel.app/rooms/1">house</a><a href="/blog/missing">missing</a></body></html>',
    new Set(["known"]),
  );
  assert(!/<(script|style|iframe|img|header|h1)[\s>]/.test(result));
  assert(!/onclick|onerror|javascript:|position:fixed/.test(result));
  assert.match(result, /id="secao-1"/);
  assert.match(result, /id="secao-2"/);
  assert.match(result, /href="\/blog\/known"/);
  assert.match(result, /href="\/garagem"/);
  assert.match(result, /href="\/blog"/);
});
test("all generated bodies have working internal article links and substantive new guides", () => {
  for (const p of catalog) {
    const body = JSON.parse(
      readFileSync(
        new URL(`../public/magazine/${p.slug}.json`, import.meta.url),
      ),
    ).content;
    assert(body.length > 200, p.slug);
    assert(!/<(script|style|iframe)[\s>]/.test(body), p.slug);
    for (const m of body.matchAll(/href="\/blog\/([^"#?]+)"/g))
      assert(slugs.has(decodeURIComponent(m[1])), m[1]);
    if (p.featured) assert(p.wordCount >= 450, p.slug);
  }
});

test("extensionless legacy article links stay articles", () => {
  assert.match(
    cleanArticle('<a href="/blog-posts/known">read</a>', new Set(["known"])),
    /href="\/blog\/known"/,
  );
});
