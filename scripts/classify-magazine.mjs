const normalize = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
// Explicit subject markers, not body-wide mentions of a competing product.
export function classifyArticle(post) {
  const title = normalize(post.title + " " + post.slug),
    context = normalize(post.excerpt + " " + (post.tags || []).join(" "));
  const rules = [
    ["alternativas-uol", /\buol\b/],
    [
      "adultos",
      /(?:salas?|papo|chat|conversa)[ -]*(?:para[ -]*)?adult[oa]s?|18\+|(?:30|40|50|60)\+|(?:30|40|50|60)[ -]mais/,
    ],
    ["jogos", /jogos?|brincadeiras?|quiz|quebra[ -]gelo|poker|poquer/],
    [
      "paquera",
      /paquera|namoro|namorar|cantadas?|romance|romant|solteir|flert|casais|casal|reciprocidade|convite|convidar.*cafe/,
    ],
    [
      "amizade",
      /amizades?|amigos?|amizade|grupo|socializar|vida[ -]social|companhia/,
    ],
  ];
  const exact = rules.filter(([, r]) => r.test(title));
  const matches = exact.length
    ? exact
    : rules.filter(([, r]) => r.test(context));
  return {
    topic: matches[0]?.[0] || "bate-papo",
    topics: [...new Set(["bate-papo", ...matches.map(([id]) => id)])],
    classification: exact.length
      ? "title"
      : matches.length
        ? "context"
        : "general",
    needsEditorialReview: matches.length > 1 || !exact.length,
  };
}
