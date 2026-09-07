import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  House,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import "./house-home.css";
export function HomePage() {
  return (
    <main className="house-home">
      <header className="house-nav">
        <Link className="house-brand" to="/" aria-label="Disque Amizade início">
          <House strokeWidth={1.5} />
          <span>
            disque
            <br />
            amizade
          </span>
        </Link>
        <nav aria-label="Navegação principal">
          <a href="#ambientes">A casa</a>
          <a href="#como-funciona">Como funciona</a>
          <Link to="/minha-conta">
            Meu perfil <UserRound size={15} />
          </Link>
        </nav>
        <Link className="house-enter" to="/garagem">
          Pode entrar <ArrowUpRight size={17} />
        </Link>
      </header>
      <section className="house-hero">
        <div className="house-hero-copy">
          <p className="house-eyebrow">
            <span /> UM NOVO JEITO DE DAR OI
          </p>
          <h1>
            Tem lugar
            <br />
            para <em>você</em>
            <br />
            nessa casa.
          </h1>
          <p className="house-lead">
            Um personagem com a sua cara. Uma sala com a sua vibe. E uma
            conversa que pode virar amizade.
          </p>
          <Link className="house-cta" to="/garagem">
            Entrar sem cadastro <ArrowRight size={20} />
          </Link>
          <p className="house-small">
            Explore a prévia · câmera desligada ao entrar
          </p>
        </div>
        <div className="house-hero-art">
          <img
            src="/garage/garage-background.webp"
            alt="Garagem acolhedora com luzes coloridas, discos e cadeiras para receber amigos"
            fetchPriority="high"
          />
          <div className="house-art-label">
            <span>01 / A GARAGEM</span>
            <strong>
              O próximo oi
              <br />
              pode ser o seu.
            </strong>
          </div>
          <div
            className="house-hero-people"
            aria-label="Avatares disponíveis na casa"
          >
            <img src="/garage/home-caio.png" alt="Caio, avatar Bloco Pop" />
            <img src="/garage/home-lia.png" alt="Lia, avatar Bloco Pop" />
          </div>
          <div className="house-sticker">
            <MessageCircle size={25} />
            <span>
              Chega mais.
              <br />
              <strong>A casa é sua também.</strong>
            </span>
          </div>
        </div>
      </section>
      <div className="house-ribbon">
        <span>Entre do seu jeito</span>
        <Sparkles size={17} />
        <span>Escolha um cantinho</span>
        <Sparkles size={17} />
        <span>Deixe a conversa acontecer</span>
      </div>
      <section className="house-rooms" id="ambientes">
        <div className="house-section-heading">
          <div>
            <p className="house-eyebrow">TRÊS CANTINHOS. MUITOS COMEÇOS.</p>
            <h2>
              Onde a gente
              <br />
              se encontra?
            </h2>
          </div>
          <p>
            Tem dia de festa. Tem dia de sofá.
            <br />
            Escolha o clima que combina com você.
          </p>
        </div>
        <div className="house-room-grid">
          {[
            {
              n: "01",
              name: "Garagem",
              tag: "Música, nostalgia e um primeiro oi.",
              image: "garage",
              copy: "Luzes acesas, discos à mão e espaço para chegar junto.",
            },
            {
              n: "02",
              name: "Sala de estar",
              tag: "Papo leve. Sem pressa.",
              image: "living",
              copy: "Um cantinho acolhedor para deixar a conversa render.",
            },
            {
              n: "03",
              name: "Bar Vinyl",
              tag: "Um encontro à mesa. 18+",
              image: "bar",
              copy: "Mesas para quatro e clima de bar. Acesso adulto dentro da casa.",
            },
          ].map((r) => (
            <Link className="house-room-card" key={r.n} to="/garagem">
              <div className="house-room-image">
                <img
                  src={`/garage/${r.image}-background.webp`}
                  alt={`Cenário de ${r.name}`}
                  loading="lazy"
                />
                <span>{r.n}</span>
                <ArrowUpRight />
              </div>
              <h3>{r.name}</h3>
              <strong>{r.tag}</strong>
              <p>{r.copy}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="house-how" id="como-funciona">
        <div>
          <p className="house-eyebrow">MENOS CERIMÔNIA. MAIS ENCONTRO.</p>
          <h2>
            A amizade começa
            <br />
            com um <em>oi.</em>
          </h2>
          <p>
            Não precisa chegar com assunto pronto.
            <br />
            Só com vontade de conhecer a casa.
          </p>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div>
              <h3>Escolha seu personagem.</h3>
              <p>
                Cabelo, roupa, acessórios. Experimente um avatar com o seu
                jeito.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Encontre seu cantinho.</h3>
              <p>
                Ande pelos cenários, explore os objetos e descubra a
                experiência.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Guarde os bons encontros.</h3>
              <p>
                Uma conta opcional para salvar seu avatar e adicionar amigos,
                sempre com aceite.
              </p>
            </div>
          </li>
        </ol>
      </section>
      <section className="house-care">
        <ShieldCheck size={32} />
        <div>
          <h3>Você decide como aparecer.</h3>
          <p>
            Teste a câmera e o capacete do avatar antes da conversa. Ligar o
            vídeo é uma escolha sua. Voz, corpo e cenário ainda podem
            identificar você.
          </p>
        </div>
        <Link to="/diretrizes">
          Respeito é regra da casa <ArrowUpRight size={17} />
        </Link>
      </section>
      <section className="house-invite">
        <p className="house-eyebrow">A CAMPAINHA JÁ TOCOU.</p>
        <h2>
          Entra.
          <br />
          <em>Fica à vontade.</em>
        </h2>
        <Link className="house-cta" to="/garagem">
          Conhecer a casa <ArrowRight size={20} />
        </Link>
        <p className="house-preview-note">
          A casa está em prévia: conversas em grupo e chat de texto funcionam
          entre visitas no mesmo navegador. Os encontros online estão em
          preparação.
        </p>
        <Link className="house-classic" to="/rooms">
          Procurando as salas online tradicionais? <ArrowUpRight size={15} />
        </Link>
      </section>
      <footer className="house-footer">
        <Link className="house-brand" to="/">
          <House strokeWidth={1.5} />
          <span>
            disque
            <br />
            amizade
          </span>
        </Link>
        <p>Um lugar para chegar. Gente para reencontrar.</p>
        <nav aria-label="Informações">
          <Link to="/termos">Termos</Link>
          <Link to="/privacidade">Privacidade</Link>
          <Link to="/diretrizes">Convivência</Link>
          <Link to="/blog">Blog</Link>
        </nav>
      </footer>
    </main>
  );
}
