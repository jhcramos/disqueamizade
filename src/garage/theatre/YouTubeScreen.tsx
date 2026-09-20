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
export function YouTubeScreen({ state, onEnded, surface, onSmallSurface, now = Date.now }: { now?: () => number; surface: HTMLDivElement | null; onSmallSurface: () => void; state: Screening; onEnded: (id: string) => void }) {
  const mount = useRef<HTMLDivElement>(null), player = useRef<Player>();
  const latest = useRef({ state, onEnded, now }); latest.current = { state, onEnded, now };
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [note, setNote] = useState(''), [volume, setVolume] = useState(35), [retry, setRetry] = useState(0);
  const volumeRef = useRef(volume); volumeRef.current = volume;
  // Move the existing iframe visually, never reparent it: reparenting reloads YouTube.
  useEffect(() => {
    const element = mount.current;
    if (!surface || !element) return;
    let frame = 0, stopped = false;
    function align() {
      frame = 0;
      if (stopped || !surface || !element) return;
      const rect = surface.getBoundingClientRect();
      if (!rect.width || !rect.height) return; // The 3D camera publishes its first projection next frame.
      if (rect.width < 200 || rect.height < 200) { stopped = true; onSmallSurface(); return; }
      Object.assign(element.style, { position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, zIndex: '65' });
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(align); }
    const observer = new ResizeObserver(schedule); observer.observe(surface);
    const projection = new MutationObserver(schedule); projection.observe(surface, { attributes: true, attributeFilter: ['style'] });
    window.addEventListener('resize', schedule); window.addEventListener('scroll', schedule, true);
    schedule();
    return () => { stopped = true; observer.disconnect(); projection.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', schedule); window.removeEventListener('scroll', schedule, true); element.removeAttribute('style'); };
  }, [surface, onSmallSurface]);
  const visible = () => {
    const rect = mount.current?.getBoundingClientRect();
    if (!rect || document.hidden || !rect.width || !rect.height) return false;
    let left = Math.max(0, rect.left), right = Math.min(innerWidth, rect.right);
    let top = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.bottom);
    // A panel can clip its child even when the child is inside the browser viewport.
    // The fixed cinema player escapes those scrolling ancestors.
    if (getComputedStyle(mount.current!).position !== 'fixed') {
      for (let parent = mount.current!.parentElement; parent; parent = parent.parentElement) {
        const css = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
        if (/auto|scroll|hidden|clip/.test(css.overflowX)) { left = Math.max(left, bounds.left); right = Math.min(right, bounds.right); }
        if (/auto|scroll|hidden|clip/.test(css.overflowY)) { top = Math.max(top, bounds.top); bottom = Math.min(bottom, bounds.bottom); }
      }
    }
    return Math.max(0, right - left) * Math.max(0, bottom - top) / (rect.width * rect.height) >= .5;
  };
  useEffect(() => {
    let timer = 0;
    const observer = new IntersectionObserver(([entry]) => {
      clearTimeout(timer);
      // Layout switches briefly move the screen. Pause only after its position settles.
      if (entry.intersectionRatio < .5) timer = window.setTimeout(() => {
        if (!visible() && player.current) { player.current.pauseVideo(); setNote('Reprodução pausada. Use “Acompanhar a sala” quando voltar.'); }
      }, 250);
    }, { threshold: .5 });
    if (mount.current) observer.observe(mount.current);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, []);
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
        playerVars: { autoplay: 0, controls: 1, playsinline: 1, origin: location.origin, start: Math.floor(playbackTime(latest.current.state,latest.current.now())) },
        events: {
          onReady: () => {
            if (!alive || !instance) return;
            clearTimeout(timeout);
            player.current = instance; instance.getIframe().title = `YouTube: ${clip.title}`;
            instance.setVolume(volumeRef.current); setReady(true); setError(''); setNote('');
            if (latest.current.state.started !== null && visible()) instance.playVideo();
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
    if (state.started === null || !visible()) player.current.pauseVideo();
    else { player.current.seekTo(playbackTime(state,latest.current.now()), true); player.current.playVideo(); }
  }, [state.started, state.offset, ready]);
  return <div className="theatre-screen">
    <div className="theatre-player" ref={mount} />
    {error && <p role="alert">{error} <button onClick={() => setRetry(n => n + 1)}>Tentar novamente</button></p>}
    {note && !error && <p role="status">{note}</p>}
    <div className="theatre-personal-controls">
      <label><Volume2 size={15} /><span className="sr-only">Volume do meu vídeo</span><input type="range" min="0" max="100" value={volume} onChange={e => { const n = Number(e.target.value); setVolume(n); player.current?.setVolume(n); }} /><small>{volume}%</small></label>
      <button disabled={!ready} onClick={() => { player.current?.seekTo(playbackTime(latest.current.state,latest.current.now()), true); if (latest.current.state.started !== null && visible()) player.current?.playVideo(); setNote(''); }}><RefreshCw size={13} /> Acompanhar a sala</button>
    </div>
  </div>;
}
