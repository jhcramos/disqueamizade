import sanitizeHtml from "sanitize-html";
export function cleanArticle(source, slugs = new Set()) {
  let content = String(source || "").replace(/<!--[\s\S]*?-->/g, "");
  const body = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (body) content = body[1];
  content = content
    .replace(
      /<(header|footer|nav|aside|form|script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, "");
  let heading = 0;
  return sanitizeHtml(content, {
    allowedTags: [
      "p",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "b",
      "i",
      "blockquote",
      "a",
      "br",
      "hr",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      a: ["href", "rel"],
      h2: ["id"],
      h3: ["id"],
      th: ["scope"],
    },
    allowedSchemes: ["https", "http"],
    transformTags: {
      h2: () => ({ tagName: "h2", attribs: { id: `secao-${++heading}` } }),
      h3: () => ({ tagName: "h3", attribs: { id: `secao-${++heading}` } }),
      a: (tagName, attrs) => {
        let href = attrs.href || "";
        try {
          const u = new URL(href, "https://disqueamizade.com.br");
          if (
            [
              "disqueamizade.com.br",
              "www.disqueamizade.com.br",
              "disqueamizade.vercel.app",
            ].includes(u.hostname)
          ) {
            href = u.pathname.replace(
              /^\/blog-posts\/([^/]+?)(?:\.(?:html|json|md))?$/,
              "/blog/$1",
            );
            if (/^\/(rooms|chat|salas|register|signup|login)(\/|$)/.test(href))
              href = "/garagem";
            if (
              href.startsWith("/blog/") &&
              !slugs.has(decodeURIComponent(href.slice(6)))
            )
              href = "/blog";
            if (
              !["/", "/blog", "/garagem", "/termos", "/privacidade"].includes(
                href,
              ) &&
              !href.startsWith("/blog/")
            )
              href = "/garagem";
          } else if (!["https:", "http:"].includes(u.protocol)) href = "";
        } catch {
          href = "";
        }
        return {
          tagName,
          attribs: href ? { href, rel: "noopener noreferrer" } : {},
        };
      },
    },
  });
}
