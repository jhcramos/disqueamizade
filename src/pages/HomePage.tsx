import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  MoveUpRight,
  Check,
  MessageCircle,
  CameraOff,
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
  const [look, setLook] = useState("caio");
  return (
    <main className="house-home">
      <header className="house-nav">
        <Link to="/" aria-label="Disque Amizade início">
          <BrandLogo />
        </Link>
        <nav aria-label="Navegação principal">
          <Link to="/rooms">Salas de bate-papo</Link>
          <Link to="/garagem">A Casa</Link>
          <Link to="/blog">Blog</Link>
        </nav>
        <Link className="house-account" to="/minha-conta">
          Meu perfil <ArrowUpRight size={16} />
        </Link>
      </header>
      <section className="conversation-entry" aria-labelledby="welcome-title">
        <div className="conversation-intro">
          <p className="house-eyebrow">DUAS PORTAS. UM BOM COMEÇO.</p>
          <h1 id="welcome-title">Seu próximo papo<br />começa <em>aqui.</em></h1>
          <p>Entre numa sala de conversa ou explore a Casa e conheça gente pelo caminho.</p>
        </div>
        <div className="experience-choices">
          <article className="experience-choice choice-chat">
            <div className="experience-copy">
              <span className="experience-number">01 / ESCOLHA UM ASSUNTO</span>
              <h2>Salas de bate-papo</h2>
              <p>Converse por texto, fale reservadamente ou ligue a câmera. O primeiro passo é um oi.</p>
            </div>
            <div className="chat-illustration" aria-label="Ilustração de uma conversa, com mensagens de exemplo">
              <div className="chat-illustration-top"><span>♯ Papo Livre</span><small>PRÉVIA ILUSTRATIVA</small></div>
              <div className="sample-message"><b>OI</b><span>Cheguei. Tem lugar pra mais um?</span></div>
              <div className="sample-message sample-answer"><span>Tem sim. Qual é o papo de hoje?</span><b>✳</b></div>
              <div className="chat-illustration-tags"><span>Texto</span><span>Reservado</span><span>Câmera opcional</span></div>
            </div>
            <Link className="experience-enter" to="/rooms">Entrar no bate-papo <ArrowRight size={20} /></Link>
            <small className="experience-footnote">Escolha seu apelido e uma sala para começar.</small>
            <a className="experience-learn" href="#como-funciona-chat">Como funcionam as salas ↓</a>
          </article>
          <article className="experience-choice choice-house">
            <div className="experience-copy">
              <span className="experience-number">02 / EXPLORE OS AMBIENTES</span>
              <h2>A Casa</h2>
              <p>Escolha seu avatar, passe pela garagem, pela sala e pelo bar. Chegue do seu jeito.</p>
            </div>
            <div className="house-illustration"><img src="/garage/real-house.webp" fetchPriority="high" width="690" height="550" alt="Captura da Casa 3D real, com garagem, sala de estar e Bar Vinyl" /></div>
            <Link className="experience-enter" to="/garagem">Explorar a Casa <ArrowRight size={20} /></Link>
            <small className="experience-footnote">Prévia explorável · encontros online em preparação.</small>
            <a className="experience-learn" href="#a-casa">Conheça a experiência da Casa ↓</a>
          </article>
        </div>
      </section>
      <section className="house-manifesto">
        <p>
          Seu assunto. Seu jeito
          <br />
          <strong>de se conectar.</strong>
        </p>
        <div>
          Nas salas, vá direto à conversa.
          <br />
          Na Casa, experimente circular com seu avatar.
          <br />Você escolhe por onde começar.
        </div>
        <MoveUpRight strokeWidth={1} />
      </section>
      <section className="home-chat-details" id="como-funciona-chat" aria-labelledby="chat-details-title">
        <div className="home-detail-heading">
          <div><p className="house-eyebrow">01 / SALAS DE BATE-PAPO</p><h2 id="chat-details-title">Um assunto em comum.<br /><em>O resto é conversa.</em></h2></div>
          <p>Para quem quer conhecer pessoas pelo papo. Escolha uma sala, entre com seu apelido e acompanhe a conversa antes de mandar seu primeiro oi.</p>
        </div>
        <ol className="home-entry-steps">
          <li><span>01</span><div><strong>Encontre seu assunto</strong><p>Amizade, desabafo, paquera ou um papo com gente de 40 anos ou mais.</p></div></li>
          <li><span>02</span><div><strong>Escolha um apelido</strong><p>Entre para conversar. Câmera e microfone começam desligados.</p></div></li>
          <li><span>03</span><div><strong>Puxe uma conversa</strong><p>Escreva para a sala ou escolha alguém para falar reservadamente.</p></div></li>
        </ol>
        <div className="home-chat-features">
          <article><span>CONVERSA PÚBLICA</span><h3>Chegou? Pode dar um oi.</h3><p>Leia o papo da sala, responda a uma mensagem e use as sugestões rápidas para quebrar o gelo.</p></article>
          <article><span>SÓ ENTRE VOCÊS</span><h3>Um papo mais reservado.</h3><p>Abra uma conversa particular pela lista de participantes. Convites de sala reservada e vídeo podem ser aceitos ou recusados.</p></article>
          <article><span>CÂMERA OPCIONAL</span><h3>Veja quem está falando.</h3><p>Uma câmera em destaque e miniaturas para trocar de pessoa. Confira sua própria câmera antes de compartilhar.</p></article>
          <article><span>SEU ESPAÇO</span><h3>Encontre. Volte. Convide.</h3><p>Favorite salas para reencontrá-las. Com uma conta e e-mail confirmado, crie sua sala grátis, pública ou por convite.</p></article>
        </div>
        <nav className="home-room-links" aria-label="Escolha uma sala de bate-papo">
          <Link to="/comunidade/papo-livre">Papo Livre ↗</Link><Link to="/comunidade/desabafa-aqui">Desabafa aqui ↗</Link><Link to="/comunidade/46-plus">Amizade 40+ ↗</Link><Link to="/comunidade/paquera-e-namoro">Paquera e namoro ↗</Link><Link to="/comunidade/paquera-lgbtqia">Paquera LGBTQIA+ ↗</Link><Link to="/comunidade/adult-lounge">Lounge 18+ ↗</Link>
        </nav>
        <div className="home-detail-bottom"><p>Você pode bloquear participantes e denunciar mensagens. O Lounge 18+ fica separado em uma área adulta com confirmação antes da entrada.</p><Link to="/rooms">Encontrar minha sala <ArrowRight size={20} /></Link></div>
      </section>
      <section className="house-places" id="a-casa">
        <div className="house-section-head">
          <div>
            <p className="house-eyebrow">02 / A CASA · PRÉVIA EXPLORÁVEL</p>
            <h2>
              Mais do que entrar.
              <br />
              <em>É explorar.</em>
            </h2>
          </div>
          <p>
            Para quem gosta de descobrir um lugar: escolha seu avatar, circule pelos ambientes e experimente as interações da Casa, sem cadastro para explorar.
          </p>
        </div>
        <ol className="home-entry-steps house-entry-steps">
          <li><span>01</span><div><strong>Monte seu personagem</strong><p>Experimente cabelos, roupas e acessórios para chegar do seu jeito.</p></div></li>
          <li><span>02</span><div><strong>Circule pela Casa</strong><p>Explore a garagem, a sala de estar e o bar. Descubra os objetos e as interações de cada ambiente.</p></div></li>
          <li><span>03</span><div><strong>Experimente a prévia</strong><p>Teste os balões de conversa e a câmera com máscara de avatar. Encontros entre pessoas online ainda estão em preparação.</p></div></li>
        </ol>
        <div className="house-places-grid">
          {rooms.map((r, i) => (
            <Link to="/garagem" className="house-place" key={r.id}>
              <div>
                <img
                  src={`/garage/real-${r.id}.webp`}
                  alt={`Captura real de ${r.name} na Casa 3D`}
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
              <p>{r.label} · captura real da Casa 3D</p>
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
        <p>Vá direto ao bate-papo online ou descubra a prévia da Casa com seu avatar.</p>
        <div className="home-final-choices"><Link className="house-cta" to="/rooms">Entrar no bate-papo <ArrowUpRight size={23} /></Link><Link className="house-cta" to="/garagem">Explorar a Casa <ArrowUpRight size={23} /></Link></div>
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
