import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import topics from "../../../content/seo-topics.json";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { ArticleCard, type BlogPost } from "./BlogPage";
import { usePageSeo } from "@/magazine/usePageSeo";
import "./magazine.css";
export function TopicPage() {
  const { topic: topicId } = useParams();
  const topic = topics.find((t) => t.id === topicId);
  const [posts, setPosts] = useState<BlogPost[]>([]),
    [status, setStatus] = useState("loading"),
    [page, setPage] = useState(1);
  usePageSeo(
    topic
      ? `${topic.title} | Disque Amizade`
      : "Assunto não encontrado | Revista da Casa",
    topic?.description || "Explore os assuntos da Revista da Casa.",
    `/blog/temas/${topicId}`,
  );
  useEffect(() => {
    const abort = new AbortController();
    setStatus("loading");
    fetch("/magazine/catalog.json", { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((p) => {
        setPosts(p);
        setStatus("ready");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setStatus("error");
      });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    setPage(1);
    window.scrollTo(0, 0);
  }, [topicId]);
  const selected = topic
    ? posts
        .filter(
          (p) => p.topic === topic.id || topic.guideSlugs.includes(p.slug),
        )
        .sort(
          (a, b) =>
            Number(topic.guideSlugs.includes(b.slug)) -
            Number(topic.guideSlugs.includes(a.slug)),
        )
    : [];
  return (
    <div className="magazine">
      <BlogHeader />
      <main className="mag-topic">
        <nav aria-label="Caminho da página">
          <Link to="/blog">Revista da Casa</Link> /{" "}
          <span>{topic?.label || "Assunto não encontrado"}</span>
        </nav>
        {topic ? (
          <>
            <header>
              <span className="mag-kicker">
                ENCONTRE SEU JEITO DE CONVERSAR
              </span>
              <h1>{topic.title}</h1>
              <p>{topic.intro}</p>
              <Link className="mag-button" to={topic.href}>
                {topic.cta} ↗
              </Link>
            </header>
            <div className="mag-topic-intro">
              {topic.sections.map((s) => (
                <section key={s.title}>
                  <h2>{s.title}</h2>
                  <p>{s.text}</p>
                </section>
              ))}
            </div>
            <p className="mag-topic-rules">
              <Link to="/diretrizes">Regras de convivência</Link> ·{" "}
              <Link to="/privacidade">Privacidade</Link> · Câmera e microfone
              começam desligados.
            </p>
            <section id="leituras-tema">
              <h2>Leituras para continuar.</h2>
              {status === "loading" ? (
                <p role="status">Abrindo as leituras…</p>
              ) : status === "error" ? (
                <p role="alert">
                  Não conseguimos carregar os artigos.{" "}
                  <Link to="/blog">Voltar para a revista.</Link>
                </p>
              ) : (
                <>
                  <div className="mag-grid">
                    {selected.slice((page - 1) * 12, page * 12).map((p) => (
                      <ArticleCard post={p} key={p.slug} />
                    ))}
                  </div>
                  {selected.length > 12 && (
                    <nav
                      className="mag-pagination"
                      aria-label="Páginas deste assunto"
                    >
                      <button
                        disabled={page === 1}
                        onClick={() => {
                          setPage((p) => p - 1);
                          document
                            .getElementById("leituras-tema")
                            ?.scrollIntoView();
                        }}
                      >
                        ← Anterior
                      </button>
                      <span>
                        {page} / {Math.ceil(selected.length / 12)}
                      </span>
                      <button
                        disabled={page * 12 >= selected.length}
                        onClick={() => {
                          setPage((p) => p + 1);
                          document
                            .getElementById("leituras-tema")
                            ?.scrollIntoView();
                        }}
                      >
                        Próxima →
                      </button>
                    </nav>
                  )}
                </>
              )}
            </section>
            <nav className="mag-topic-links" aria-label="Outros assuntos">
              {topics
                .filter((t) => t.id !== topic.id)
                .map((t) => (
                  <Link key={t.id} to={`/blog/temas/${t.id}`}>
                    {t.label} ↗
                  </Link>
                ))}
            </nav>
          </>
        ) : (
          <>
            <h1>Não encontramos esse assunto.</h1>
            <Link to="/blog">Explorar a revista</Link>
          </>
        )}
      </main>
    </div>
  );
}
