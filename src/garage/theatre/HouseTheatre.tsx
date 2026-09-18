import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ExternalLink, ListMusic, Pause, Play, Plus, SkipForward, Tv, X } from 'lucide-react';
import { ROOMS, type Person, type RoomId } from '../model';
import { youtubeId } from './model';
import type { useScreening } from './useScreening';
import { YouTubeScreen } from './YouTubeScreen';
import './theatre.css';

export function HouseTheatre({ screening, self, people, room, onClose }: { screening: ReturnType<typeof useScreening>; self: Person; people: Person[]; room: RoomId; onClose: () => void }) {
  const { state, ready, send, error, available } = screening;
  const mine = state.dj === self.id, dj = [self, ...people].find(p => p.id === state.dj);
  const [watching, setWatching] = useState(false), [url, setUrl] = useState(''), [title, setTitle] = useState(''), [formError, setFormError] = useState(''), [pending, setPending] = useState<string | null>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { close.current?.focus({ preventScroll: true }); }, []);
  const confirmed = !!pending && (state.queue.some(c => c.id === pending) || state.current?.id === pending);
  useEffect(() => {
    if (!pending) return;
    if (confirmed) { setPending(null); setUrl(''); setTitle(''); return; }
    const timer = setTimeout(() => { setPending(null); setFormError('O pedido não foi confirmado. Seu link está salvo aqui para tentar novamente.'); }, 6000);
    return () => clearTimeout(timer);
  }, [pending, confirmed]);
  useEffect(() => { if (error) setPending(null); }, [error]);
  function add(event: FormEvent) {
    event.preventDefault(); const video = youtubeId(url);
    if (!video) { setFormError('Cole um link válido: youtube.com/watch?v=… ou youtu.be/…'); return; }
    if (!title.trim()) { setFormError('Dê um nome ao vídeo para a turma reconhecer na fila.'); return; }
    if (state.queue.length >= 12 || state.queue.filter(c => c.by === self.id).length >= 3) { setFormError('A fila aceita 12 vídeos, com até 3 pedidos por pessoa.'); return; }
    if (state.current?.video === video || state.queue.some(c => c.video === video)) { setFormError('Esse vídeo já está na programação.'); return; }
    const id=crypto.randomUUID(); setPending(id); setFormError(''); send({ kind: 'add', video, title: title.trim(), id });
  }
  return <section className="house-theatre" aria-label={`Televisão · ${ROOMS[room].name}`} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
    <header><div><span><Tv size={15} /> A TV DA CASA</span><h2>{ROOMS[room].name}</h2></div><button ref={close} className="theatre-close" onClick={onClose} aria-label="Fechar televisão"><X size={19} /></button></header>
    {!available ? <p>A programação compartilhada ainda não está disponível nesta conexão.</p> : <>
      <div className="theatre-program">
        {state.current ? <>
          <div className="theatre-now"><small>{state.started === null ? 'SESSÃO PAUSADA' : 'NA TELA AGORA'}</small><h3>{state.current.title}</h3><span>Pedido de {state.current.name} · YouTube</span></div>
          {watching ? <YouTubeScreen state={state} onEnded={id => { if (mine) send({ kind: 'next', expected: id }); }} /> : <div className="theatre-watch"><Play size={30} /><p>Um vídeo, uma boa companhia.</p><button className="theatre-primary" onClick={() => setWatching(true)}><Play size={16} /> Assistir junto</button><small>Ao assistir, você carrega o player do YouTube. Seu volume é individual.</small></div>}
          <div className="theatre-video-links"><a href={`https://www.youtube.com/watch?v=${state.current.video}`} target="_blank" rel="noopener noreferrer">Abrir no YouTube <ExternalLink size={12} /></a>{watching && <button onClick={() => setWatching(false)}>Parar de assistir</button>}</div>
        </> : <div className="theatre-empty"><Tv size={30} /><h3>O que vamos assistir?</h3><p>Clipes, um show ou aquele vídeo que rende conversa. Escolha um link e coloque na fila.</p></div>}
      </div>
      <div className="theatre-host"><p>{dj ? <><strong>{mine ? 'Você' : dj.name}</strong> no controle</> : 'O controle está livre'}<small>{state.queue.length}/12 vídeos na fila</small></p>
        {!state.dj ? <button disabled={!ready} onClick={() => send({ kind: 'claim' })}>Assumir o controle</button> : mine ? <button onClick={() => send({ kind: 'release' })}>Passar a vez</button> : <small>Você também pode pedir um vídeo.</small>}
      </div>
      {mine && <div className="theatre-host-controls"><button disabled={!ready || !state.queue.length && !state.current} onClick={() => send({ kind: 'next' })}>{state.current ? <SkipForward size={15} /> : <Play size={15} />}{state.current ? state.queue.length ? 'Próximo vídeo' : 'Encerrar vídeo' : 'Colocar na tela'}</button>{state.current && <button onClick={() => send({ kind: state.started === null ? 'resume' : 'pause' })}>{state.started === null ? <Play size={15} /> : <Pause size={15} />}{state.started === null ? 'Retomar sessão' : 'Pausar sessão'}</button>}</div>}
      <details className="theatre-queue" open={!watching}><summary><ListMusic size={16} /> Fila e pedidos <span>{state.queue.length}</span></summary>
        <form onSubmit={add}>
          <label>Link do YouTube<input type="url" required maxLength={500} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtu.be/…" /></label>
          <label>Nome do vídeo<input required maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder="Artista · música ou nome do vídeo" /></label>
          <button className="theatre-primary" disabled={!ready || !!pending || state.queue.length >= 12} type="submit"><Plus size={15} /> {pending ? 'Enviando pedido…' : 'Adicionar à fila'}</button>
        </form>
        {formError && <p role="alert">{formError}</p>}
        {state.queue.length ? <ol>{state.queue.map(clip => <li key={clip.id}><span><strong>{clip.title}</strong><small>Pedido de {clip.name}</small></span>{(mine || clip.by === self.id) && <button aria-label={`Remover ${clip.title}`} onClick={() => send({ kind: 'remove', id: clip.id })}><X size={15} /></button>}</li>)}</ol> : <p className="theatre-note">A próxima escolha pode ser sua.</p>}
      </details>
      {error && <p role="alert">{error}</p>}
      <p className="theatre-note">O YouTube pode exibir anúncios ou restringir vídeos. A reprodução pode variar entre participantes.</p>
      <p className="theatre-connection">Modo exploração: a programação fica neste navegador. As sessões entre dispositivos ainda não estão disponíveis.</p>
    </>}
  </section>;
}
