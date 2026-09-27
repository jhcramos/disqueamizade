import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyArticle } from "../scripts/classify-magazine.mjs";
const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const topics = read("../content/seo-topics.json"),
  posts = read("../public/magazine/catalog.json");
test("all articles and curated guides belong to valid topic routes", () => {
  const ids = new Set(topics.map((t) => t.id)),
    slugs = new Set(posts.map((p) => p.slug));
  assert.equal(ids.size, 6);
  assert.equal(slugs.size, 582);
  for (const p of posts) {
    assert(ids.has(p.topic));
    assert(p.topics.every((t) => ids.has(t)));
  }
  for (const t of topics)
    for (const slug of t.guideSlugs) assert(slugs.has(slug));
});
test("subject classification distinguishes friendship, adult chat, games and comparisons", () => {
  for (const [title, expected] of [
    ["Amizade na vida adulta", "amizade"],
    ["Salas adultas", "adultos"],
    ["Bate-papo tipo UOL", "alternativas-uol"],
    ["Jogos para quebrar o gelo", "jogos"],
    ["Cantadas engraçadas", "paquera"],
  ])
    assert.equal(
      classifyArticle({ title, slug: "", tags: [] }).topic,
      expected,
    );
  assert.equal(
    classifyArticle({
      title: "Fazer amigos",
      slug: "amigos",
      content: "UOL salas adultas",
    }).topic,
    "amizade",
  );
});
test("built topics expose crawlable content, canonical URLs and sitemap entries", () => {
  const sitemap = readFileSync(
    new URL("../dist/sitemap.xml", import.meta.url),
    "utf8",
  );
  for (const t of topics) {
    const html = readFileSync(
      new URL(`../dist/blog/temas/${t.id}/index.html`, import.meta.url),
      "utf8",
    );
    assert(html.includes(`<h1>${t.title}</h1>`));
    assert(
      html.includes(`href="https://disqueamizade.com.br/blog/temas/${t.id}"`),
    );
    assert(sitemap.includes(`/blog/temas/${t.id}</loc>`));
    assert(html.includes("/blog/" + t.guideSlugs[0]));
  }
});
