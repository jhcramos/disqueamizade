import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Home, MapPin, MessageCircle, Trees } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { HOUSE_PRICE, LAND_PRICE, NEIGHBORHOOD_LOTS } from "@/garage3d/neighborhood";
import "./neighborhood.css";

const reais = (value: number) => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", maximumFractionDigits: 0,
}).format(value);

function MapTree({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`} aria-hidden="true">
      <ellipse cx="4" cy="6" rx="17" ry="13" fill="#49573c" opacity=".12" />
      <circle cx="-7" cy="0" r="13" fill="#7d9360" />
      <circle cx="5" cy="-7" r="15" fill="#95aa75" />
      <circle cx="7" cy="7" r="12" fill="#879e66" />
      <path d="M0 13V-7m0 12 8-7M0 0l-7-6" stroke="#5e774d" strokeWidth="1.5" fill="none" />
    </g>
  );
}

function NeighborhoodMap({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <svg className="neighborhood-map" viewBox="0 0 690 570" role="group" aria-label="Mapa interativo: seis lotes virtuais ao redor da casa central">
      <defs>
        <pattern id="neighborhood-grass" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M4 7h1m8 7h1" stroke="#738857" strokeWidth="1.6" opacity=".22" />
        </pattern>
        <pattern id="neighborhood-roof" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 5h10" stroke="#9b452d" strokeWidth="1" opacity=".3" />
        </pattern>
      </defs>
      <g aria-hidden="true">
        <rect x="4" y="4" width="682" height="562" rx="26" fill="#e4e5ce" />
        <rect x="4" y="4" width="682" height="562" rx="26" fill="url(#neighborhood-grass)" />
        <rect x="35" y="35" width="620" height="500" rx="48" fill="none" stroke="#f8f4e9" strokeWidth="56" />
        <rect x="35" y="35" width="620" height="500" rx="48" fill="none" stroke="#c9c1af" strokeWidth="35" />
        <rect x="35" y="35" width="620" height="500" rx="48" fill="none" stroke="#f7f2e6" strokeWidth="1.5" strokeDasharray="10 12" />
        <path d="M62 237h566M62 335h566" stroke="#f8f4e9" strokeWidth="17" />
        <path d="M345 232v108" stroke="#f8f4e9" strokeWidth="17" />
        <path d="M86 285h155m208 0h155" stroke="#f8f4e9" strokeWidth="14" />
        <path d="M279 253h132v69H279z" fill="#c9ceb0" />
        <rect x="271" y="260" width="150" height="68" rx="6" fill="#667153" opacity=".15" />
        <rect x="270" y="249" width="150" height="64" rx="4" fill="#f5dec0" stroke="#b58b65" strokeWidth="1.5" />
        <path d="m261 261 83-42 85 42-85 26z" fill="#bd6848" stroke="#8f503c" strokeWidth="1.5" />
        <path d="m261 261 83-42 85 42-85 26z" fill="url(#neighborhood-roof)" />
        <path d="m344 220 1 66" stroke="#e2a782" strokeWidth="2" />
        <path d="M285 282h19v17h-19zm99 0h19v17h-19z" fill="#79918a" stroke="#f8edda" strokeWidth="3" />
        <path d="M333 289h23v25h-23z" fill="#704c43" />
        <path d="M324 314h42m-47 6h52" stroke="#bfb59b" strokeWidth="4" />
        <rect x="386" y="234" width="12" height="17" fill="#ac8261" />
        <path d="M383 234h18" stroke="#7f624e" strokeWidth="3" />
        <path d="M178 273v22m-5-22v22M505 273v22m5-22v22" stroke="#ac8460" strokeWidth="4" />
        <path d="M170 277h11m-11 15h11m321-15h11m-11 15h11" stroke="#79604e" strokeWidth="2" />
        <MapTree x={99} y={95} size={0.85} />
        <MapTree x={591} y={94} size={0.85} />
        <MapTree x={111} y={285} />
        <MapTree x={220} y={275} size={0.82} />
        <MapTree x={470} y={297} size={0.76} />
        <MapTree x={586} y={285} />
        <MapTree x={99} y={479} size={0.85} />
        <MapTree x={590} y={479} size={0.85} />
        <circle cx="229" cy="303" r="4" fill="#b76548" />
        <circle cx="239" cy="296" r="4" fill="#596d73" />
        <circle cx="438" cy="270" r="4" fill="#b76548" />
        <circle cx="448" cy="278" r="4" fill="#ccb06d" />
      </g>
      {NEIGHBORHOOD_LOTS.map((lot) => {
        const x = 120 + ((lot.x + 30) / 30) * 155;
        const y = lot.z < 0 ? 109 : 364;
        const selected = selectedId === lot.id;
        return (
          <g key={lot.id} className={`neighborhood-map-lot${selected ? " is-selected" : ""}`}
            role="button" tabIndex={0} aria-pressed={selected}
            aria-label={`Selecionar lote ${lot.id}, ${lot.name}, terreno virtual de ${reais(LAND_PRICE)}`}
            onClick={() => onSelect(lot.id)} onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(lot.id);
              }
            }}>
            <rect className="neighborhood-lot-focus" x={x - 5} y={y - 5} width="145" height="117" rx="14" />
            <rect className="neighborhood-lot-fill" x={x} y={y} width="135" height="107" rx="9" />
            <path className="neighborhood-lot-inset" d={`M${x + 12} ${y + 25}v-13h15m81 0h15v13m0 57v13h-15m-81 0h-15v-13`} />
            <text className="neighborhood-lot-number" x={x + 67.5} y={y + 43} textAnchor="middle">0{lot.id}</text>
            <text className="neighborhood-lot-name" x={x + 67.5} y={y + 66} textAnchor="middle">{lot.name}</text>
            <text className="neighborhood-lot-caption" x={x + 67.5} y={y + 84} textAnchor="middle">{selected ? "SELECIONADO" : "LOTE VIRTUAL"}</text>
          </g>
        );
      })}
      <g aria-hidden="true">
        <rect x="252" y="334" width="186" height="23" rx="11.5" fill="#f7f2e9" />
        <text x="345" y="350" textAnchor="middle" className="neighborhood-map-house-label">A CASA · ENCONTRO GRATUITO</text>
        <path d="m619 92 0-22m-7 10 7-10 7 10" stroke="#6d7660" strokeWidth="1.5" fill="none" />
        <text x="619" y="64" textAnchor="middle" className="neighborhood-map-north">N</text>
      </g>
    </svg>
  );
}

export function NeighborhoodPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedLot = NEIGHBORHOOD_LOTS.find((lot) => lot.id === searchParams.get("lote")) ?? NEIGHBORHOOD_LOTS[0];
  const selectLot = (id: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("lote", id);
      return next;
    }, { replace: true, preventScrollReset: true });
  };
  const exploreUrl = `/garagem?bairro=1&lote=${selectedLot.id}`;
  const interestUrl = `mailto:contato@disqueamizade.com.br?subject=${encodeURIComponent(`Interesse no lote ${selectedLot.id} — ${selectedLot.name}`)}&body=${encodeURIComponent(`Olá, equipe Disque Amizade!

Gostaria de conhecer as condições e a disponibilidade do lote virtual ${selectedLot.id} (${selectedLot.name}), apresentado por ${reais(LAND_PRICE)}, na vizinhança Disque Amizade.

Também gostaria de entender a proposta da casa virtual de ${reais(HOUSE_PRICE)}, as possibilidades de personalização e as condições previstas para aluguel.

Podem me contar mais?`)}`;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Vizinhança Disque Amizade — um lugar seu, perto da conversa";
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <main className="neighborhood-page">
      <a className="neighborhood-skip" href="#mapa">Pular para o mapa dos lotes</a>
      <header className="neighborhood-nav">
        <Link to="/" aria-label="Disque Amizade início"><BrandLogo /></Link>
        <nav aria-label="Navegação da vizinhança">
          <a href="#mapa">Os lotes</a>
          <a href="#a-proposta">A proposta</a>
        </nav>
        <Link className="neighborhood-home-link" to="/garagem">Entrar na casa <ArrowUpRight size={16} /></Link>
      </header>

      <section className="neighborhood-hero" aria-labelledby="neighborhood-title">
        <div className="neighborhood-intro">
          <p className="neighborhood-eyebrow"><span /> A VIZINHANÇA DISQUE AMIZADE</p>
          <h1 id="neighborhood-title">Um lugar seu.<br />Uma boa<br /><em>vizinhança.</em></h1>
          <p className="neighborhood-lead">A conversa começa em casa.<br />E pode continuar na sua rua.</p>
          <p className="neighborhood-description">Conheça a proposta de seis terrenos virtuais ao redor da nossa casa. Um cantinho para dar o seu toque, receber sua turma e estar perto de novos encontros.</p>
          <a className="neighborhood-button" href="#mapa">Encontre seu lugar <ArrowDown size={18} /></a>
          <div className="neighborhood-intro-note"><Home size={17} strokeWidth={1.6} /><span>A casa central continua aberta.<br /><strong>Explorar e encontrar sua turma é gratuito.</strong></span></div>
          <span className="neighborhood-hero-index" aria-hidden="true">01—06 / UM BAIRRO, MUITAS HISTÓRIAS</span>
        </div>

        <div className="neighborhood-map-panel" id="mapa">
          <div className="neighborhood-map-heading"><span>ESCOLHA UM LOTE NO MAPA</span><span><MapPin size={13} /> Dentro do Disque Amizade</span></div>
          <NeighborhoodMap selectedId={selectedLot.id} onSelect={selectLot} />
          <p className="neighborhood-map-caption">Vista ilustrativa do bairro · os lotes representam espaços virtuais.</p>
          <div className="neighborhood-selection" aria-live="polite" aria-atomic="true">
            <div className="neighborhood-selection-number" aria-hidden="true">0{selectedLot.id}</div>
            <div className="neighborhood-selection-name"><span>SEU LOTE EM VISTA</span><h2>{selectedLot.name}</h2><p>Ao redor da casa. Perto da conversa.</p></div>
            <div className="neighborhood-selection-price"><strong>{reais(LAND_PRICE)}</strong><span>por terreno virtual</span></div>
          </div>
          <Link className="neighborhood-explore" to={exploreUrl}>Caminhar até o lote {selectedLot.id} na prévia <ArrowUpRight size={18} /></Link>
        </div>
      </section>

      <section className="neighborhood-spirit" aria-label="O espírito da vizinhança">
        <p>O endereço é virtual.<br /><em>A vontade de se encontrar é real.</em></p>
        <div><span>SEIS LOTES. UMA CASA EM COMUM.</span><p>Uma rua que leva ao papo da garagem, à sala de estar e à próxima amizade. A casa é o nosso ponto de encontro; a vizinhança é a proposta de dar mais espaço a essas histórias.</p></div>
      </section>

      <section className="neighborhood-proposal" id="a-proposta" aria-labelledby="neighborhood-proposal-title">
        <div className="neighborhood-proposal-copy">
          <p className="neighborhood-eyebrow">SEU CANTINHO, DO SEU JEITO</p>
          <h2 id="neighborhood-proposal-title">Abra espaço<br /><em>para a sua turma.</em></h2>
          <p>Um quintal para o primeiro oi. Uma casa com a sua cara. Um lugar para voltar. É assim que imaginamos o próximo capítulo do Disque Amizade.</p>
          <div className="neighborhood-benefits">
            <article><Trees size={23} strokeWidth={1.5} /><div><h3>Escolha sua parte do bairro</h3><p>Seis terrenos virtuais organizados ao redor da casa central, com caminhos para explorar.</p></div></article>
            <article><Home size={23} strokeWidth={1.5} /><div><h3>Imagine a sua casa</h3><p>A proposta prevê uma casa virtual para personalizar e receber pessoas, com possibilidade de aluguel pelo proprietário.</p></div></article>
            <article><MessageCircle size={23} strokeWidth={1.5} /><div><h3>Continue perto dos encontros</h3><p>Seu espaço faz parte do nosso mundo. A casa central permanece como lugar gratuito para chegar e conversar.</p></div></article>
          </div>
        </div>
        <aside className="neighborhood-pricing" aria-labelledby="neighborhood-pricing-title">
          <div className="neighborhood-pricing-top"><span>A PROPOSTA EM DETALHES</span><ArrowUpRight size={23} strokeWidth={1.4} /></div>
          <h3 id="neighborhood-pricing-title">Seu próximo<br />endereço virtual.</h3>
          <div className="neighborhood-price-row"><div><span>TERRENO VIRTUAL</span><p>Um dos seis lotes do bairro</p></div><strong>{reais(LAND_PRICE)}</strong></div>
          <div className="neighborhood-price-row"><div><span>CASA VIRTUAL</span><p>Condições a confirmar com a equipe</p></div><strong>{reais(HOUSE_PRICE)}</strong></div>
          <p className="neighborhood-pricing-note">Valores apresentados para a proposta. Consulte a disponibilidade, o que está incluído e as condições para a casa e o aluguel.</p>
          <div className="neighborhood-interest-lot"><Check size={16} /><span>Seu interesse: lote {selectedLot.id} · {selectedLot.name}</span></div>
          <a className="neighborhood-button" href={interestUrl}>Conversar sobre este lote <ArrowUpRight size={18} /></a>
          <p className="neighborhood-email-note">Abre seu e-mail com o lote escolhido. Nenhuma reserva ou cobrança é feita aqui.</p>
        </aside>
      </section>

      <section className="neighborhood-how" aria-labelledby="neighborhood-how-title">
        <div className="neighborhood-how-heading"><p className="neighborhood-eyebrow">PRIMEIRO, VENHA CONHECER</p><h2 id="neighborhood-how-title">Toda história começa<br /><em>com uma visita.</em></h2></div>
        <ol>
          <li><span>01</span><div><h3>Dê uma volta</h3><p>Escolha um lote no mapa e caminhe pelo bairro na prévia da casa.</p></div></li>
          <li><span>02</span><div><h3>Conte a sua ideia</h3><p>Fale com a equipe sobre o seu espaço e as condições da proposta.</p></div></li>
          <li><span>03</span><div><h3>Conheça os próximos passos</h3><p>Confirme disponibilidade, personalização e regras de uso antes de decidir.</p></div></li>
        </ol>
      </section>

      <section className="neighborhood-faq" aria-labelledby="neighborhood-faq-title">
        <div><p className="neighborhood-eyebrow">BOM SABER ANTES DE CHEGAR</p><h2 id="neighborhood-faq-title">Vamos combinar<br /><em>direitinho.</em></h2></div>
        <div className="neighborhood-questions">
          <details><summary>Preciso comprar um lote para entrar na casa?</summary><p>Não. A casa central e a exploração da prévia continuam gratuitas. Os terrenos fazem parte de uma proposta opcional de espaços próprios dentro do Disque Amizade.</p></details>
          <details><summary>É um terreno ou uma casa de verdade?</summary><p>É um espaço virtual dentro do Disque Amizade. Não corresponde a um imóvel físico, escritura ou direito sobre um terreno no mundo real.</p></details>
          <details><summary>Já posso comprar, construir ou alugar aqui?</summary><p>Esta página apresenta o bairro e recebe seu interesse por e-mail. A compra, a construção e o aluguel ainda não são realizados nesta página. Consulte a equipe para conhecer as condições, o que estará incluído e os próximos passos.</p></details>
          <details><summary>O que significa o valor da casa?</summary><p>A casa virtual é apresentada por {reais(HOUSE_PRICE)}. A modalidade, o que está incluído e as condições de uso e aluguel precisam ser confirmados com a equipe antes de qualquer contratação.</p></details>
        </div>
      </section>

      <section className="neighborhood-invitation">
        <p className="neighborhood-eyebrow">A PORTA DA CASA JÁ ESTÁ ABERTA</p>
        <h2>Antes de ser vizinho,<br /><em>chegue para um oi.</em></h2>
        <Link className="neighborhood-button" to="/garagem">Entrar na casa gratuitamente <ArrowRight size={19} /></Link>
        <p>Sem cadastro para explorar a prévia.</p>
      </section>
      <footer className="neighborhood-footer">
        <Link to="/" aria-label="Disque Amizade início"><BrandLogo /></Link>
        <span>A casa é virtual. O encontro é humano.</span>
        <nav aria-label="Informações"><Link to="/termos">Termos</Link><Link to="/privacidade">Privacidade</Link><Link to="/diretrizes">Convivência</Link></nav>
      </footer>
    </main>
  );
}
