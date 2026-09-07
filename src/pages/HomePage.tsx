import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, ArrowRight, MessageCircle, Users, Shuffle, ShieldCheck, Video } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { ProgramaAoVivo } from '@/components/common/ProgramaAoVivo'
import { useToastStore } from '@/components/common/ToastContainer'
import { useAgeVerification } from '@/components/common/AgeVerificationModal'
import { useAuthStore } from '@/store/authStore'
import { useRooms } from '@/hooks/useSupabaseData'
import { track } from '@/services/analytics'
import { lobbyRooms } from '@/rooms/lobbyRooms'

export const HomePage = () => {
  const navigate = useNavigate()
  const signInAsGuest = useAuthStore(s => s.signInAsGuest)
  const { verifyAge } = useAgeVerification()
  const { rooms, loading } = useRooms()
  useEffect(() => { track('home_view') }, [])
  const enterNow = () => {
    track('cta_enter_click', { cta: 'hero_main' })
    verifyAge(() => { void signInAsGuest().then(() => navigate('/room/geral-brasil')).catch(() => useToastStore.getState().addToast({ type: 'error', title: 'Entrada indisponível', message: 'Não foi possível entrar. Tente novamente em instantes.' })) })
  }
  const featured = lobbyRooms(rooms.map(room => ({ ...room, online_count: room.current_participants || 0 })))

  return <div className="home-editorial min-h-screen flex flex-col">
    <Header />
    <main>
      <section className="home-hero site-container">
        <div className="home-hero-copy">
          <span className="site-eyebrow"><span className="site-live-dot" /> MENOS FEED. MAIS CONVERSA.</span>
          <h1>Tem gente boa<br />do outro <em>lado.</em></h1>
          <p>Um lugar para conhecer pessoas, dividir histórias e deixar a conversa acontecer. Ao vivo, no seu ritmo e do seu jeito.</p>
          <div className="home-actions">
            <button onClick={enterNow} className="site-button">Entrar e dar um oi <ArrowUpRight size={18} /></button>
            <Link to="/rooms" className="site-text-link">Explorar as salas <ArrowRight size={16} /></Link>
          </div>
          <div className="home-reassurance"><ShieldCheck size={15} /> Grátis · Sem cadastro · Para maiores de 18 anos</div>
        </div>
        <div className="home-hero-art">
          <div className="home-photo-frame">
            <img src="/hero-week-even.webp" alt="Pessoas compartilhando um momento de conversa" fetchPriority="high" />
            <div className="home-photo-caption"><span>DA / ENCONTROS</span><span>As melhores conexões<br />começam sem roteiro.</span></div>
          </div>
          <div className="home-note"><MessageCircle size={21} /><span>O próximo assunto?<br /><strong>Pode ser qualquer coisa.</strong></span></div>
          <span className="home-art-mark" aria-hidden="true">✳</span>
          <span className="home-art-label">CONVERSAS REAIS. NOVAS POSSIBILIDADES.</span>
        </div>
      </section>
      <div className="home-values"><div className="site-container"><span><Video size={17} /> Com vídeo ou sem câmera</span><span><MessageCircle size={17} /> Seu apelido, seu espaço</span><span><Users size={17} /> Pessoas, não perfis perfeitos</span></div></div>
      <section className="site-container home-discover">
        <div className="home-section-heading"><div><span className="site-eyebrow">ESCOLHA ONDE COMEÇAR</span><h2>Qual é a sua vibe hoje?</h2></div><p>Entre numa roda de conversa ou deixe o acaso apresentar alguém.</p></div>
        <div className="home-paths">
          <Link to="/rooms" className="home-path home-path-sage"><span className="home-path-index">01 / EM BOA COMPANHIA</span><Users size={34} strokeWidth={1.3} /><h3>Uma sala.<br />Muitos encontros.</h3><p>Encontre um assunto em comum e faça parte da conversa. Até um simples oi já vale.</p><span className="home-path-link">Encontrar uma sala <ArrowUpRight size={20} /></span></Link>
          <Link to="/roulette" className="home-path home-path-clay" onClick={() => track('cta_enter_click', { cta: 'hero_roulette' })}><span className="home-path-index">02 / UM ENCONTRO DE CADA VEZ</span><Shuffle size={34} strokeWidth={1.3} /><h3>Deixe o acaso<br />puxar assunto.</h3><p>Uma conversa a dois, uma pessoa nova. Se não bater, você pode seguir para a próxima.</p><span className="home-path-link">Experimentar a roleta <ArrowUpRight size={20} /></span></Link>
        </div>
      </section>
      <section className="site-container home-room-section">
        <div className="home-section-heading"><div><span className="site-eyebrow">A CONVERSA TEM LUGAR</span><h2>Encontre seu cantinho.</h2></div><Link to="/rooms" className="site-text-link">Ver as salas <ArrowRight size={16} /></Link></div>
        <div className="home-room-list">
          {loading && <p role="status">Buscando salas…</p>}
          {!loading && !featured.length && <p>Estamos preparando as salas. <Link to="/rooms">Verificar disponibilidade →</Link></p>}
          {featured.map((room, i) => <Link to={`/room/${room.slug || room.id}`} className="home-room" key={room.id}><span className="home-room-number">0{i + 1}</span><div><h3>{room.name}</h3><p>{room.description || 'Um espaço para conversar e conhecer pessoas.'}</p></div><span className="home-room-count"><Users size={14} />{room.current_participants || 0} na sala</span><ArrowUpRight size={22} /></Link>)}
        </div>
        <div className="home-program"><ProgramaAoVivo /></div>
      </section>
      <section className="home-comfort"><div className="site-container home-comfort-inner"><div><span className="site-eyebrow">PODE CHEGAR DO SEU JEITO</span><h2>Conexão começa<br />com <em>conforto.</em></h2><p>Você não precisa ligar a câmera para fazer parte. Escolha um apelido, ajuste sua máscara na prévia e decida quando quer aparecer.</p><Link to="/filtros" className="site-text-link">Conhecer as máscaras <ArrowRight size={16} /></Link></div><div className="home-principles">{[['01', 'Sua câmera, sua decisão.', 'Ela começa desligada. Você escolhe quando compartilhar.'], ['02', 'Convites, não interrupções.', 'Defina se aceita mensagem, áudio ou vídeo. Cada convite depende de você.'], ['03', 'Respeito faz parte do encontro.', 'Bloqueie ou denuncie quando precisar. Nosso espaço tem regras claras.']].map(([n, title, text]) => <article key={n}><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>
      <section className="site-container home-final"><span className="site-eyebrow">UMA PAUSA BOA NO SEU DIA</span><h2>Vamos conversar?</h2><button onClick={enterNow} className="site-button">Encontrar minha próxima conversa <ArrowUpRight size={18} /></button><Link to="/diretrizes">Conheça as diretrizes da comunidade</Link></section>
    </main>
    <Footer />
  </div>
}
