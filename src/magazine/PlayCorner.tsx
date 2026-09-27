import { useState } from "react";
import { Link } from "react-router-dom";
import { PICKUP_LINES, QUESTIONS } from "./prompts";
export function PlayCorner() {
  const [line, setLine] = useState(0),
    [reaction, setReaction] = useState(""),
    [category, setCategory] = useState("Leves"),
    [question, setQuestion] = useState(0);
  const cards = QUESTIONS.filter((q) => q.category === category),
    card = cards[question % cards.length];
  const pickup = PICKUP_LINES[line % PICKUP_LINES.length];
  return (
    <section id="brincar" className="mag-play">
      <div className="mag-section-heading">
        <div>
          <span className="mag-kicker">MENOS ROTEIRO, MAIS ENCONTRO</span>
          <h2>Vamos quebrar o gelo?</h2>
        </div>
        <p>
          Uma brincadeira para começar. Você escolhe se quer levar o papo
          adiante.
        </p>
      </div>
      <div className="mag-play-grid">
        <article className="mag-game mag-game-pink">
          <span className="mag-kicker">01 / HUMOR COM RESPEITO</span>
          <h3>Cantada ou cilada?</h3>
          <blockquote aria-live="polite">“{pickup.text}”</blockquote>
          <div className="mag-reactions" aria-label="Sua reação à cantada">
            {["Eu responderia", "Ri de vergonha", "Passo"].map((r) => (
              <button
                key={r}
                aria-pressed={reaction === r}
                onClick={() => setReaction(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="mag-game-feedback" role="status">
            {reaction
              ? pickup.note
              : "Não existe resposta certa. Sua reação fica só nesta brincadeira."}
          </p>
          <button
            className="mag-text-button"
            onClick={() => {
              setLine((n) => n + 1);
              setReaction("");
            }}
          >
            Outra cantada <span aria-hidden="true">→</span>
          </button>
        </article>
        <article className="mag-game mag-game-green">
          <span className="mag-kicker">02 / BARALHO DE CONVERSAS</span>
          <h3>Um assunto puxa outro.</h3>
          <div className="mag-reactions" aria-label="Tipo de pergunta">
            {["Leves", "Divertidas", "Mais profundas"].map((c) => (
              <button
                key={c}
                aria-pressed={category === c}
                onClick={() => {
                  setCategory(c);
                  setQuestion(0);
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <blockquote aria-live="polite">{card.text}</blockquote>
          <p>
            Vale responder, ouvir ou passar. Intimidade não é uma competição.
          </p>
          <div className="mag-game-actions">
            <button
              className="mag-text-button"
              onClick={() => setQuestion((n) => n + 1)}
            >
              Outra pergunta →
            </button>
            <Link className="mag-button" to={`/garagem?assunto=${card.id}`}>
              Levar para a casa ↗
            </Link>
          </div>
          <small>Você revisa a pergunta antes de enviar no chat.</small>
        </article>
      </div>
    </section>
  );
}
