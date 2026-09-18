import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Volume2 } from 'lucide-react';
import { playbackTime, type Screening } from './model';

type Player = { destroy(): void; playVideo(): void; pauseVideo(): void; seekTo(seconds: number, allow: boolean): void; setVolume(volume: number): void; getIframe(): HTMLIFrameElement };
type YouTubeAPI = { Player: new (element: HTMLElement, options: object) => Player };
declare global { interface Window { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void } }
let loading: Promise<YouTubeAPI> | null = null;
function loadPlayer() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise<YouTubeAPI>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const script = document.createElement('script');
    const fail = () => { clearTimeout(timer); script.remove(); loading = null; reject(new Error('Não foi possível carregar o YouTube. Verifique sua conexão ou o bloqueador de conteúdo.')); };
    const timer = window.setTimeout(fail, 15000);
    window.onYouTubeIframeAPIReady = () => { previous?.(); clearTimeout(timer); if (window.YT) resolve(window.YT); else fail(); };
    script.src = 'https://www.youtube.com/iframe_api'; script.async = true; script.onerror = fail; document.head.appendChild(script);
  });
  return loading;
}
export function YouTubeScreen({ state, onEnded }: { state: Screening; onEnded: (id: string) => void }) {
  const mount = useRef<HTMLDivElement>(null), player = useRef<Player>();
  const latest = useRef({ state, onEnded }); latest.current = { state, onEnded };
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [note, setNote] = useState(''), [volume, setVolume] = useState(35), [retry, setRetry] = useState(0);
  const volumeRef = useRef(volume); volumeRef.current = volume;
  useEffect(() => {
    let alive = true, instance: Player | undefined;
    const timeout = window.setTimeout(() => { if (alive) setError('O player demorou para responder. Verifique sua conexão e tente novamente.'); }, 22000);
    setReady(false); setError(''); setNote('Carregando o player do YouTube…');
    const clip = latest.current.state.current; if (!clip) { clearTimeout(timeout); return; }
    const slot = document.createElement('div'); mount.current!.appendChild(slot);
    void loadPlayer().then(YT => {
      if (!alive) return;
      instance = new YT.Player(slot, {
        host: 'https://www.youtube-nocookie.com', videoId: clip.video,
        width: '100%', height: '100%',
        playerVars: { autoplay: 0, controls: 1, playsinline: 1, origin: location.origin, start: Math.floor(playbackTime(latest.current.state)) },
        events: {
          onReady: () => {
            if (!alive || !instance) return;
            clearTimeout(timeout);
            player.current = instance; instance.getIframe().title = `YouTube: ${clip.title}`;
            instance.setVolume(volumeRef.current); setReady(true); setError(''); setNote('');
            if (latest.current.state.started !== null && !document.hidden) instance.playVideo();
          },
          onAutoplayBlocked: () => { if (alive) setNote('Toque no play do YouTube para começar.'); },
          onError: (event: { data: number }) => { if (alive) setError([100, 101, 150].includes(event.data) ? 'Este vídeo foi removido, é privado ou não permite reprodução aqui. Escolha outro vídeo.' : 'O YouTube não conseguiu reproduzir este vídeo. Tente novamente ou escolha outro.'); },
          onStateChange: (event: { data: number }) => { if (alive && event.data === 0) latest.current.onEnded(clip.id); },
        },
      });
    }).catch(e => { if (alive) { setError(e.message); setNote(''); } });
    const visibility = () => { if (document.hidden) { instance?.pauseVideo(); if (alive) setNote('Reprodução pausada. Use “Acompanhar a sala” quando voltar.'); } };
    document.addEventListener('visibilitychange', visibility);
    return () => { alive = false; clearTimeout(timeout); setReady(false); player.current = undefined; instance?.destroy(); slot.remove(); mount.current?.replaceChildren(); document.removeEventListener('visibilitychange', visibility); };
  }, [state.current?.id, retry]);
  // Synchronize only on explicit room playback changes, never repeatedly seek over ads.
  useEffect(() => {
    if (!ready || !player.current) return;
    if (state.started === null || document.hidden) player.current.pauseVideo();
    else { player.current.seekTo(playbackTime(state), true); player.current.playVideo(); }
  }, [state.started, state.offset, ready]);
  return <div className="theatre-screen">
    <div className="theatre-player" ref={mount} />
    {error && <p role="alert">{error} <button onClick={() => setRetry(n => n + 1)}>Tentar novamente</button></p>}
    {note && !error && <p role="status">{note}</p>}
    <div className="theatre-personal-controls">
      <label><Volume2 size={15} /><span className="sr-only">Volume do meu vídeo</span><input type="range" min="0" max="100" value={volume} onChange={e => { const n = Number(e.target.value); setVolume(n); player.current?.setVolume(n); }} /><small>{volume}%</small></label>
      <button disabled={!ready} onClick={() => { player.current?.seekTo(playbackTime(latest.current.state), true); if (latest.current.state.started !== null) player.current?.playVideo(); setNote(''); }}><RefreshCw size={13} /> Acompanhar a sala</button>
    </div>
  </div>;
}
