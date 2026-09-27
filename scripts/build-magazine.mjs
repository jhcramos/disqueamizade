import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { classifyArticle } from "./classify-magazine.mjs";
import sharp from "sharp";
import { cleanArticle } from "./magazine-content.mjs";
const root = resolve(import.meta.dirname, "..");
const source = JSON.parse(
  readFileSync(resolve(root, "public/blog-posts/index.json"), "utf8"),
);
const guidesPath = resolve(root, "content/magazine-guides.json");
const guides = existsSync(guidesPath)
  ? JSON.parse(readFileSync(guidesPath, "utf8"))
  : [];
const merged = new Map(source.map((p) => [p.slug, p]));
for (const guide of guides) merged.set(guide.slug, guide);
const slugs = new Set(merged.keys());
const dir = resolve(root, "public/magazine");
mkdirSync(dir, { recursive: true });
const coverNames = [
  "relacionamento",
  "dicas",
  "seguranca",
  "cidades",
  "video",
  "chat",
  "conversas",
];
await Promise.all(
  coverNames.map((name) =>
    sharp(resolve(dir, "covers", `${name}.svg`))
      .resize(1200, 630, { fit: "contain", background: "#faf6ed" })
      .png()
      .toFile(resolve(dir, "covers", `${name}.png`)),
  ),
);
const catalog = [];
for (const post of merged.values()) {
  if (!/^[\p{L}\p{N}_-]+$/u.test(post.slug))
    throw new Error("Invalid article slug");
  const content = cleanArticle(post.content, slugs);
  const coverImage = `/magazine/covers/${["relacionamento", "dicas", "seguranca", "cidades", "video", "chat"].includes(post.category) ? post.category : "conversas"}.svg`;
  const wordCount = content
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const clean = {
    ...post,
    ...classifyArticle(post),
    content,
    coverImage,
    image: coverImage,
    socialImage: coverImage.replace(/\.svg$/, ".png"),
    wordCount,
    readTime: Math.max(2, Math.ceil(wordCount / 200)),
    featured: !!post.featured,
    relatedSlugs: (post.relatedSlugs || []).filter(
      (s) => slugs.has(s) && s !== post.slug,
    ),
  };
  writeFileSync(
    resolve(dir, `${post.slug}.json`),
    JSON.stringify(clean) + "\n",
  );
  const { content: _, ...meta } = clean;
  catalog.push(meta);
}
catalog.sort(
  (a, b) =>
    Number(b.featured) - Number(a.featured) || b.date.localeCompare(a.date),
);
writeFileSync(resolve(dir, "catalog.json"), JSON.stringify(catalog) + "\n");
// Keep the canonical archive and SEO generator aligned with the ten new guides.
if (guides.length)
  writeFileSync(
    resolve(root, "public/blog-posts/index.json"),
    JSON.stringify([...merged.values()], null, 2) + "\n",
  );
console.log(
  `[magazine] ${catalog.length} articles; ${guides.length} new editorial guides`,
);
