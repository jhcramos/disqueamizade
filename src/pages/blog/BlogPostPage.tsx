import topics from "../../../content/seo-topics.json";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { ArticleCard, CATEGORY_NAMES, type BlogPost } from "./BlogPage";
import "./magazine.css";
export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null),
    [related, setRelated] = useState<BlogPost[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [copied, setCopied] = useState("");
  useEffect(() => {
    const c = new AbortController();
    setPost(null);
    setRelated([]);
    setLoading(true);
    setError(false);
    setCopied("");
    Promise.all([
      fetch(`/magazine/${encodeURIComponent(slug || "")}.json`, {
        signal: c.signal,
      }).then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      }),
      fetch("/magazine/catalog.json", { signal: c.signal }).then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      }),
    ])
      .then(([p, all]: [BlogPost, BlogPost[]]) => {
        setPost(p);
        const candidates = all.filter((x) => x.slug !== p.slug);
        candidates.sort(
          (a, b) =>
            Number(!!p.relatedSlugs?.includes(b.slug)) -
              Number(!!p.relatedSlugs?.includes(a.slug)) ||
            Number(b.category === p.category) -
              Number(a.category === p.category) ||
            Number(b.featured) - Number(a.featured),
        );
        setRelated(candidates.slice(0, 3));
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    window.scrollTo(0, 0);
    return () => c.abort();
  }, [slug]);
  useEffect(() => {
    if (!post) return;
    const previousTitle = document.title;
    document.title = `${post.title} | Revista da Casa`;
    const updates: [string, string, string][] = [
      ['meta[name="description"]', "content", post.excerpt],
      ['meta[property="og:title"]', "content", post.title],
      ['meta[property="og:description"]', "content", post.excerpt],
      [
        'meta[property="og:url"]',
        "content",
        `https://disqueamizade.com.br/blog/${post.slug}`,
      ],
      [
        'meta[property="og:image"]',
        "content",
        `https://disqueamizade.com.br${post.socialImage || post.coverImage}`,
      ],
      [
        'link[rel="canonical"]',
        "href",
        `https://disqueamizade.com.br/blog/${post.slug}`,
      ],
    ];
    const undo = updates.map(([selector, attribute, value]) => {
      let element = document.head.querySelector(selector);
      let created = false;
      if (!element) {
        created = true;
        element = document.createElement(
          selector.startsWith("link") ? "link" : "meta",
        );
        const match = selector.match(/\[(\w+)="([^"]+)"\]/);
        if (match) element.setAttribute(match[1], match[2]);
        document.head.append(element);
      }
      const old = element.getAttribute(attribute);
      element.setAttribute(attribute, value);
      return () => {
        if (created) element.remove();
        else if (old === null) element.removeAttribute(attribute);
        else element.setAttribute(attribute, old);
      };
    });
    return () => {
      undo.forEach((f) => f());
      document.title = previousTitle;
    };
  }, [post]);
  const headings = post
    ? [...post.content.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(
        (m) => ({ id: m[1], text: m[2].replace(/<[^>]+>/g, "") }),
      )
    : [];
  return (
    <div className="magazine">
      <BlogHeader />
      <main className="mag-post-page">
        <Link to="/blog" className="mag-back">
          ← Voltar para a revista
        </Link>
        {loading ? (
          <p role="status">Abrindo a leitura…</p>
        ) : error || !post ? (
          <section className="mag-invite">
            <h1>Esta leitura não abriu.</h1>
            <p>O endereço pode ter mudado ou a conexão falhou.</p>
            <Link className="mag-button" to="/blog">
              Explorar a revista
            </Link>
          </section>
        ) : (
          <>
            <header className="mag-post-heading">
              <span className="mag-kicker"><Link to={`/blog/temas/${post.topic || 'bate-papo'}`}>{topics.find(t=>t.id===post.topic)?.label || CATEGORY_NAMES[post.category] || 'Conversas & descobertas'}</Link></span>
              <h1>{post.title}</h1>
              <p className="mag-deck">{post.excerpt}</p>
              <div className="mag-byline">
                <span>{post.author}</span>
                <span>
                  {new Date(post.date + "T12:00:00").toLocaleDateString(
                    "pt-BR",
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                </span>
                <span>{post.readTime} min de leitura</span>
              </div>
            </header>
            <div className="mag-article-layout">
              <aside className="mag-contents">
                <details open>
                  <summary>Nesta leitura</summary>
                  <nav aria-label="Índice do artigo">
                    {headings.map((h) => (
                      <a key={h.id} href={`#${h.id}`}>
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </details>
                <Link className="mag-button" to="/garagem">
                  Conhecer a casa ↗
                </Link>
              </aside>
              <div>
                <img
                  className="mag-post-cover"
                  src={post.coverImage}
                  alt={`Ilustração editorial: ${CATEGORY_NAMES[post.category] || "conversas e conexões"}`}
                  width="640"
                  height="420"
                />
                {!post.featured && (
                  <p className="mag-archive-note">
                    Do acervo do Disque Amizade. Este texto preserva a
                    publicação anterior; informações sobre recursos e serviços
                    podem estar desatualizadas.
                  </p>
                )}
                <article
                  className="mag-prose"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
                <div className="mag-share">
                  <button
                    className="mag-text-button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `https://disqueamizade.com.br/blog/${post.slug}`,
                        );
                        setCopied("Link copiado.");
                      } catch {
                        setCopied("Copie o endereço pela barra do navegador.");
                      }
                    }}
                  >
                    Copiar link da leitura ↗
                  </button>
                  <span role="status">{copied}</span>
                </div>
                <section className="mag-article-cta">
                  <span className="mag-kicker">
                    EXPERIMENTE NA VIDA DA CASA
                  </span>
                  <h2>Uma conversa pode começar aqui.</h2>
                  <p>
                    Escolha um assunto no baralho ou entre na casa para conhecer
                    gente no seu ritmo.
                  </p>
                  <div className="mag-game-actions">
                    <Link className="mag-button" to="/garagem">
                      Entrar na casa ↗
                    </Link>
                    <Link to="/blog#brincar">Escolher uma pergunta →</Link>
                  </div>
                  <small>Câmera e microfone começam desligados.</small>
                </section>
              </div>
            </div>
            <section className="mag-related">
              <div className="mag-section-heading">
                <h2>O papo continua.</h2>
                <Link to="/blog#leituras">Todas as leituras →</Link>
              </div>
              <div className="mag-grid">
                {related.map((p) => (
                  <ArticleCard key={p.slug} post={p} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <footer className="mag-footer">
        <Link to="/blog">Revista da Casa</Link>
        <Link to="/blog#editorial">Nossa proposta editorial</Link>
        <Link to="/garagem">Entrar na casa ↗</Link>
      </footer>
    </div>
  );
}
