import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ArrowUpRight } from "lucide-react";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { PlayCorner } from "@/magazine/PlayCorner";
import "./magazine.css";
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  date: string;
  readTime: number;
  image?: string;
  socialImage?: string;
  coverImage?: string;
  relatedSlugs?: string[];
  wordCount?: number;
  lastModified?: string;
  featured?: boolean;
}
export const CATEGORY_NAMES: Record<string, string> = {
  relacionamento: "Afetos & encontros",
  dicas: "A arte de conversar",
  seguranca: "Cuidado & respeito",
  chat: "Conexões online",
  video: "Olho no olho",
  cidades: "Perto de você",
  comparativo: "Guias da casa",
  lifestyle: "Vida & companhia",
  amizade: "Amizade",
};
export function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <article className="mag-card">
      <Link to={`/blog/${post.slug}`} className="mag-card-link">
        <div className="mag-card-art">
          <img
            src={post.coverImage || "/magazine/covers/conversas.svg"}
            alt=""
            loading="lazy"
            width="640"
            height="420"
          />
        </div>
        <span className="mag-kicker">
          {CATEGORY_NAMES[post.category] || "Conversas & descobertas"} ·{" "}
          {post.readTime} MIN
        </span>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <span className="mag-read">
          Ler história <ArrowUpRight size={17} />
        </span>
      </Link>
    </article>
  );
}
export function BlogPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash)
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ block: "start" });
  }, [hash]);
  const [posts, setPosts] = useState<BlogPost[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(false);
    fetch("/magazine/catalog.json", { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setPosts)
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [retry]);
  useEffect(() => {
    const previousTitle = document.title;
    document.title =
      "Revista da Casa — Um bom papo começa aqui | Disque Amizade";
    return () => {
      document.title = previousTitle;
    };
  }, []);
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const filtered = posts.filter(
    (p) =>
      (category === "all" ||
        (category === "guias" ? p.featured : p.category === category)) &&
      normalize([p.title, p.excerpt, ...(p.tags || [])].join(" ")).includes(
        normalize(query),
      ),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 12)),
    shown = filtered.slice((page - 1) * 12, page * 12);
  return (
    <div className="magazine">
      <BlogHeader />
      <main>
        <section className="mag-hero">
          <div className="mag-hero-copy">
            <span className="mag-kicker">REVISTA DA CASA / DISQUE AMIZADE</span>
            <h1>
              Tem sempre
              <br />
              um <em>bom papo</em>
              <br />
              para começar.
            </h1>
            <p>
              Amizade, encontros e a deliciosa bagunça de conhecer alguém.
              Histórias e ideias para sair do “oi, tudo bem?”.
            </p>
            <a className="mag-button" href="#leituras">
              Encontre seu próximo assunto ↓
            </a>
          </div>
          <div className="mag-hero-art">
            <img
              src="/garage/whole-house.webp"
              width={1448}
              height={1086}
              alt="Ilustração da casa Disque Amizade, com pessoas reunidas em diferentes ambientes"
              fetchPriority="high"
            />
            <div className="mag-art-caption">
              <span>A LEITURA É SÓ O COMEÇO</span>
              <Link to="/garagem">
                A conversa continua na casa <ArrowUpRight size={20} />
              </Link>
            </div>
          </div>
        </section>
        <div className="mag-ribbon">
          <span>Histórias para se reconhecer.</span>
          <span>Perguntas para se aproximar.</span>
          <span>Uma casa para se encontrar.</span>
        </div>
        <PlayCorner />
        <section id="leituras" className="mag-reading">
          <div className="mag-section-heading">
            <div>
              <span className="mag-kicker">PUXE UMA CADEIRA</span>
              <h2>Assuntos que aproximam.</h2>
            </div>
            <p>Comece pelos novos guias ou explore o nosso acervo.</p>
          </div>
          <div className="mag-tools">
            <label className="mag-search">
              <Search size={19} />
              <span className="sr-only">Buscar artigos</span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Amizade, cantadas, primeiro encontro…"
                type="search"
              />
            </label>
            <label className="mag-select">
              <span className="sr-only">Filtrar assunto</span>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Todos os assuntos</option>
                <option value="guias">Novos guias da revista</option>
                {Object.entries(CATEGORY_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {loading ? (
            <p role="status">Abrindo a revista…</p>
          ) : error ? (
            <div role="alert">
              <p>Não foi possível abrir os artigos agora.</p>
              <button
                className="mag-button"
                onClick={() => setRetry((n) => n + 1)}
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              <p className="mag-result" role="status">
                {filtered.length} leituras{query ? ` para “${query}”` : ""}
              </p>
              <div className="mag-grid">
                {shown.map((post) => (
                  <ArticleCard key={post.slug} post={post} />
                ))}
              </div>
              {!shown.length && (
                <p>Nenhum artigo por aqui. Experimente outro assunto.</p>
              )}
              <nav className="mag-pagination" aria-label="Páginas de artigos">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((n) => n - 1)}
                >
                  ← Anterior
                </button>
                <span>
                  Página {page} de {pages}
                </span>
                <button
                  disabled={page >= pages}
                  onClick={() => {
                    setPage((n) => n + 1);
                    document
                      .getElementById("leituras")
                      ?.scrollIntoView({ block: "start" });
                  }}
                >
                  Próxima →
                </button>
              </nav>
            </>
          )}
        </section>
        <section className="mag-invite">
          <span className="mag-kicker">DO TEXTO AO ENCONTRO</span>
          <h2>
            Gostou do assunto?
            <br />
            Tem lugar para você na casa.
          </h2>
          <p>
            Escolha seu avatar, conheça os ambientes e comece uma conversa no
            seu ritmo.
          </p>
          <Link className="mag-button" to="/garagem">
            Entrar na casa ↗
          </Link>
          <small>Câmera e microfone começam desligados.</small>
        </section>
        <section className="mag-policy" id="editorial">
          <h2>Uma revista feita para aproximar.</h2>
          <p>
            Os guias da Revista da Casa trazem exemplos e sugestões, sem
            fórmulas para conquistar alguém. Respeito, reciprocidade e liberdade
            para dizer não vêm primeiro. Os textos são informativos e não
            substituem orientação profissional.
          </p>
          <p>
            O acervo reúne publicações anteriores do Disque Amizade. Datas,
            recursos e referências desses textos podem precisar de atualização;
            eles estão identificados nos artigos. Os novos guias têm autoria da
            Redação Revista da Casa, com apoio de IA na produção.{" "}
            <Link to="/sobre">Conheça o Disque Amizade.</Link>
          </p>
        </section>
      </main>
      <footer className="mag-footer">
        <Link to="/">Disque Amizade</Link>
        <span>A casa também é sua.</span>
        <Link to="/blog#editorial">Sobre a revista</Link>
      </footer>
    </div>
  );
}
