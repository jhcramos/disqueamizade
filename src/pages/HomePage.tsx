import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  MoveUpRight,
  Check,
  MessageCircle,
  CameraOff,
  ChevronRight,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import "./house-home.css";
const rooms = [
  {
    id: "garage",
    name: "Garagem",
    tag: "O primeiro oi tem trilha sonora.",
    label: "Música & encontros",
    speech: "Quem escolhe o próximo disco?",
    other: "Eu tenho uma boa! 🎶",
  },
  {
    id: "living",
    name: "Sala de estar",
    tag: "Puxa uma cadeira. O papo rende.",
    label: "Conversa sem pressa",
    speech: "Qual filme você veria de novo?",
    other: "Tenho uma lista inteira.",
  },
  {
    id: "bar",
    name: "Bar Vinyl",
    tag: "Uma mesa. Quatro bons assuntos.",
    label: "Encontros à mesa · 18+",
    speech: "Tem lugar nessa mesa?",
    other: "Chega mais!",
  },
];
export function HomePage() {
  const [roomIndex, setRoom] = useState(0),
    [look, setLook] = useState("caio");
  const room = rooms[roomIndex];
  useEffect(() => {
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    const elements = document.querySelectorAll(
      ".house-places, .house-identity, .house-masks, .house-connect, .house-journal",
    );
    elements.forEach((el) => {
      el.classList.add("will-reveal");
      observer.observe(el);
    });
    return () => {
      observer.disconnect();
      elements.forEach((el) => el.classList.remove("will-reveal"));
    };
  }, []);
  return (
    <main className="house-home">
      <header className="house-nav">
        <Link to="/" aria-label="Disque Amizade início">
          <BrandLogo />
        </Link>
        <nav aria-label="Navegação principal">
          <a href="#a-casa">A casa</a>
          <a href="#seu-jeito">Avatares</a>
          <Link to="/blog">Blog</Link>
        </nav>
        <Link className="house-account" to="/minha-conta">
          Meu perfil <ArrowUpRight size={16} />
        </Link>
      </header>
      <section className="house-hero">
        <div className="house-hero-copy">
          <p className="house-eyebrow">
            <span /> Seu avatar. Sua turma. Seu lugar.
          </p>
          <h1>
            Seu próximo encontro <br />
            começa com um <em>oi.</em>
          </h1>
          <p className="house-lead">
            Uma casa virtual para chegar do seu jeito, explorar novos ambientes
            e descobrir boas companhias.
          </p>
          <Link className="house-cta" to="/garagem">
            Quero conhecer a casa <ArrowUpRight size={22} />
          </Link>
          <div className="house-promises">
            <span>
              <Check size={14} />
              Sem cadastro para explorar
            </span>
            <span>
              <CameraOff size={14} />
              Câmera opcional
            </span>
          </div>
          <p className="house-beta">
            Prévia explorável · encontros online em preparação
          </p>
        </div>
        <div className="house-product-orbit">
          <div className="house-orbit-avatar">
            <span>100% seu jeito</span>
            <img src="/garage/home-lia.png" alt="" />
            <strong>
              Seu primeiro oi
              <br />
              já tem personalidade.
            </strong>
          </div>
          <div className="house-orbit-chat" aria-hidden="true">
            <MessageCircle size={20} />
            <span>Oi, pessoal! 👋</span>
            <span>Chega mais.</span>
          </div>
          <div className="house-orbit-camera">
            <CameraOff size={19} />
            <span>
              Câmera desligada.
              <br />
              <strong>Você decide quando ligar.</strong>
            </span>
          </div>
          <div className="house-orbit-sticker" aria-hidden="true">
            pode
            <br />
            <strong>chegar ↗</strong>
          </div>
          <div className="house-stage-wrap">
            <div className="house-stage-top">
              <span>DISQUE AMIZADE / A CASA</span>
              <span>ESCOLHA UM CLIMA ↘</span>
            </div>
            <div className="house-stage">
              <img
                className="house-stage-room"
                src={`/garage/${room.id}-background.webp`}
                alt={`Prévia do cenário ${room.name}`}
                fetchPriority="high"
              />
              <span className="house-scene-label">
                {String(roomIndex + 1).padStart(2, "0")} / {room.name}
                {room.id === "bar" ? " · 18+" : ""}
              </span>
              <div className="house-stage-person house-person-a">
                <div className="house-speech">{room.speech}</div>
                <img src="/garage/home-caio.png" alt="Avatar Caio Bloco Pop" />
                <span>Caio</span>
              </div>
              <div className="house-stage-person house-person-b">
                <div className="house-speech">{room.other}</div>
                <img src="/garage/home-lia.png" alt="Avatar Lia Bloco Pop" />
                <span>Lia</span>
              </div>
              <div className="house-stage-caption">
                <strong>{room.tag}</strong>
                <span>Cena ilustrativa com os avatares do produto</span>
              </div>
            </div>
            <div
              className="house-room-tabs"
              role="group"
              aria-label="Prévia dos ambientes"
            >
              {rooms.map((r, i) => (
                <button
                  key={r.id}
                  aria-pressed={i === roomIndex}
                  onClick={() => setRoom(i)}
                >
                  <span>0{i + 1}</span>
                  {r.name}
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="house-manifesto">
        <p>
          Uma casa. Muitos jeitos
          <br />
          <strong>de se conectar.</strong>
        </p>
        <div>
          Uma casa para circular, brincar e conversar.
          <br />
          Com o charme de uma festa de garagem
          <br />e a liberdade de chegar do seu jeito.
        </div>
        <MoveUpRight strokeWidth={1} />
      </section>
      <section className="house-places" id="a-casa">
        <div className="house-section-head">
          <div>
            <p className="house-eyebrow">ENCONTRE O CLIMA DA SUA CONVERSA.</p>
            <h2>
              É chegar
              <br />
              <em>em algum lugar.</em>
            </h2>
          </div>
          <p>
            Cada ambiente muda o clima.
            <br />
            Você escolhe onde a conversa começa.
          </p>
        </div>
        <div className="house-places-grid">
          {rooms.map((r, i) => (
            <Link to="/garagem" className="house-place" key={r.id}>
              <div>
                <img
                  src={`/garage/${r.id}-background.webp`}
                  alt={r.name}
                  loading="lazy"
                />
                <span className="house-place-number">0{i + 1}</span>
                <span className="house-place-arrow">
                  <ArrowUpRight />
                </span>
              </div>
              <div className="house-place-title">
                <h3>{r.name}</h3>
                <span>
                  {r.id === "bar" ? "18+" : i === 0 ? "LADO A" : "LADO B"}
                </span>
              </div>
              <p>{r.label}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="house-identity" id="seu-jeito">
        <div className="house-avatar-display">
          <span className="house-collection">BLOCO POP / COLEÇÃO DA CASA</span>
          <span className="house-avatar-word" aria-hidden="true">
            OI.
          </span>
          <img
            src={`/garage/home-${look}.png`}
            alt={`Personagem ${look === "caio" ? "Caio" : "Lia"}`}
            loading="lazy"
          />
          <div
            className="house-look-buttons"
            role="group"
            aria-label="Prévia dos avatares"
          >
            <button
              aria-pressed={look === "caio"}
              onClick={() => setLook("caio")}
            >
              Caio
            </button>
            <button
              aria-pressed={look === "lia"}
              onClick={() => setLook("lia")}
            >
              Lia
            </button>
          </div>
        </div>
        <div className="house-identity-copy">
          <p className="house-eyebrow">PERSONAGEM SEU. PERSONALIDADE TAMBÉM.</p>
          <h2>
            Um pouco de você.
            <br />
            <em>Um tanto de imaginação.</em>
          </h2>
          <p>
            Cabelo diferente? Roupa nova? Experimente. Seu avatar é o seu jeito
            de chegar antes mesmo de dizer a primeira palavra.
          </p>
          <ul>
            <li>
              <Check />
              Escolha cabelos, roupas e acessórios.
            </li>
            <li>
              <Check />
              Mostre o que procura, se quiser.
            </li>
            <li>
              <Check />
              Guarde o avatar em uma conta gratuita.
            </li>
          </ul>
          <Link className="house-dark-cta" to="/garagem">
            Criar meu personagem <ArrowRight size={19} />
          </Link>
        </div>
      </section>
      <section
        className="house-masks"
        id="mascaras"
        aria-labelledby="masks-title"
      >
        <div className="house-mask-copy">
          <p className="house-eyebrow">SEU AVATAR TAMBÉM ENTRA NA CÂMERA.</p>
          <h2 id="masks-title">
            O papo é real.
            <br />
            <em>O rosto pode ser do avatar.</em>
          </h2>
          <p>
            Seu personagem vira uma máscara 3D que envolve o rosto como um
            capacete. Na câmera, seu corpo e o ambiente continuam reais. Quem
            aparece no lugar do seu rosto é o avatar que você escolheu.
          </p>
          <ul>
            <li>
              <span>01</span>
              <div>
                <strong>Experimente antes de entrar.</strong>
                <p>
                  Veja a câmera e a máscara numa prévia só sua, antes de
                  compartilhar o vídeo.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Com máscara ou sem. Você decide.</strong>
                <p>
                  Ative ou desative o efeito quando quiser. A câmera começa
                  desligada.
                </p>
              </div>
            </li>
          </ul>
          <Link className="house-cta" to="/garagem">
            Conhecer minha máscara <ArrowUpRight size={20} />
          </Link>
          <p className="house-mask-hint">
            Na entrada da casa, escolha “Testar câmera e máscara antes de
            entrar”.
          </p>
        </div>
        <figure className="house-mask-visual">
          <div className="house-mask-caption">
            <span /> Corpo real. Rosto de avatar.
          </div>
          <img
            src="/garage/avatar-camera-helmets.webp"
            width="1536"
            height="1024"
            loading="lazy"
            alt="Ilustração de quatro pessoas em câmeras: corpos e roupas reais, com cabeças de avatares Bloco Pop cobrindo os rostos como capacetes."
          />
          <figcaption>
            Ilustração do efeito. Experimente a máscara disponível na prévia da
            casa.
          </figcaption>
        </figure>
      </section>
      <section className="house-connect">
        <div className="house-section-head">
          <div>
            <p className="house-eyebrow">
              O MELHOR DA CASA É QUEM VOCÊ ENCONTRA.
            </p>
            <h2>
              Do primeiro oi
              <br />
              <em>ao “até amanhã”.</em>
            </h2>
          </div>
          <Link to="/minha-conta">
            Conheça seu perfil <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="house-steps">
          <article>
            <span>01 / CHEGUE</span>
            <MessageCircle strokeWidth={1} />
            <h3>Um balão quebra o gelo.</h3>
            <p>
              Na prévia local, escreva no chat do ambiente e veja sua mensagem
              aparecer sobre o avatar.
            </p>
          </article>
          <article>
            <span>02 / CONVERSE</span>
            <CameraOff strokeWidth={1} />
            <h3>Você escolhe como aparecer.</h3>
            <p>
              Teste o vídeo e o capacete do avatar antes da chamada. A câmera
              começa desligada.
            </p>
          </article>
          <article>
            <span>03 / REENCONTRE</span>
            <ArrowUpRight strokeWidth={1} />
            <h3>Vale a pena guardar esse oi.</h3>
            <p>
              Com uma conta opcional, salve seu personagem e envie pedidos de
              amizade. O aceite é sempre da outra pessoa.
            </p>
          </article>
        </div>
        <p className="house-privacy-note">
          O capacete cobre o rosto; voz, corpo e cenário ainda podem identificar
          você. <Link to="/diretrizes">Veja as regras de convivência.</Link>
        </p>
      </section>
      <section className="house-journal">
        <div>
          <p className="house-eyebrow">O ASSUNTO NÃO ACABA NA SALA.</p>
          <h2>
            Tem muita conversa
            <br />
            <em>no nosso blog.</em>
          </h2>
        </div>
        <div>
          <p>
            Amizades, encontros e dicas para conversar online com mais
            confiança.
          </p>
          <Link to="/blog">
            Explorar o blog <ArrowUpRight size={24} />
          </Link>
        </div>
      </section>
      <section className="house-final">
        <p className="house-eyebrow">JÁ QUE VOCÊ CHEGOU ATÉ AQUI…</p>
        <h2>
          Entra.
          <br />
          <em>Tem lugar pra você.</em>
        </h2>
        <Link className="house-cta" to="/garagem">
          Entrar sem cadastro <ArrowUpRight size={23} />
        </Link>
        <p>
          A casa está em prévia: chat de texto e vídeo em grupo funcionam entre
          visitas no mesmo navegador. Os encontros online estão em preparação.
        </p>
        <Link className="house-classic" to="/rooms">
          Ir para as salas online tradicionais <ChevronRight size={16} />
        </Link>
      </section>
      <footer className="house-footer">
        <Link to="/" aria-label="Disque Amizade início">
          <BrandLogo />
        </Link>
        <span>A casa é virtual. O encontro é humano.</span>
        <nav aria-label="Informações">
          <Link to="/blog">Blog</Link>
          <Link to="/termos">Termos</Link>
          <Link to="/privacidade">Privacidade</Link>
          <Link to="/diretrizes">Convivência</Link>
        </nav>
      </footer>
    </main>
  );
}
